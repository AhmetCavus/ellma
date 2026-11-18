import assert from "node:assert/strict";
import { test } from "node:test";
import {
  addDays,
  daysBetween,
  isoWeekNumber,
  startOfWeek,
  weekDays,
  weekdayIndex,
} from "../src/dates.ts";

test("weeks start on Monday", () => {
  assert.equal(startOfWeek("2026-11-17"), "2026-11-16");
  assert.equal(startOfWeek("2026-11-16"), "2026-11-16");
  assert.equal(startOfWeek("2026-11-22"), "2026-11-16");
  assert.equal(weekdayIndex("2026-11-22"), 6);
});

test("day arithmetic crosses months, years and DST changes", () => {
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(addDays("2026-03-28", 2), "2026-03-30");
  assert.equal(addDays("2026-10-24", 2), "2026-10-26");
  assert.deepEqual(weekDays("2026-10-19").at(-1), "2026-10-25");
  assert.equal(daysBetween("2026-02-27", "2026-03-02"), 3);
});

test("ISO week numbers", () => {
  assert.equal(isoWeekNumber("2026-01-01"), 1);
  assert.equal(isoWeekNumber("2026-11-17"), 47);
  assert.equal(isoWeekNumber("2027-01-01"), 53);
});
