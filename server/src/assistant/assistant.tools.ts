import { randomUUID } from "node:crypto";
import type { AssistantAction, ClientClock, Goal, Task } from "@ellma/shared";
import { z } from "zod";
import { createGoal, updateGoal } from "../goals/goal.service.js";
import { createTask, updateTask } from "../tasks/task.service.js";
import { logSession, startFocus } from "../focus/focus.service.js";
import type { Snapshot } from "./assistant.context.js";
import { bestMatch, resolveDate, resolveDeadline } from "./matching.js";
import type { OllamaTool, OllamaToolCall } from "./ollama.client.js";

const text = (description: string) => ({ type: "string", description });
const number = (description: string) => ({ type: "number", description });
const tool = (
  name: string,
  description: string,
  properties: Record<string, unknown>,
  required: string[] = [],
): OllamaTool => ({
  type: "function",
  function: { name, description, parameters: { type: "object", properties, required } },
});

const DATE_HINT =
  'Day as "today", "tomorrow", a weekday name or YYYY-MM-DD. Omit to leave unplanned.';

export const ASSISTANT_TOOLS: OllamaTool[] = [
  tool(
    "create_goal",
    "Create a new long-term goal for the user once they have described it.",
    {
      title: text("Short goal name, e.g. 'Run a half marathon'"),
      why: text("Why it matters to the user, in their words"),
      weekly_hours: number("Hours per week the user wants to invest"),
      deadline: text("Deadline as the user said it, e.g. 'April' or '2027-04-30'"),
    },
    ["title"],
  ),
  tool(
    "add_task",
    "Add a concrete next step (task), optionally linked to a goal and planned for a day.",
    {
      title: text("Short, actionable task title starting with a verb"),
      goal: text("Name of the existing goal this task belongs to"),
      day: text(DATE_HINT),
    },
    ["title"],
  ),
  tool("complete_task", "Mark an existing open task as done.", { task: text("Task title") }, [
    "task",
  ]),
  tool(
    "reschedule_task",
    "Move an existing open task to another day.",
    { task: text("Task title"), day: text(DATE_HINT) },
    ["task", "day"],
  ),
  tool(
    "log_time",
    "Record time the user already spent working on a goal (just finished).",
    { goal: text("Goal name"), minutes: number("Minutes spent") },
    ["minutes"],
  ),
  tool("start_focus", "Start a focus timer for a task or goal right now.", {
    task: text("Task title, if any"),
    goal: text("Goal name, if no task"),
  }),
  tool(
    "add_milestone",
    "Add a milestone (a checkpoint worth celebrating) to a goal.",
    { goal: text("Goal name"), title: text("Milestone") },
    ["goal", "title"],
  ),
  tool(
    "complete_milestone",
    "Mark a milestone of a goal as reached.",
    { goal: text("Goal name"), milestone: text("Milestone title") },
    ["goal", "milestone"],
  ),
];

export type ToolOutcome = { result: Record<string, unknown>; action: AssistantAction | null };

type Context = {
  ownerId: string;
  clock: ClientClock;
  snapshot: Snapshot;
  /** The goal the user has on screen; used when they name none. */
  viewGoal?: Goal | null;
};

const optionalText = z
  .unknown()
  .transform((value) => (typeof value === "string" && value.trim() ? value.trim() : undefined));

function findGoal(context: Context, name: unknown): Goal | { error: string; options?: string[] } {
  const query = optionalText.parse(name);
  if (!query) {
    return context.viewGoal ?? { error: "goal_name_missing" };
  }
  const result = bestMatch(query, context.snapshot.goals, (goal) => goal.title);
  if (result.match) {
    return result.match;
  }
  return {
    error: result.candidates.length ? "goal_ambiguous" : "goal_not_found",
    options: (result.candidates.length ? result.candidates : context.snapshot.goals)
      .slice(0, 6)
      .map((goal) => goal.title),
  };
}

function findOpenTask(
  context: Context,
  name: unknown,
): Task | { error: string; options?: string[] } {
  const query = optionalText.parse(name);
  const open = context.snapshot.tasks.filter((task) => !task.doneAt);
  if (!query) {
    return { error: "task_name_missing" };
  }
  const result = bestMatch(query, open, (task) => task.title);
  if (result.match) {
    return result.match;
  }
  return {
    error: result.candidates.length ? "task_ambiguous" : "task_not_found",
    options: result.candidates.map((task) => task.title),
  };
}

const isProblem = (value: object): value is { error: string } => "error" in value;

function action(kind: AssistantAction["kind"], label: string, targetId: string | null = null) {
  return { kind, label: label.slice(0, 300), targetId };
}

/** Executes one model tool call. Every write goes through the same services as the UI. */
export async function runTool(call: OllamaToolCall, context: Context): Promise<ToolOutcome> {
  const args = call.function.arguments;
  const { ownerId, clock, snapshot } = context;
  switch (call.function.name) {
    case "create_goal": {
      const title = optionalText.parse(args.title);
      if (!title) {
        return { result: { error: "title_missing" }, action: null };
      }
      const hours = Number(args.weekly_hours);
      const deadline = resolveDeadline(args.deadline, clock.today);
      const goal = await createGoal(ownerId, {
        title,
        why: optionalText.parse(args.why) ?? "",
        weeklyTargetMinutes:
          Number.isFinite(hours) && hours > 0 ? Math.min(Math.round(hours * 60), 7 * 24 * 60) : 0,
        targetDate: deadline,
      });
      snapshot.goals.push(goal);
      return {
        result: { ok: true, goal: goal.title },
        action: action("goal_created", goal.title, goal.id),
      };
    }
    case "add_task": {
      const title = optionalText.parse(args.title);
      if (!title) {
        return { result: { error: "title_missing" }, action: null };
      }
      let goalId: string | null = null;
      if (optionalText.parse(args.goal)) {
        const goal = findGoal(context, args.goal);
        if (isProblem(goal)) {
          return { result: goal, action: null };
        }
        goalId = goal.id;
      } else {
        goalId = context.viewGoal?.id ?? null;
      }
      const plannedOn = resolveDate(args.day, clock.today) ?? null;
      const task = await createTask(ownerId, { title, goalId, plannedOn });
      snapshot.tasks.push(task);
      return {
        result: { ok: true, task: task.title, plannedOn: plannedOn ?? "unplanned" },
        action: action("task_added", task.title, task.id),
      };
    }
    case "complete_task": {
      const task = findOpenTask(context, args.task);
      if (isProblem(task)) {
        return { result: task, action: null };
      }
      const updated = await updateTask(ownerId, task.id, { done: true });
      Object.assign(task, updated);
      return {
        result: { ok: true, completed: task.title },
        action: action("task_completed", task.title, task.id),
      };
    }
    case "reschedule_task": {
      const task = findOpenTask(context, args.task);
      if (isProblem(task)) {
        return { result: task, action: null };
      }
      const plannedOn = resolveDate(args.day, clock.today);
      if (plannedOn === undefined) {
        return { result: { error: "day_not_understood" }, action: null };
      }
      const updated = await updateTask(ownerId, task.id, { plannedOn });
      Object.assign(task, updated);
      return {
        result: { ok: true, task: task.title, plannedOn: plannedOn ?? "unplanned" },
        action: action("task_added", task.title, task.id),
      };
    }
    case "log_time": {
      const minutes = Math.round(Number(args.minutes));
      if (!Number.isFinite(minutes) || minutes < 1 || minutes > 16 * 60) {
        return { result: { error: "minutes_invalid" }, action: null };
      }
      let goalId: string | null = null;
      let label = "";
      if (optionalText.parse(args.goal) || context.viewGoal) {
        const goal = findGoal(context, args.goal);
        if (isProblem(goal)) {
          return { result: goal, action: null };
        }
        goalId = goal.id;
        label = goal.title;
      }
      const endedAt = new Date();
      const session = await logSession(ownerId, {
        goalId,
        startedAt: new Date(endedAt.getTime() - minutes * 60_000).toISOString(),
        endedAt: endedAt.toISOString(),
      });
      return {
        result: { ok: true, minutes, goal: label || "none" },
        action: action("time_logged", `${minutes} min${label ? ` · ${label}` : ""}`, session.id),
      };
    }
    case "start_focus": {
      let taskId: string | null = null;
      let goalId: string | null = null;
      let label = "";
      if (optionalText.parse(args.task)) {
        const task = findOpenTask(context, args.task);
        if (isProblem(task)) {
          return { result: task, action: null };
        }
        taskId = task.id;
        label = task.title;
      } else if (optionalText.parse(args.goal) || context.viewGoal) {
        const goal = findGoal(context, args.goal);
        if (isProblem(goal)) {
          return { result: goal, action: null };
        }
        goalId = goal.id;
        label = goal.title;
      }
      const state = await startFocus(ownerId, { taskId, goalId });
      return {
        result: { ok: true, focusingOn: label || "free focus" },
        action: action("focus_started", label, state.active?.id ?? null),
      };
    }
    case "add_milestone":
    case "complete_milestone": {
      const goal = findGoal(context, args.goal);
      if (isProblem(goal)) {
        return { result: goal, action: null };
      }
      const milestones = [...goal.milestones];
      let label: string;
      if (call.function.name === "add_milestone") {
        const title = optionalText.parse(args.title);
        if (!title) {
          return { result: { error: "title_missing" }, action: null };
        }
        milestones.push({ id: randomUUID().slice(0, 12), title, doneAt: null });
        label = title;
      } else {
        const found = bestMatch(
          String(args.milestone ?? ""),
          milestones,
          (milestone) => milestone.title,
        );
        if (!found.match) {
          return {
            result: {
              error: "milestone_not_found",
              options: milestones.map((milestone) => milestone.title),
            },
            action: null,
          };
        }
        const index = milestones.indexOf(found.match);
        milestones[index] = { ...found.match, doneAt: new Date().toISOString() };
        label = found.match.title;
      }
      const updated = await updateGoal(ownerId, goal.id, { ...goal, milestones });
      Object.assign(goal, updated);
      return {
        result: { ok: true, goal: goal.title, milestone: label },
        action: action(
          call.function.name === "add_milestone" ? "milestone_added" : "milestone_done",
          `${label} · ${goal.title}`,
          goal.id,
        ),
      };
    }
    default:
      return { result: { error: "unknown_tool" }, action: null };
  }
}
