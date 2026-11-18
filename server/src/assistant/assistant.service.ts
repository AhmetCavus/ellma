import {
  ASSISTANT_LIMITS,
  assistantMessageSchema,
  chatRequestSchema,
  clientClockSchema,
  type ASSISTANT_PAGES,
  type AssistantAction,
  type AssistantMessage,
  type AssistantStreamEvent,
} from "@ellma/shared";
import AssistantMessageModel, {
  type AssistantMessageRecord,
} from "../models/assistantMessage.model.js";
import DailyNoteModel from "../models/dailyNote.model.js";
import type { Account } from "../platform/access.js";
import { EllmaError } from "../platform/errors.js";
import { buildSnapshot } from "./assistant.context.js";
import { dailyNotePrompt, snapshotMessage, systemPrompt } from "./assistant.prompt.js";
import { ASSISTANT_TOOLS, runTool } from "./assistant.tools.js";
import { completeChat, streamChat, type OllamaMessage } from "./ollama.client.js";

type AssistantPage = (typeof ASSISTANT_PAGES)[number];

// The local model serves one reply at a time per person; a second tab must wait.
const busyOwners = new Set<string>();

type StoredMessage = AssistantMessageRecord & { _id: unknown };

function toMessage(record: StoredMessage): AssistantMessage {
  return assistantMessageSchema.parse({
    id: String(record._id),
    role: record.role,
    content: record.content,
    actions: record.actions ?? [],
    createdAt: record.createdAt.toISOString(),
  });
}

export async function listMessages(ownerId: string): Promise<AssistantMessage[]> {
  const records = await AssistantMessageModel.model
    .find({ ownerId })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean<StoredMessage[]>();
  return records.reverse().map(toMessage);
}

export async function clearMessages(ownerId: string) {
  const result = await AssistantMessageModel.model.deleteMany({ ownerId });
  return { cleared: result.deletedCount };
}

function historyForModel(messages: AssistantMessage[]): OllamaMessage[] {
  return messages.slice(-ASSISTANT_LIMITS.historyMessages).map((message) =>
    message.role === "user"
      ? { role: "user", content: message.content }
      : {
          role: "assistant",
          content:
            message.content +
            (message.actions.length
              ? `\n[Actions done: ${message.actions.map((entry) => `${entry.kind} ${entry.label}`).join("; ")}]`
              : ""),
        },
  );
}

const VIEW_LINES: Record<AssistantPage, string> = {
  goals: "The user is looking at the overview of all their goals.",
  goal: "The user is looking at one goal.",
  today: "The user is looking at their plan for today.",
  progress: "The user is looking at this week's progress.",
  focus: "The user is in focus mode.",
};

/** Tells the model what is on screen, so "this goal" or "here" resolve to the right thing. */
export function describeView(page: AssistantPage | undefined, goalTitle: string | null): string {
  if (!page) {
    return "";
  }
  return goalTitle
    ? `On screen: the goal "${goalTitle}". "This goal", "it" or "here" mean "${goalTitle}"; use it whenever the user names no goal.`
    : `On screen: ${VIEW_LINES[page]}`;
}

export async function chat(
  account: Account,
  input: unknown,
  emit: (event: AssistantStreamEvent) => void,
  signal: AbortSignal,
): Promise<void> {
  const request = chatRequestSchema.parse(input);
  if (busyOwners.has(account.id)) {
    throw new EllmaError(409, "assistant_busy");
  }
  busyOwners.add(account.id);
  try {
    const history = await listMessages(account.id);
    await AssistantMessageModel.model.create({
      ownerId: account.id,
      role: "user",
      content: request.message,
      actions: [],
      createdAt: new Date(),
    });
    const snapshot = await buildSnapshot(account, request);
    const viewGoal = snapshot.goals.find((goal) => goal.id === request.view?.goalId) ?? null;
    const messages: OllamaMessage[] = [
      { role: "system", content: systemPrompt(request.locale) },
      ...historyForModel(history),
      {
        role: "system",
        content: snapshotMessage(
          snapshot.text,
          request.voice,
          describeView(request.view?.page, viewGoal?.title ?? null),
        ),
      },
      { role: "user", content: request.message },
    ];
    const actions: AssistantAction[] = [];
    let reply = "";
    for (let round = 0; round < ASSISTANT_LIMITS.toolRounds; round++) {
      // The last round withholds tools so the model has to answer in words.
      const tools = round < ASSISTANT_LIMITS.toolRounds - 1 ? ASSISTANT_TOOLS : [];
      const stream = streamChat(messages, tools, signal);
      let text = "";
      let next = await stream.next();
      while (!next.done) {
        text += next.value;
        emit({ type: "token", text: next.value });
        next = await stream.next();
      }
      const toolCalls = next.value;
      reply += text;
      if (toolCalls.length === 0) {
        break;
      }
      messages.push({ role: "assistant", content: text, tool_calls: toolCalls });
      for (const call of toolCalls.slice(0, 5)) {
        const outcome = await runTool(call, {
          ownerId: account.id,
          clock: request,
          snapshot,
          viewGoal,
        }).catch((error: unknown) => ({
          result: { error: error instanceof EllmaError ? error.message : "failed" },
          action: null,
        }));
        if (outcome.action) {
          actions.push(outcome.action);
          emit({ type: "action", action: outcome.action });
        }
        messages.push({
          role: "tool",
          tool_name: call.function.name,
          content: JSON.stringify(outcome.result),
        });
      }
      if (text) {
        reply += "\n";
        emit({ type: "token", text: "\n" });
      }
    }
    const created = await AssistantMessageModel.model.create({
      ownerId: account.id,
      role: "assistant",
      content: reply.trim(),
      actions,
      createdAt: new Date(),
    });
    emit({ type: "done", message: toMessage(created.toObject() as StoredMessage) });
  } finally {
    busyOwners.delete(account.id);
  }
}

const dailyInFlight = new Map<string, Promise<{ date: string; text: string }>>();

export async function dailyNote(account: Account, input: unknown, signal: AbortSignal) {
  const clock = clientClockSchema.parse(input);
  const existing = await DailyNoteModel.model
    .findOne({ ownerId: account.id, date: clock.today, locale: clock.locale })
    .lean<{ text: string } | null>();
  if (existing?.text) {
    return { date: clock.today, text: existing.text };
  }
  const key = `${account.id}:${clock.today}:${clock.locale}`;
  const pending = dailyInFlight.get(key);
  if (pending) {
    return pending;
  }
  const generation = (async () => {
    const snapshot = await buildSnapshot(account, clock);
    const text = (
      await completeChat(
        [
          { role: "system", content: systemPrompt(clock.locale) },
          { role: "system", content: snapshotMessage(snapshot.text, false) },
          { role: "user", content: dailyNotePrompt() },
        ],
        signal,
      )
    ).trim();
    if (!text) {
      throw new EllmaError(503, "assistant_unavailable");
    }
    await DailyNoteModel.model.updateOne(
      { ownerId: account.id, date: clock.today, locale: clock.locale },
      { text, createdAt: new Date() },
      { upsert: true },
    );
    return { date: clock.today, text };
  })();
  dailyInFlight.set(key, generation);
  try {
    return await generation;
  } finally {
    dailyInFlight.delete(key);
  }
}

/** Notes depend on tasks and progress, so a change during the day makes the cached note stale. */
export async function forgetDailyNotes(ownerId: string): Promise<void> {
  await DailyNoteModel.model.deleteMany({ ownerId });
}
