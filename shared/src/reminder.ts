import type { GuideStep } from "./guide.js";

/**
 * Ellma reminds kindly and rarely: once after a while away from the tab, then at most twice
 * more with a longer pause, and never again until the person has come back.
 */
export const REMINDER_FIRST_MINUTES = 20;
export const REMINDER_REPEAT_MINUTES = 60;
export const REMINDERS_PER_ABSENCE = 3;

/** When the next reminder of this absence is due (epoch ms), or null when Ellma stays quiet. */
export function reminderDueAt(awaySince: number, alreadySent: number): number | null {
  if (alreadySent >= REMINDERS_PER_ABSENCE) {
    return null;
  }
  const minutes = REMINDER_FIRST_MINUTES + alreadySent * REMINDER_REPEAT_MINUTES;
  return awaySince + minutes * 60_000;
}

/**
 * Only an open step is worth a reminder. Someone who is focusing, has finished the day or
 * has no goal yet is left alone.
 */
export function isRemindable(step: GuideStep): boolean {
  return step.kind !== "focus_running" && step.kind !== "first_goal" && step.kind !== "day_done";
}

/** The step a reminder can name, if the guide points at one. */
export function reminderTaskId(step: GuideStep): string | null {
  return step.kind === "start_task" || step.kind === "plan_today" ? step.taskId : null;
}
