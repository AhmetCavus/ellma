import { addDays, startOfWeek, type ClientClock, type Goal, type Task } from "@ellma/shared";
import { listGoals } from "../goals/goal.service.js";
import { listTasks } from "../tasks/task.repository.js";
import { listOverlapping } from "../focus/focus.repository.js";
import type { Account } from "../platform/access.js";
import { weekdayName } from "./matching.js";

export type Snapshot = {
  goals: Goal[];
  tasks: Task[];
  weekSecondsByGoal: Map<string, number>;
  text: string;
};

/** Converts the user's calendar day to the UTC instant of their local midnight. */
export function localMidnightUtc(key: string, utcOffsetMinutes: number): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1) + utcOffsetMinutes * 60_000);
}

function hours(seconds: number): string {
  return `${(Math.round((seconds / 3600) * 10) / 10).toFixed(1)}h`;
}

/** A compact, factual snapshot; small local models stay grounded when the facts are explicit. */
export async function buildSnapshot(account: Account, clock: ClientClock): Promise<Snapshot> {
  const weekStart = startOfWeek(clock.today);
  const now = new Date();
  const [goals, tasks, sessions] = await Promise.all([
    listGoals(account.id),
    listTasks(account.id, { from: weekStart, to: addDays(clock.today, 7) }),
    listOverlapping(account.id, localMidnightUtc(weekStart, clock.utcOffsetMinutes), now),
  ]);
  const weekStartUtc = localMidnightUtc(weekStart, clock.utcOffsetMinutes).getTime();
  const weekSecondsByGoal = new Map<string, number>();
  for (const session of sessions) {
    const start = Math.max(Date.parse(session.startedAt), weekStartUtc);
    const end = session.endedAt ? Date.parse(session.endedAt) : now.getTime();
    const key = session.goalId ?? "none";
    weekSecondsByGoal.set(
      key,
      (weekSecondsByGoal.get(key) ?? 0) + Math.max(0, (end - start) / 1000),
    );
  }
  const goalTitle = (id: string | null) => goals.find((goal) => goal.id === id)?.title ?? null;
  const describeTask = (task: Task) => {
    const goal = goalTitle(task.goalId);
    return `"${task.title}"${goal ? ` (goal: ${goal})` : ""}`;
  };
  const active = goals.filter((goal) => goal.status === "active");
  const lines: string[] = [
    `User: ${account.name || "unknown"}`,
    `Today: ${weekdayName(clock.today)} ${clock.today}. Tomorrow: ${weekdayName(addDays(clock.today, 1))} ${addDays(clock.today, 1)}.`,
    `Next days: ${[2, 3, 4, 5, 6]
      .map(
        (offset) => `${weekdayName(addDays(clock.today, offset))} ${addDays(clock.today, offset)}`,
      )
      .join(", ")}.`,
    "",
    active.length > 0 ? "Active goals:" : "Active goals: none yet.",
  ];
  for (const goal of active) {
    const week = weekSecondsByGoal.get(goal.id) ?? 0;
    const target =
      goal.weeklyTargetMinutes > 0
        ? ` of ${hours(goal.weeklyTargetMinutes * 60)} weekly target`
        : "";
    const open = tasks.filter((task) => task.goalId === goal.id && !task.doneAt).length;
    const milestones = goal.milestones.length
      ? `; milestones ${goal.milestones.filter((milestone) => milestone.doneAt).length}/${goal.milestones.length} done` +
        (goal.milestones.find((milestone) => !milestone.doneAt)
          ? ` (next: ${goal.milestones.find((milestone) => !milestone.doneAt)?.title})`
          : "")
      : "";
    lines.push(
      `- ${goal.title}: ${hours(week)} focused this week${target}; ${open} open tasks${milestones}` +
        (goal.targetDate ? `; deadline ${goal.targetDate}` : "") +
        (goal.why ? `; why: ${goal.why.slice(0, 160)}` : ""),
    );
  }
  const finished = goals.filter((goal) => goal.status === "completed").map((goal) => goal.title);
  if (finished.length > 0) {
    lines.push(`Completed goals: ${finished.slice(0, 5).join(", ")}`);
  }
  const open = tasks.filter((task) => !task.doneAt);
  const today = open.filter((task) => task.plannedOn === clock.today);
  const overdue = open.filter((task) => task.plannedOn && task.plannedOn < clock.today);
  const upcoming = open.filter((task) => task.plannedOn && task.plannedOn > clock.today);
  const unplanned = open.filter((task) => !task.plannedOn);
  const doneToday = tasks.filter(
    (task) =>
      task.doneAt &&
      Date.parse(task.doneAt) >= localMidnightUtc(clock.today, clock.utcOffsetMinutes).getTime(),
  );
  const doneThisWeek = tasks.filter(
    (task) => task.doneAt && Date.parse(task.doneAt) >= weekStartUtc,
  );
  lines.push(
    "",
    `Planned for today: ${today.length ? today.slice(0, 12).map(describeTask).join(", ") : "nothing"}`,
    `Overdue: ${overdue.length ? overdue.slice(0, 8).map(describeTask).join(", ") : "none"}`,
    `Upcoming: ${
      upcoming.length
        ? upcoming
            .slice(0, 8)
            .map((task) => `${describeTask(task)} on ${task.plannedOn}`)
            .join(", ")
        : "none"
    }`,
    `Unplanned: ${unplanned.length ? unplanned.slice(0, 8).map(describeTask).join(", ") : "none"}`,
    `Done today: ${doneToday.length ? doneToday.slice(0, 8).map(describeTask).join(", ") : "nothing yet"}`,
    `Tasks completed this week: ${doneThisWeek.length}. Total focus this week: ${hours(
      [...weekSecondsByGoal.values()].reduce((sum, value) => sum + value, 0),
    )}.`,
  );
  return { goals, tasks, weekSecondsByGoal, text: lines.join("\n") };
}
