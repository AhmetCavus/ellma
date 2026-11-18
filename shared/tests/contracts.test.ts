import assert from "node:assert/strict";
import { test } from "node:test";
import {
  manualSessionSchema,
  passwordProblems,
  goalInputSchema,
  taskPatchSchema,
} from "../src/contracts.ts";
import { LOCALES, preferredLocale } from "../src/locales/index.ts";

test("goal input defaults and trimming", () => {
  const goal = goalInputSchema.parse({ title: "  Launch the shop  " });
  assert.equal(goal.title, "Launch the shop");
  assert.equal(goal.color, "apple");
  assert.equal(goal.status, "active");
  assert.throws(() => goalInputSchema.parse({ title: "   " }));
});

test("task patches reject unknown dates", () => {
  assert.ok(taskPatchSchema.safeParse({ plannedOn: "2026-11-17" }).success);
  assert.ok(!taskPatchSchema.safeParse({ plannedOn: "17.11.2026" }).success);
});

test("manual sessions must be positive and bounded", () => {
  const base = { startedAt: "2026-11-17T09:00:00.000Z" };
  assert.ok(
    manualSessionSchema.safeParse({ ...base, endedAt: "2026-11-17T10:00:00.000Z" }).success,
  );
  assert.ok(
    !manualSessionSchema.safeParse({ ...base, endedAt: "2026-11-17T08:00:00.000Z" }).success,
  );
  assert.ok(
    !manualSessionSchema.safeParse({ ...base, endedAt: "2026-11-18T09:00:00.000Z" }).success,
  );
});

test("password rule mirrors Yappio", () => {
  assert.deepEqual(passwordProblems("short"), ["length", "special"]);
  assert.deepEqual(passwordProblems("longenough!"), ["special"]);
  assert.deepEqual(passwordProblems("long!enough#"), []);
});

test("locales share every key", () => {
  const { de, en } = LOCALES;
  const keys = (value: object, prefix = ""): string[] =>
    Object.entries(value).flatMap(([key, child]) =>
      child && typeof child === "object" && !Array.isArray(child)
        ? keys(child, `${prefix}${key}.`)
        : [`${prefix}${key}`],
    );
  assert.deepEqual(keys(de).sort(), keys(en).sort());
  assert.equal(Object.keys(LOCALES).length, 2);
  assert.equal(preferredLocale(["de-DE", "en"]), "de");
  assert.equal(preferredLocale(["tr-TR"]), "en");
});
