import type { Goal, Task } from "./contracts.js";
import { addDays } from "./dates.js";
import type { GoalPulse } from "./guide.js";

/**
 * Goals and Today share one way of narrowing and ordering: tags, statuses and a sort,
 * applied inside date groups. Everything here is pure so both pages and tests agree.
 */

export const DATE_GROUPS = ["overdue", "today", "tomorrow", "later", "none"] as const;
export type DateGroup = (typeof DATE_GROUPS)[number];

export function dateGroupOf(plannedOn: string | null, today: string): DateGroup {
  if (!plannedOn) {
    return "none";
  }
  if (plannedOn < today) {
    return "overdue";
  }
  if (plannedOn === today) {
    return "today";
  }
  return plannedOn === addDays(today, 1) ? "tomorrow" : "later";
}

export const GOAL_SORTS = ["position", "deadline", "title"] as const;
export type GoalSort = (typeof GOAL_SORTS)[number];
export const STEP_SORTS = ["position", "goal", "title"] as const;
export type StepSort = (typeof STEP_SORTS)[number];

/** Goals filter by their weekly state; steps by whether they are still open. */
export const GOAL_FILTER_STATUSES = ["ripe", "on_track", "behind", "resting"] as const;
export type GoalFilterStatus = (typeof GOAL_FILTER_STATUSES)[number];
export const STEP_FILTER_STATUSES = ["open", "done"] as const;
export type StepFilterStatus = (typeof STEP_FILTER_STATUSES)[number];

export type ViewFilter<Status extends string, Sort extends string> = {
  tags: string[];
  statuses: Status[];
  sort: Sort;
};
export type GoalsFilter = ViewFilter<GoalFilterStatus, GoalSort>;
export type TodayFilter = ViewFilter<StepFilterStatus, StepSort>;

export const EMPTY_GOALS_FILTER: GoalsFilter = { tags: [], statuses: [], sort: "position" };
export const EMPTY_TODAY_FILTER: TodayFilter = { tags: [], statuses: [], sort: "position" };

export function isFiltering(filter: { tags: string[]; statuses: string[] }): boolean {
  return filter.tags.length > 0 || filter.statuses.length > 0;
}

const sameTag = (left: string, right: string) =>
  left.localeCompare(right, undefined, { sensitivity: "accent" }) === 0;

/** A goal matches when it carries any of the chosen tags. */
export function hasAnyTag(goal: Goal | undefined, tags: readonly string[]): boolean {
  if (tags.length === 0) {
    return true;
  }
  return Boolean(goal?.tags.some((tag) => tags.some((chosen) => sameTag(tag, chosen))));
}

/** All tags in use, in a stable alphabetical order, each spelling once. */
export function allTags(goals: readonly Goal[]): string[] {
  const tags: string[] = [];
  for (const goal of goals) {
    for (const tag of goal.tags) {
      if (!tags.some((known) => sameTag(known, tag))) {
        tags.push(tag);
      }
    }
  }
  return tags.sort((left, right) => left.localeCompare(right));
}

const byText = (left: string, right: string) =>
  left.localeCompare(right, undefined, { sensitivity: "base", numeric: true });

/** The date that places a goal: its earliest scheduled open step. */
export function goalStepDate(goalId: string, tasks: readonly Task[]): string | null {
  let earliest: string | null = null;
  for (const task of tasks) {
    if (task.goalId === goalId && !task.doneAt && task.plannedOn) {
      if (earliest === null || task.plannedOn < earliest) {
        earliest = task.plannedOn;
      }
    }
  }
  return earliest;
}

export type Grouped<T> = { group: DateGroup; items: T[] }[];

function grouped<T>(items: T[], groupOf: (item: T) => DateGroup): Grouped<T> {
  return DATE_GROUPS.map((group) => ({
    group,
    items: items.filter((item) => groupOf(item) === group),
  })).filter((entry) => entry.items.length > 0);
}

/** Each active goal once, grouped by the date of its earliest scheduled open step. */
export function groupGoals(
  pulses: readonly GoalPulse[],
  tasks: readonly Task[],
  today: string,
  filter: GoalsFilter,
): Grouped<GoalPulse> {
  const visible = pulses.filter(
    (pulse) =>
      hasAnyTag(pulse.goal, filter.tags) &&
      (filter.statuses.length === 0 || filter.statuses.includes(pulse.state)),
  );
  const sorted = [...visible].sort((left, right) => {
    if (filter.sort === "deadline") {
      const a = left.goal.targetDate ?? "9999-99-99";
      const b = right.goal.targetDate ?? "9999-99-99";
      if (a !== b) {
        return a < b ? -1 : 1;
      }
    } else if (filter.sort === "title") {
      const order = byText(left.goal.title, right.goal.title);
      if (order !== 0) {
        return order;
      }
    }
    return left.goal.position - right.goal.position;
  });
  return grouped(sorted, (pulse) => dateGroupOf(goalStepDate(pulse.goal.id, tasks), today));
}

/**
 * Steps grouped by their own date. Steps of inactive goals count as steps without a goal,
 * so nothing disappears. Done steps are those finished today.
 */
export function groupSteps(
  tasks: readonly Task[],
  goals: readonly Goal[],
  today: string,
  filter: TodayFilter,
  doneOn: (task: Task) => string | null,
): { open: Grouped<Task>; done: Task[] } {
  const goalOf = (task: Task) => goals.find((goal) => goal.id === task.goalId);
  const wantOpen = filter.statuses.length === 0 || filter.statuses.includes("open");
  const wantDone = filter.statuses.length === 0 || filter.statuses.includes("done");
  const matches = (task: Task) => hasAnyTag(goalOf(task), filter.tags);
  const order = (left: Task, right: Task) => {
    if (filter.sort === "goal") {
      const a = goalOf(left);
      const b = goalOf(right);
      // Steps without a goal come last.
      const byGoal =
        a && b ? a.position - b.position || byText(a.title, b.title) : a ? -1 : b ? 1 : 0;
      if (byGoal !== 0) {
        return byGoal;
      }
    } else if (filter.sort === "title") {
      const byTitle = byText(left.title, right.title);
      if (byTitle !== 0) {
        return byTitle;
      }
    }
    return (
      (left.plannedOn ?? "").localeCompare(right.plannedOn ?? "") || left.position - right.position
    );
  };
  const open = wantOpen ? tasks.filter((task) => !task.doneAt && matches(task)).sort(order) : [];
  const done = wantDone
    ? tasks.filter((task) => task.doneAt && doneOn(task) === today && matches(task)).sort(order)
    : [];
  return { open: grouped(open, (task) => dateGroupOf(task.plannedOn, today)), done };
}

/** Why a goal needs attention, when it does. Specific reasons beat a generic badge. */
export type GoalAttention = "step_overdue" | "no_next_step" | null;

export function goalAttention(pulse: GoalPulse): GoalAttention {
  if (pulse.overdueTasks.length > 0) {
    return "step_overdue";
  }
  return pulse.nextTask ? null : "no_next_step";
}

/** The groups a goal can be dropped on; overdue is where steps end up, not a choice. */
export const PLAN_TARGETS = ["today", "tomorrow", "later", "none"] as const;
export type PlanTarget = (typeof PLAN_TARGETS)[number];

/** The day a drop on a group plans for: "later" means the day after tomorrow. */
export function planTargetDate(target: PlanTarget, today: string): string | null {
  return target === "none"
    ? null
    : addDays(today, target === "today" ? 0 : target === "tomorrow" ? 1 : 2);
}

export type GoalPlan =
  | { kind: "moves"; moves: { taskId: string; plannedOn: string | null }[] }
  | { kind: "needs_step"; plannedOn: string | null };

/**
 * Dropping a goal on a day plans its next step for that day. Steps planned before that day
 * would keep the goal in an earlier group, so they come along; nothing else moves. "No date"
 * takes every planned step off the calendar. A goal without an open step needs one first.
 */
export function planGoal(
  goalId: string,
  tasks: readonly Task[],
  target: PlanTarget,
  today: string,
): GoalPlan {
  const plannedOn = planTargetDate(target, today);
  const open = tasks
    .filter((task) => task.goalId === goalId && !task.doneAt)
    .sort((left, right) => left.position - right.position);
  if (open.length === 0) {
    return { kind: "needs_step", plannedOn };
  }
  const scheduled = open
    .filter((task) => task.plannedOn !== null)
    .sort((left, right) => (left.plannedOn ?? "").localeCompare(right.plannedOn ?? ""));
  if (plannedOn === null) {
    return {
      kind: "moves",
      moves: scheduled.map((task) => ({ taskId: task.id, plannedOn: null })),
    };
  }
  const earlier = scheduled.filter((task) => (task.plannedOn ?? "") < plannedOn);
  if (earlier.length > 0) {
    return { kind: "moves", moves: earlier.map((task) => ({ taskId: task.id, plannedOn })) };
  }
  const next = scheduled[0] ?? open[0];
  const alreadyThere =
    next?.plannedOn !== null &&
    next?.plannedOn !== undefined &&
    dateGroupOf(next.plannedOn, today) === target;
  return {
    kind: "moves",
    moves: next && !alreadyThere ? [{ taskId: next.id, plannedOn }] : [],
  };
}
