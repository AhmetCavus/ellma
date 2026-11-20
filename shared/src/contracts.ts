import { z } from "zod";

export const identifier = z.string().regex(/^[a-f0-9]{24}$/i, "invalid_id");
export const dateKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "invalid_date");
export const isoTimestamp = z.string().datetime({ offset: true });

export const GOAL_COLORS = [
  "apple",
  "amber",
  "leaf",
  "teal",
  "sky",
  "indigo",
  "plum",
  "slate",
] as const;
export const goalColorSchema = z.enum(GOAL_COLORS);
export type GoalColor = z.infer<typeof goalColorSchema>;

export const GOAL_STATUSES = ["active", "completed", "archived"] as const;
export const goalStatusSchema = z.enum(GOAL_STATUSES);
export type GoalStatus = z.infer<typeof goalStatusSchema>;

export const LIMITS = {
  title: 140,
  notes: 4000,
  milestones: 50,
  weeklyTargetMinutes: 7 * 24 * 60,
  estimateMinutes: 24 * 60,
  sessionHours: 16,
  tag: 30,
  tagsPerGoal: 10,
  /** Steps one multiple focus can hold. */
  focusItems: 8,
} as const;

const title = z.string().trim().min(1, "required").max(LIMITS.title);
const notes = z.string().trim().max(LIMITS.notes);

export const milestoneSchema = z.object({
  id: z.string().min(1).max(40),
  title,
  doneAt: isoTimestamp.nullable(),
});
export type Milestone = z.infer<typeof milestoneSchema>;

/** A user-defined label for goals. Compared without regard to case. */
export const tagSchema = z.string().trim().min(1, "required").max(LIMITS.tag);

export const goalInputSchema = z.object({
  title,
  why: notes.default(""),
  color: goalColorSchema.default("apple"),
  weeklyTargetMinutes: z.number().int().min(0).max(LIMITS.weeklyTargetMinutes).default(0),
  targetDate: dateKeySchema.nullable().default(null),
  status: goalStatusSchema.default("active"),
  milestones: z.array(milestoneSchema).max(LIMITS.milestones).default([]),
  tags: z
    .array(tagSchema)
    .max(LIMITS.tagsPerGoal)
    .default([])
    .transform((tags) => uniqueTags(tags)),
});
export type GoalInput = z.input<typeof goalInputSchema>;

export const goalSchema = goalInputSchema.extend({
  id: identifier,
  position: z.number(),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});
export type Goal = z.infer<typeof goalSchema>;

export const taskCreateSchema = z.object({
  title,
  notes: notes.default(""),
  goalId: identifier.nullable().default(null),
  plannedOn: dateKeySchema.nullable().default(null),
  estimateMinutes: z.number().int().min(1).max(LIMITS.estimateMinutes).nullable().default(null),
});
export type TaskCreate = z.input<typeof taskCreateSchema>;

export const taskPatchSchema = z
  .object({
    title,
    notes,
    goalId: identifier.nullable(),
    plannedOn: dateKeySchema.nullable(),
    estimateMinutes: z.number().int().min(1).max(LIMITS.estimateMinutes).nullable(),
    position: z.number().finite(),
    done: z.boolean(),
  })
  .partial();
export type TaskPatch = z.infer<typeof taskPatchSchema>;

export const taskSchema = z.object({
  id: identifier,
  title,
  notes: z.string(),
  goalId: identifier.nullable(),
  plannedOn: dateKeySchema.nullable(),
  estimateMinutes: z.number().int().nullable(),
  position: z.number(),
  doneAt: isoTimestamp.nullable(),
  createdAt: isoTimestamp,
});
export type Task = z.infer<typeof taskSchema>;

export const taskQuerySchema = z.object({
  from: dateKeySchema,
  to: dateKeySchema,
});
export type TaskQuery = z.infer<typeof taskQuerySchema>;

export const focusSessionSchema = z.object({
  id: identifier,
  taskId: identifier.nullable(),
  goalId: identifier.nullable(),
  startedAt: isoTimestamp,
  endedAt: isoTimestamp.nullable(),
  /**
   * The steps of a running multiple focus (two or more). When it ends, the server saves it
   * as back-to-back equal slices, one per step, so saved sessions always hold one step.
   */
  taskIds: z.array(identifier).default([]),
});
export type FocusSession = z.infer<typeof focusSessionSchema>;

export const focusStartSchema = z.object({
  taskId: identifier.nullable().default(null),
  goalId: identifier.nullable().default(null),
  /** Two or more steps start a multiple focus; the time is split evenly between them. */
  taskIds: z
    .array(identifier)
    .max(LIMITS.focusItems)
    .default([])
    .transform((ids) => [...new Set(ids)]),
});
export type FocusStart = z.input<typeof focusStartSchema>;

export const focusStopSchema = z.object({
  completeTask: z.boolean().default(false),
});

export const manualSessionSchema = z
  .object({
    taskId: identifier.nullable().default(null),
    goalId: identifier.nullable().default(null),
    startedAt: isoTimestamp,
    endedAt: isoTimestamp,
  })
  .refine((value) => Date.parse(value.endedAt) > Date.parse(value.startedAt), {
    message: "end_before_start",
    path: ["endedAt"],
  })
  .refine(
    (value) =>
      Date.parse(value.endedAt) - Date.parse(value.startedAt) <= LIMITS.sessionHours * 3600_000,
    { message: "too_long", path: ["endedAt"] },
  );
export type ManualSession = z.input<typeof manualSessionSchema>;

export const sessionQuerySchema = z.object({
  from: isoTimestamp,
  to: isoTimestamp,
});

export const focusStateSchema = z.object({
  active: focusSessionSchema.nullable(),
  completedTask: taskSchema.nullable().default(null),
  /** Every step a stop checked off (all steps of a multiple focus). */
  completedTasks: z.array(taskSchema).default([]),
  /** The session that a stop just saved, as stored. */
  stopped: focusSessionSchema.nullable().default(null),
});
export type FocusState = z.infer<typeof focusStateSchema>;

export const removedSchema = z.object({ id: identifier });

export const PASSWORD_RULE = {
  minLength: 8,
  maxLength: 72,
  minSpecialCharacters: 2,
} as const;

export function passwordProblems(password: string): ("length" | "special")[] {
  const problems: ("length" | "special")[] = [];
  if (password.length < PASSWORD_RULE.minLength || password.length > PASSWORD_RULE.maxLength) {
    problems.push("length");
  }
  if ((password.match(/[^a-zA-Z0-9]/g) ?? []).length < PASSWORD_RULE.minSpecialCharacters) {
    problems.push("special");
  }
  return problems;
}

/** Drops duplicates that differ only in case or spacing, keeping the first spelling. */
export function uniqueTags(tags: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of tags) {
    const tag = raw.trim().replace(/\s+/g, " ");
    const key = tag.toLocaleLowerCase();
    if (tag && !seen.has(key)) {
      seen.add(key);
      result.push(tag);
    }
  }
  return result;
}
