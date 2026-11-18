import type { FocusSession, Goal, Task } from "./contracts.js";
import { toDateKey, weekDays } from "./dates.js";

export const UNASSIGNED = "unassigned";

export function sessionSeconds(session: FocusSession, now: Date = new Date()): number {
  const end = session.endedAt ? Date.parse(session.endedAt) : now.getTime();
  return Math.max(0, Math.floor((end - Date.parse(session.startedAt)) / 1000));
}

export type GoalWeek = {
  goalId: string;
  seconds: number;
  targetSeconds: number;
  perDay: number[];
};

export type WeekReview = {
  days: string[];
  totalSeconds: number;
  perDay: number[];
  goals: GoalWeek[];
  completedTasks: number;
  bestDay: string | null;
};

/**
 * Splits each session at local midnights so late sessions count toward the day they ran on.
 */
export function splitByDay(session: FocusSession, now: Date = new Date()): Map<string, number> {
  const parts = new Map<string, number>();
  let cursor = new Date(session.startedAt);
  const end = session.endedAt ? new Date(session.endedAt) : now;
  while (cursor < end) {
    const nextMidnight = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1);
    const sliceEnd = nextMidnight < end ? nextMidnight : end;
    const key = toDateKey(cursor);
    const seconds = Math.floor((sliceEnd.getTime() - cursor.getTime()) / 1000);
    parts.set(key, (parts.get(key) ?? 0) + seconds);
    cursor = sliceEnd;
  }
  return parts;
}

export function reviewWeek(
  weekStart: string,
  sessions: FocusSession[],
  goals: Goal[],
  tasks: Task[],
  now: Date = new Date(),
): WeekReview {
  const days = weekDays(weekStart);
  const dayIndex = new Map(days.map((day, index) => [day, index]));
  const byGoal = new Map<string, GoalWeek>();
  const perDay = days.map(() => 0);
  const goalFor = (goalId: string): GoalWeek => {
    const existing = byGoal.get(goalId);
    if (existing) {
      return existing;
    }
    const goal = goals.find((candidate) => candidate.id === goalId);
    const created: GoalWeek = {
      goalId,
      seconds: 0,
      targetSeconds: (goal?.weeklyTargetMinutes ?? 0) * 60,
      perDay: days.map(() => 0),
    };
    byGoal.set(goalId, created);
    return created;
  };
  for (const goal of goals) {
    if (goal.status === "active" && goal.weeklyTargetMinutes > 0) {
      goalFor(goal.id);
    }
  }
  for (const session of sessions) {
    const entry = goalFor(session.goalId ?? UNASSIGNED);
    for (const [day, seconds] of splitByDay(session, now)) {
      const index = dayIndex.get(day);
      if (index === undefined) {
        continue;
      }
      entry.seconds += seconds;
      entry.perDay[index] = (entry.perDay[index] ?? 0) + seconds;
      perDay[index] = (perDay[index] ?? 0) + seconds;
    }
  }
  const completedTasks = tasks.filter(
    (task) => task.doneAt && dayIndex.has(toDateKey(new Date(task.doneAt))),
  ).length;
  const maxDay = Math.max(...perDay);
  return {
    days,
    totalSeconds: perDay.reduce((sum, value) => sum + value, 0),
    perDay,
    goals: [...byGoal.values()]
      .filter((entry) => entry.seconds > 0 || entry.targetSeconds > 0)
      .sort((left, right) => right.seconds - left.seconds),
    completedTasks,
    bestDay: maxDay > 0 ? (days[perDay.indexOf(maxDay)] ?? null) : null,
  };
}

/** "1:05:09" for the live timer. */
export function formatClock(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const mm = String(minutes).padStart(hours > 0 ? 2 : 1, "0");
  const ss = String(seconds).padStart(2, "0");
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** "2h 05m" / "45m" for summaries. */
export function formatDuration(totalSeconds: number): string {
  const minutes = Math.round(totalSeconds / 60);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) {
    return `${rest}m`;
  }
  return `${hours}h ${String(rest).padStart(2, "0")}m`;
}

/** Goal hours with one decimal ("3.5"). */
export function goalHours(totalSeconds: number): string {
  return (Math.round((totalSeconds / 3600) * 10) / 10).toFixed(1);
}
