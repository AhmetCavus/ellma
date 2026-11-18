import type { FocusSession, Goal, Task } from "./contracts.js";
import { daysBetween, startOfWeek, toDateKey, weekdayIndex } from "./dates.js";
import { reviewWeek } from "./review.js";

/** How one goal is doing this week, and what could move it forward next. */
export type GoalPulse = {
  goal: Goal;
  weekSeconds: number;
  targetSeconds: number;
  /** Share of the weekly target reached, 0–1. Without a target, any focused time counts as full. */
  ratio: number;
  state: "ripe" | "on_track" | "behind" | "resting";
  todayTasks: Task[];
  overdueTasks: Task[];
  /** Open steps that are not planned for today: unplanned first, then upcoming by day. */
  backlog: Task[];
  nextTask: Task | null;
  milestonesDone: number;
  milestonesTotal: number;
  nextMilestone: string | null;
  daysLeft: number | null;
};

/** The single thing Ellma suggests right now. The UI turns it into a sentence and a button. */
export type GuideStep =
  | { kind: "focus_running"; taskId: string | null; goalId: string | null }
  | { kind: "first_goal" }
  | { kind: "carry_over"; taskIds: string[] }
  | { kind: "start_task"; taskId: string; goalId: string | null }
  | { kind: "next_step"; goalId: string }
  | { kind: "plan_today"; taskId: string; goalId: string | null }
  | { kind: "weekly_gap"; goalId: string; remainingSeconds: number }
  | { kind: "day_done"; doneToday: number; spareTaskId: string | null };

export type GuideInput = {
  goals: Goal[];
  tasks: Task[];
  /** Focus sessions of the current week. */
  sessions: FocusSession[];
  active: FocusSession | null;
  today: string;
  now?: Date;
};

export type Guide = { step: GuideStep; pulses: GoalPulse[]; doneToday: number };

const byPosition = (left: Task, right: Task) => left.position - right.position;

function pulseOf(goal: Goal, input: GuideInput, weekSeconds: number): GoalPulse {
  const { today } = input;
  const open = input.tasks.filter((task) => task.goalId === goal.id && !task.doneAt);
  const todayTasks = open.filter((task) => task.plannedOn === today).sort(byPosition);
  const overdueTasks = open
    .filter((task) => task.plannedOn !== null && task.plannedOn < today)
    .sort((left, right) => (left.plannedOn ?? "").localeCompare(right.plannedOn ?? ""));
  const backlog = open
    .filter((task) => task.plannedOn === null || task.plannedOn > today)
    .sort(
      (left, right) =>
        (left.plannedOn ?? "").localeCompare(right.plannedOn ?? "") || byPosition(left, right),
    );
  const targetSeconds = goal.weeklyTargetMinutes * 60;
  const ratio =
    targetSeconds > 0 ? Math.min(1, weekSeconds / targetSeconds) : weekSeconds > 0 ? 1 : 0;
  // By Sunday the whole target is due; a goal is "behind" when it trails that pace clearly.
  // A goal created this week is only measured from the day it was planted.
  const weekStart = startOfWeek(today);
  const planted = toDateKey(new Date(goal.createdAt));
  const firstDay = planted > weekStart && planted <= today ? weekdayIndex(planted) : 0;
  const expected = (weekdayIndex(today) - firstDay + 1) / (7 - firstDay);
  const state: GoalPulse["state"] =
    targetSeconds === 0
      ? weekSeconds > 0
        ? "on_track"
        : "resting"
      : ratio >= 1
        ? "ripe"
        : ratio < expected - 0.25
          ? "behind"
          : "on_track";
  const pendingMilestone = goal.milestones.find((milestone) => !milestone.doneAt);
  return {
    goal,
    weekSeconds,
    targetSeconds,
    ratio,
    state,
    todayTasks,
    overdueTasks,
    backlog,
    nextTask: todayTasks[0] ?? overdueTasks[0] ?? backlog[0] ?? null,
    milestonesDone: goal.milestones.filter((milestone) => milestone.doneAt).length,
    milestonesTotal: goal.milestones.length,
    nextMilestone: pendingMilestone?.title ?? null,
    daysLeft: goal.targetDate ? daysBetween(today, goal.targetDate) : null,
  };
}

/**
 * Decides what matters most right now. Deterministic and instant, so guidance never waits
 * for the language model.
 */
export function buildGuide(input: GuideInput): Guide {
  const now = input.now ?? new Date();
  const { today } = input;
  const review = reviewWeek(startOfWeek(today), input.sessions, input.goals, input.tasks, now);
  const weekSeconds = new Map(review.goals.map((entry) => [entry.goalId, entry.seconds]));
  const pulses = input.goals
    .filter((goal) => goal.status === "active")
    .map((goal) => pulseOf(goal, input, weekSeconds.get(goal.id) ?? 0));
  const doneToday = input.tasks.filter(
    (task) => task.doneAt && toDateKey(new Date(task.doneAt)) === today,
  ).length;
  const done = (step: GuideStep): Guide => ({ step, pulses, doneToday });

  if (input.active) {
    const task = input.tasks.find((entry) => entry.id === input.active?.taskId);
    return done({
      kind: "focus_running",
      taskId: input.active.taskId,
      goalId: input.active.goalId ?? task?.goalId ?? null,
    });
  }
  if (pulses.length === 0) {
    return done({ kind: "first_goal" });
  }

  const open = input.tasks.filter((task) => !task.doneAt);
  const overdue = open.filter((task) => task.plannedOn !== null && task.plannedOn < today);
  if (overdue.length > 0) {
    return done({ kind: "carry_over", taskIds: overdue.map((task) => task.id) });
  }

  // The goal that needs attention most comes first: lowest share of its weekly target.
  const neediest = [...pulses].sort((left, right) => left.ratio - right.ratio);
  const ratioOf = (goalId: string | null) =>
    pulses.find((pulse) => pulse.goal.id === goalId)?.ratio ?? 2;

  const plannedToday = open
    .filter((task) => task.plannedOn === today)
    .sort((left, right) => ratioOf(left.goalId) - ratioOf(right.goalId) || byPosition(left, right));
  const first = plannedToday[0];
  if (first) {
    return done({ kind: "start_task", taskId: first.id, goalId: first.goalId });
  }

  const stepless = neediest.find(
    (pulse) => pulse.todayTasks.length + pulse.overdueTasks.length + pulse.backlog.length === 0,
  );
  if (stepless) {
    return done({ kind: "next_step", goalId: stepless.goal.id });
  }

  const spare =
    neediest.find((pulse) => pulse.backlog.length > 0)?.backlog[0] ??
    open.find((task) => task.goalId === null) ??
    null;
  if (doneToday === 0 && spare) {
    return done({ kind: "plan_today", taskId: spare.id, goalId: spare.goalId });
  }

  const behind = neediest.find((pulse) => pulse.state === "behind");
  if (behind && doneToday === 0) {
    return done({
      kind: "weekly_gap",
      goalId: behind.goal.id,
      remainingSeconds: Math.max(0, behind.targetSeconds - behind.weekSeconds),
    });
  }
  return done({ kind: "day_done", doneToday, spareTaskId: spare?.id ?? null });
}
