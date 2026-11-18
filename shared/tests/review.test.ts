import assert from "node:assert/strict";
import { test } from "node:test";
import type { FocusSession, Goal, Task } from "../src/contracts.ts";
import { localMidnight } from "../src/dates.ts";
import {
  formatClock,
  formatDuration,
  goalHours,
  reviewWeek,
  splitByDay,
  UNASSIGNED,
} from "../src/review.ts";

const goalId = "a".repeat(24);
const goal: Goal = {
  id: goalId,
  title: "Half marathon",
  why: "",
  color: "apple",
  weeklyTargetMinutes: 300,
  targetDate: null,
  status: "active",
  milestones: [],
  position: 0,
  createdAt: "2026-11-01T00:00:00.000Z",
  updatedAt: "2026-11-01T00:00:00.000Z",
};

function at(key: string, hours: number): string {
  return new Date(localMidnight(key).getTime() + hours * 3600_000).toISOString();
}

function session(start: string, end: string | null, goal: string | null = goalId): FocusSession {
  return { id: "b".repeat(24), taskId: null, goalId: goal, startedAt: start, endedAt: end };
}

test("sessions crossing midnight count toward both days", () => {
  const parts = splitByDay(session(at("2026-11-17", 23), at("2026-11-18", 1)));
  assert.deepEqual(
    [...parts.entries()],
    [
      ["2026-11-17", 3600],
      ["2026-11-18", 3600],
    ],
  );
});

test("week review sums per goal, day and target", () => {
  const sessions = [
    session(at("2026-11-16", 9), at("2026-11-16", 10.5)),
    session(at("2026-11-18", 8), at("2026-11-18", 9)),
    session(at("2026-11-18", 14), at("2026-11-18", 14.5), null),
    session(at("2026-11-23", 9), at("2026-11-23", 10)),
  ];
  const task: Task = {
    id: "c".repeat(24),
    title: "Run 10k",
    notes: "",
    goalId,
    plannedOn: "2026-11-18",
    estimateMinutes: null,
    position: 0,
    doneAt: at("2026-11-18", 10),
    createdAt: at("2026-11-15", 10),
  };
  const review = reviewWeek("2026-11-16", sessions, [goal], [task]);
  assert.equal(review.totalSeconds, 3 * 3600);
  assert.equal(review.perDay[0], 5400);
  assert.equal(review.perDay[2], 5400);
  assert.equal(review.goals[0]?.goalId, goalId);
  assert.equal(review.goals[0]?.seconds, 9000);
  assert.equal(review.goals[0]?.targetSeconds, 18000);
  assert.equal(review.goals[1]?.goalId, UNASSIGNED);
  assert.equal(review.completedTasks, 1);
  assert.equal(review.bestDay, "2026-11-16");
});

test("running sessions count up to now", () => {
  const now = new Date(at("2026-11-17", 10));
  const review = reviewWeek("2026-11-16", [session(at("2026-11-17", 9), null)], [goal], [], now);
  assert.equal(review.totalSeconds, 3600);
});

test("active goals with targets appear without time", () => {
  const review = reviewWeek("2026-11-16", [], [goal], []);
  assert.equal(review.goals.length, 1);
  assert.equal(review.bestDay, null);
});

test("formatting", () => {
  assert.equal(formatClock(65), "1:05");
  assert.equal(formatClock(3725), "1:02:05");
  assert.equal(formatDuration(45 * 60), "45m");
  assert.equal(formatDuration(125 * 60), "2h 05m");
  assert.equal(goalHours(5400), "1.5");
});
