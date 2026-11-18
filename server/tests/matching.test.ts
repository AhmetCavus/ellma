import assert from "node:assert/strict";
import { test } from "node:test";
import { bestMatch, resolveDate, resolveDeadline } from "../src/assistant/matching.ts";

const goals = ["Run a half marathon", "Launch the online shop", "Learn Turkish"];

test("finds goals by partial or spoken names", () => {
  assert.equal(bestMatch("marathon", goals, (goal) => goal).match, goals[0]);
  assert.equal(bestMatch("the shop", goals, (goal) => goal).match, goals[1]);
  assert.equal(bestMatch("learn turkish", goals, (goal) => goal).match, goals[2]);
  assert.equal(bestMatch("Läufe", goals, (goal) => goal).match, null);
});

test("ambiguous names return candidates instead of guessing", () => {
  const result = bestMatch("report", ["Write report draft", "Send report"], (task) => task);
  assert.equal(result.match, null);
  assert.ok("candidates" in result && result.candidates.length === 2);
});

test("resolves relative days against the user's today", () => {
  const tuesday = "2026-11-17";
  assert.equal(resolveDate("today", tuesday), "2026-11-17");
  assert.equal(resolveDate("morgen", tuesday), "2026-11-18");
  assert.equal(resolveDate("Friday", tuesday), "2026-11-20");
  assert.equal(resolveDate("Freitag", tuesday), "2026-11-20");
  assert.equal(resolveDate("next monday", tuesday), "2026-11-23");
  assert.equal(resolveDate("Tuesday", tuesday), "2026-11-17");
  assert.equal(resolveDate("2026-12-01", tuesday), "2026-12-01");
  assert.equal(resolveDate("someday", tuesday), null);
  assert.equal(resolveDate("whenever-ish", tuesday), undefined);
  assert.equal(resolveDate(undefined, tuesday), undefined);
});

test("goal deadlines always land in the future", () => {
  const today = "2026-11-17";
  assert.equal(resolveDeadline("April", today), "2027-04-30");
  assert.equal(resolveDeadline("im April", today), "2027-04-30");
  assert.equal(resolveDeadline("Dezember", today), "2026-12-31");
  assert.equal(resolveDeadline("2026-04-30", today), "2027-04-30");
  assert.equal(resolveDeadline("April 2028", today), "2028-04-30");
  assert.equal(resolveDeadline("2027-06-01", today), "2027-06-01");
  assert.equal(resolveDeadline("2024-02-29", today), "2027-02-28");
  assert.equal(resolveDeadline("soon", today), null);
  assert.equal(resolveDeadline(undefined, today), null);
});
