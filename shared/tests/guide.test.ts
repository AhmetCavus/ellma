import assert from "node:assert/strict";
import { test } from "node:test";
import type { FocusSession, Goal, Task } from "../src/contracts.ts";
import { localMidnight } from "../src/dates.ts";
import { buildGuide } from "../src/guide.ts";
import { localIntent } from "../src/intents.ts";

// Wednesday.
const today = "2026-11-18";
const now = new Date(localMidnight(today).getTime() + 10 * 3600_000);
const stamp = "2026-11-01T00:00:00.000Z";

function goal(id: string, title: string, weeklyHours = 4, extra: Partial<Goal> = {}): Goal {
  return {
    id: id.repeat(24),
    title,
    why: "",
    color: "apple",
    weeklyTargetMinutes: weeklyHours * 60,
    targetDate: null,
    status: "active",
    milestones: [],
    tags: [],
    position: 0,
    createdAt: stamp,
    updatedAt: stamp,
    ...extra,
  };
}

let counter = 0;
function task(title: string, goalId: string | null, plannedOn: string | null, done = false): Task {
  counter += 1;
  return {
    id: String(counter).padStart(24, "0"),
    title,
    notes: "",
    goalId,
    plannedOn,
    estimateMinutes: null,
    position: counter,
    doneAt: done ? now.toISOString() : null,
    createdAt: stamp,
  };
}

function session(goalId: string, hours: number, running = false): FocusSession {
  const start = localMidnight("2026-11-17").getTime() + 9 * 3600_000;
  return {
    id: "f".repeat(24),
    taskId: null,
    goalId,
    startedAt: new Date(start).toISOString(),
    endedAt: running ? null : new Date(start + hours * 3600_000).toISOString(),
  };
}

const run = goal("a", "Half marathon");
const spanish = goal("b", "Learn Spanish", 2);
const guide = (
  goals: Goal[],
  tasks: Task[],
  sessions: FocusSession[] = [],
  active: FocusSession | null = null,
) => buildGuide({ goals, tasks, sessions, active, today, now });

test("without goals the guide asks for the first one", () => {
  assert.deepEqual(guide([], []).step, { kind: "first_goal" });
  const archived = goal("c", "Old", 1, { status: "archived" });
  assert.equal(guide([archived], []).step.kind, "first_goal");
});

test("a running focus session comes before everything else", () => {
  const step = guide(
    [run],
    [task("Run 5k", run.id, "2026-11-16")],
    [],
    session(run.id, 0, true),
  ).step;
  assert.deepEqual(step, { kind: "focus_running", taskId: null, goalId: run.id });
});

test("leftover steps are offered for today first", () => {
  const old = task("Buy shoes", run.id, "2026-11-16");
  const step = guide([run], [old, task("Run 5k", run.id, today)]).step;
  assert.deepEqual(step, { kind: "carry_over", taskIds: [old.id] });
});

test("today's step of the goal that is furthest behind leads", () => {
  const vocab = task("20 words", spanish.id, today);
  const jog = task("Run 5k", run.id, today);
  // Spanish already has its 2 hours this week; running has none.
  const step = guide([run, spanish], [vocab, jog], [session(spanish.id, 2)]).step;
  assert.deepEqual(step, { kind: "start_task", taskId: jog.id, goalId: run.id });
});

test("a goal without any open step asks for one", () => {
  const step = guide([run, spanish], [task("20 words", spanish.id, null)]).step;
  assert.deepEqual(step, { kind: "next_step", goalId: run.id });
});

test("an empty day suggests a waiting step, but never nags after work is done", () => {
  const waiting = task("Find a plan", run.id, null);
  assert.deepEqual(guide([run], [waiting]).step, {
    kind: "plan_today",
    taskId: waiting.id,
    goalId: run.id,
  });
  const finished = task("Stretch", run.id, today, true);
  assert.deepEqual(guide([run], [waiting, finished]).step, {
    kind: "day_done",
    doneToday: 1,
    spareTaskId: waiting.id,
  });
});

test("pulses describe the week of each goal", () => {
  const upcoming = task("Long run", run.id, "2026-11-21");
  const { pulses } = guide([run, spanish], [upcoming], [session(run.id, 1)]);
  const [first, second] = pulses;
  assert.equal(first?.weekSeconds, 3600);
  assert.equal(first?.ratio, 0.25);
  assert.equal(first?.state, "on_track");
  assert.equal(first?.nextTask?.id, upcoming.id);
  // Wednesday with nothing done: 0 < 3/7 − 0.25, so Spanish needs attention.
  assert.equal(second?.state, "behind");
  const ripe = guide([spanish], [], [session(spanish.id, 2.5)]).pulses[0];
  assert.equal(ripe?.state, "ripe");
  assert.equal(ripe?.ratio, 1);
});

test("short commands are handled locally, sentences go to the model", () => {
  assert.deepEqual(localIntent("Show me my goals"), { kind: "navigate", page: "goals" });
  assert.deepEqual(localIntent("Zeig mir heute."), { kind: "navigate", page: "today" });
  assert.deepEqual(localIntent("Ellma, open progress please"), {
    kind: "navigate",
    page: "progress",
  });
  assert.deepEqual(localIntent("Fertig!"), { kind: "complete_focus" });
  assert.deepEqual(localIntent("stop"), { kind: "stop_focus" });
  assert.deepEqual(localIntent("new goal"), { kind: "new_goal" });
  assert.equal(localIntent("I ran 40 minutes today for my half marathon"), null);
  assert.equal(localIntent("What should I do today?"), null);
  assert.equal(localIntent("Yes"), null);
});
