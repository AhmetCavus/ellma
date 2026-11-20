import assert from "node:assert/strict";
import { test } from "node:test";
import { goalInputSchema, uniqueTags, type Goal, type Task } from "../src/contracts.ts";
import { localMidnight } from "../src/dates.ts";
import { buildGuide } from "../src/guide.ts";
import {
  allTags,
  dateGroupOf,
  EMPTY_GOALS_FILTER,
  EMPTY_TODAY_FILTER,
  goalAttention,
  groupGoals,
  groupSteps,
  isFiltering,
} from "../src/views.ts";

const today = "2026-11-18";
const tomorrow = "2026-11-19";
const now = new Date(localMidnight(today).getTime() + 10 * 3600_000);
const stamp = "2026-11-01T00:00:00.000Z";

function goal(id: string, title: string, extra: Partial<Goal> = {}): Goal {
  return {
    id: id.repeat(24),
    title,
    why: "",
    color: "apple",
    weeklyTargetMinutes: 120,
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

const doneOn = (entry: Task) => (entry.doneAt ? today : null);
const pulsesOf = (goals: Goal[], tasks: Task[]) =>
  buildGuide({ goals, tasks, sessions: [], active: null, today, now }).pulses;

test("dates fall into overdue, today, tomorrow, later and no date", () => {
  assert.equal(dateGroupOf("2026-11-17", today), "overdue");
  assert.equal(dateGroupOf(today, today), "today");
  assert.equal(dateGroupOf(tomorrow, today), "tomorrow");
  assert.equal(dateGroupOf("2026-12-01", today), "later");
  assert.equal(dateGroupOf(null, today), "none");
});

test("a goal with steps today and tomorrow shows once on Goals, both steps on Today", () => {
  const run = goal("a", "Half marathon");
  const tasks = [task("Run 5k", run.id, today), task("Stretch", run.id, tomorrow)];
  const goals = groupGoals(pulsesOf([run], tasks), tasks, today, EMPTY_GOALS_FILTER);
  assert.deepEqual(
    goals.map((entry) => [entry.group, entry.items.map((pulse) => pulse.goal.title)]),
    [["today", ["Half marathon"]]],
  );
  const steps = groupSteps(tasks, [run], today, EMPTY_TODAY_FILTER, doneOn);
  assert.deepEqual(
    steps.open.map((entry) => [entry.group, entry.items.map((item) => item.title)]),
    [
      ["today", ["Run 5k"]],
      ["tomorrow", ["Stretch"]],
    ],
  );
});

test("moving the earliest step moves the goal and the step", () => {
  const run = goal("a", "Half marathon");
  const tasks = [task("Run 5k", run.id, tomorrow)];
  const before = groupGoals(pulsesOf([run], tasks), tasks, today, EMPTY_GOALS_FILTER);
  assert.equal(before[0]?.group, "tomorrow");
  const moved = tasks.map((entry) => ({ ...entry, plannedOn: today }));
  const after = groupGoals(pulsesOf([run], moved), moved, today, EMPTY_GOALS_FILTER);
  assert.equal(after[0]?.group, "today");
  assert.equal(groupSteps(moved, [run], today, EMPTY_TODAY_FILTER, doneOn).open[0]?.group, "today");
});

test("goals without a scheduled open step land in no date; overdue goals get their own group", () => {
  const idle = goal("a", "Idle");
  const late = goal("b", "Late");
  const tasks = [task("Old", late.id, "2026-11-10"), task("Someday", idle.id, null)];
  const groups = groupGoals(pulsesOf([idle, late], tasks), tasks, today, EMPTY_GOALS_FILTER);
  assert.deepEqual(
    groups.map((entry) => entry.group),
    ["overdue", "none"],
  );
});

test("tag and status filters combine; Today uses the parent goal's tags", () => {
  const run = goal("a", "Run", { tags: ["Health"] });
  const read = goal("b", "Read", { tags: ["Mind"] });
  const tasks = [
    task("Run 5k", run.id, today),
    task("Chapter", read.id, today),
    task("Loose", null, today),
    task("Warm up", run.id, today, true),
  ];
  const health = { ...EMPTY_GOALS_FILTER, tags: ["health"] };
  const goals = groupGoals(pulsesOf([run, read], tasks), tasks, today, health);
  assert.deepEqual(
    goals.flatMap((entry) => entry.items.map((pulse) => pulse.goal.title)),
    ["Run"],
  );
  const ripeOnly = { ...health, statuses: ["ripe" as const] };
  assert.equal(groupGoals(pulsesOf([run, read], tasks), tasks, today, ripeOnly).length, 0);

  const steps = groupSteps(
    tasks,
    [run, read],
    today,
    { ...EMPTY_TODAY_FILTER, tags: ["Health"] },
    doneOn,
  );
  assert.deepEqual(
    steps.open.flatMap((entry) => entry.items.map((item) => item.title)),
    ["Run 5k"],
  );
  assert.deepEqual(
    steps.done.map((item) => item.title),
    ["Warm up"],
  );
  const onlyDone = groupSteps(
    tasks,
    [run, read],
    today,
    { ...EMPTY_TODAY_FILTER, statuses: ["done"] },
    doneOn,
  );
  assert.equal(onlyDone.open.length, 0);
  assert.equal(onlyDone.done.length, 1);
  assert.equal(isFiltering(EMPTY_TODAY_FILTER), false);
  assert.equal(isFiltering({ tags: [], statuses: ["open"] }), true);
});

test("sorting applies inside each date group", () => {
  const b = goal("a", "Beta", { position: 1, targetDate: "2026-12-24" });
  const a = goal("b", "Alpha", { position: 2, targetDate: "2026-12-01" });
  const c = goal("c", "Gamma", { position: 3 });
  const tasks = [task("z", b.id, today), task("y", a.id, today), task("x", c.id, today)];
  const pulses = pulsesOf([b, a, c], tasks);
  const titles = (sort: "position" | "deadline" | "title") =>
    groupGoals(pulses, tasks, today, { ...EMPTY_GOALS_FILTER, sort })[0]?.items.map(
      (pulse) => pulse.goal.title,
    );
  assert.deepEqual(titles("position"), ["Beta", "Alpha", "Gamma"]);
  assert.deepEqual(titles("deadline"), ["Alpha", "Beta", "Gamma"]);
  assert.deepEqual(titles("title"), ["Alpha", "Beta", "Gamma"]);

  const steps = [
    task("b step", a.id, today),
    task("a step", null, today),
    task("c step", b.id, today),
  ];
  const order = (sort: "position" | "goal" | "title") =>
    groupSteps(steps, [b, a], today, { ...EMPTY_TODAY_FILTER, sort }, doneOn).open[0]?.items.map(
      (item) => item.title,
    );
  assert.deepEqual(order("position"), ["b step", "a step", "c step"]);
  assert.deepEqual(order("goal"), ["c step", "b step", "a step"]);
  assert.deepEqual(order("title"), ["a step", "b step", "c step"]);
});

test("attention names its reason", () => {
  const late = goal("a", "Late");
  const empty = goal("b", "Empty");
  const fine = goal("c", "Fine");
  const tasks = [task("Old", late.id, "2026-11-10"), task("Now", fine.id, today)];
  const [first, second, third] = pulsesOf([late, empty, fine], tasks);
  assert.equal(first && goalAttention(first), "step_overdue");
  assert.equal(second && goalAttention(second), "no_next_step");
  assert.equal(third && goalAttention(third), null);
});

test("tags are user-defined, trimmed and kept once regardless of case", () => {
  assert.deepEqual(uniqueTags([" Health ", "health", "Deep  work", "Mind"]), [
    "Health",
    "Deep work",
    "Mind",
  ]);
  assert.deepEqual(goalInputSchema.parse({ title: "x", tags: ["A", "a"] }).tags, ["A"]);
  assert.equal(goalInputSchema.safeParse({ title: "x", tags: ["x".repeat(31)] }).success, false);
  assert.deepEqual(
    allTags([goal("a", "A", { tags: ["Mind", "health"] }), goal("b", "B", { tags: ["Health"] })]),
    ["health", "Mind"],
  );
});
