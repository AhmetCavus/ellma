import { z } from "zod";
import { dateKeySchema, identifier, isoTimestamp } from "./contracts.js";

export const ASSISTANT_LIMITS = {
  messageLength: 2000,
  historyMessages: 12,
  toolRounds: 4,
} as const;

export const ASSISTANT_ACTION_KINDS = [
  "goal_created",
  "task_added",
  "task_completed",
  "time_logged",
  "focus_started",
  "milestone_added",
  "milestone_done",
] as const;

export const assistantActionSchema = z.object({
  kind: z.enum(ASSISTANT_ACTION_KINDS),
  label: z.string().max(300),
  targetId: z.string().nullable().default(null),
});
export type AssistantAction = z.infer<typeof assistantActionSchema>;

export const assistantMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  actions: z.array(assistantActionSchema).default([]),
  createdAt: isoTimestamp,
});
export type AssistantMessage = z.infer<typeof assistantMessageSchema>;

/** Where the user is in time; the server has no other way to know the user's calendar day. */
export const clientClockSchema = z.object({
  locale: z.enum(["en", "de"]).default("en"),
  today: dateKeySchema,
  utcOffsetMinutes: z
    .number()
    .int()
    .min(-14 * 60)
    .max(14 * 60),
});
export type ClientClock = z.infer<typeof clientClockSchema>;

/** What the user has on screen while talking, so "this goal" and "here" make sense. */
export const ASSISTANT_PAGES = ["goals", "goal", "today", "progress", "focus"] as const;
export const assistantViewSchema = z.object({
  page: z.enum(ASSISTANT_PAGES),
  goalId: identifier.nullable().default(null),
});
export type AssistantView = z.input<typeof assistantViewSchema>;

export const chatRequestSchema = clientClockSchema.extend({
  message: z.string().trim().min(1).max(ASSISTANT_LIMITS.messageLength),
  voice: z.boolean().default(false),
  view: assistantViewSchema.optional(),
});
export type ChatRequest = z.input<typeof chatRequestSchema>;

export const dailyNoteSchema = z.object({
  date: dateKeySchema,
  text: z.string(),
});
export type DailyNote = z.infer<typeof dailyNoteSchema>;

/** Server-sent events emitted by POST /api/ellma/assistant/chat. */
export type AssistantStreamEvent =
  | { type: "token"; text: string }
  | { type: "action"; action: AssistantAction }
  | { type: "done"; message: AssistantMessage }
  | { type: "error"; code: string };

export const assistantStreamEventSchema: z.ZodType<AssistantStreamEvent, z.ZodTypeDef, unknown> =
  z.discriminatedUnion("type", [
    z.object({ type: z.literal("token"), text: z.string() }),
    z.object({ type: z.literal("action"), action: assistantActionSchema }),
    z.object({ type: z.literal("done"), message: assistantMessageSchema }),
    z.object({ type: z.literal("error"), code: z.string() }),
  ]);

/** Parses a growing SSE buffer; returns complete events and the unconsumed remainder. */
export function parseEventStream(buffer: string): {
  events: AssistantStreamEvent[];
  rest: string;
} {
  const events: AssistantStreamEvent[] = [];
  const blocks = buffer.split("\n\n");
  const rest = blocks.pop() ?? "";
  for (const block of blocks) {
    const data = block
      .split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart())
      .join("\n");
    if (!data) {
      continue;
    }
    try {
      const parsed = assistantStreamEventSchema.safeParse(JSON.parse(data));
      if (parsed.success) {
        events.push(parsed.data);
      }
    } catch {
      /* Ignore malformed frames; the final "done" event carries the saved message. */
    }
  }
  return { events, rest };
}

/** Splits streamed text into speakable sentences so voice output can start early. */
export function takeSentences(buffer: string): { sentences: string[]; rest: string } {
  const sentences: string[] = [];
  // Punctuation only ends a sentence when whitespace follows, so "2.5 hours" stays whole.
  const pattern = /(?:[^.!?…\n]|[.!?…](?![\s"')\]]|$))+[.!?…]+["')\]]*\s+|[^\n]+\n+/g;
  let consumed = 0;
  for (const match of buffer.matchAll(pattern)) {
    if (match.index !== consumed) {
      break;
    }
    const sentence = match[0].trim();
    if (sentence) {
      sentences.push(sentence);
    }
    consumed += match[0].length;
  }
  return { sentences, rest: buffer.slice(consumed) };
}
