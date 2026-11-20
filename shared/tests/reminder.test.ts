import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isRemindable,
  reminderDueAt,
  reminderTaskId,
  REMINDERS_PER_ABSENCE,
} from "../src/reminder.ts";

const MINUTE = 60_000;

test("reminders come late, then rarely, then stop", () => {
  const away = 1_000_000;
  assert.equal(reminderDueAt(away, 0), away + 20 * MINUTE);
  assert.equal(reminderDueAt(away, 1), away + 80 * MINUTE);
  assert.equal(reminderDueAt(away, 2), away + 140 * MINUTE);
  assert.equal(reminderDueAt(away, REMINDERS_PER_ABSENCE), null);
});

test("only open steps are worth a reminder", () => {
  assert.equal(isRemindable({ kind: "focus_running", taskId: null, goalId: null }), false);
  assert.equal(isRemindable({ kind: "first_goal" }), false);
  assert.equal(isRemindable({ kind: "day_done", doneToday: 2, spareTaskId: null }), false);
  assert.equal(isRemindable({ kind: "start_task", taskId: "a", goalId: null }), true);
  assert.equal(isRemindable({ kind: "carry_over", taskIds: ["a"] }), true);
  assert.equal(isRemindable({ kind: "weekly_gap", goalId: "g", remainingSeconds: 60 }), true);
});

test("a reminder names the step when the guide points at one", () => {
  assert.equal(reminderTaskId({ kind: "start_task", taskId: "a", goalId: null }), "a");
  assert.equal(reminderTaskId({ kind: "plan_today", taskId: "b", goalId: "g" }), "b");
  assert.equal(reminderTaskId({ kind: "next_step", goalId: "g" }), null);
});
