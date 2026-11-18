import {
  focusStartSchema,
  focusStopSchema,
  LIMITS,
  manualSessionSchema,
  sessionQuerySchema,
  type FocusState,
  type ManualSession,
} from "@ellma/shared";
import { EllmaError, notFound } from "../platform/errors.js";
import { assertGoalOwned } from "../goals/goal.service.js";
import { findTask, updateTask } from "../tasks/task.service.js";
import * as repository from "./focus.repository.js";

const MAX_SESSION_MS = LIMITS.sessionHours * 3600_000;
const MAX_QUERY_MS = 62 * 86_400_000;

/** A forgotten timer must not inflate goal hours beyond a plausible working stretch. */
function cappedEnd(startedAt: string, now: Date): Date {
  const start = Date.parse(startedAt);
  return new Date(Math.min(now.getTime(), start + MAX_SESSION_MS));
}

async function endOpenSessions(ownerId: string, now: Date) {
  const open = await repository.listOpen(ownerId);
  await Promise.all(
    open.map((session) =>
      repository.endSession(ownerId, session.id, cappedEnd(session.startedAt, now)),
    ),
  );
  return open;
}

export async function focusState(ownerId: string): Promise<FocusState> {
  return { active: await repository.findActive(ownerId), completedTask: null };
}

export async function startFocus(ownerId: string, input: unknown): Promise<FocusState> {
  const request = focusStartSchema.parse(input);
  let goalId = request.goalId;
  if (request.taskId) {
    const task = await findTask(ownerId, request.taskId);
    if (!task) {
      throw new EllmaError(404, "task_not_found");
    }
    goalId = task.goalId;
  } else {
    await assertGoalOwned(ownerId, goalId);
  }
  const now = new Date();
  await endOpenSessions(ownerId, now);
  const active = await repository.createSession({
    ownerId,
    taskId: request.taskId,
    goalId,
    startedAt: now,
    endedAt: null,
  });
  return { active, completedTask: null };
}

export async function stopFocus(ownerId: string, input: unknown): Promise<FocusState> {
  const { completeTask } = focusStopSchema.parse(input);
  const ended = await endOpenSessions(ownerId, new Date());
  const taskId = ended.at(-1)?.taskId;
  const completedTask =
    completeTask && taskId
      ? await updateTask(ownerId, taskId, { done: true }).catch(() => null)
      : null;
  return { active: null, completedTask };
}

export async function listSessions(ownerId: string, query: unknown) {
  const range = sessionQuerySchema.parse(query);
  const from = new Date(range.from);
  const to = new Date(range.to);
  if (to <= from || to.getTime() - from.getTime() > MAX_QUERY_MS) {
    throw new EllmaError(400, "invalid_range");
  }
  return repository.listOverlapping(ownerId, from, to);
}

export async function logSession(ownerId: string, input: ManualSession) {
  const session = manualSessionSchema.parse(input);
  let goalId = session.goalId;
  if (session.taskId) {
    const task = await findTask(ownerId, session.taskId);
    if (!task) {
      throw new EllmaError(404, "task_not_found");
    }
    goalId = task.goalId;
  } else {
    await assertGoalOwned(ownerId, goalId);
  }
  if (Date.parse(session.endedAt) > Date.now() + 60_000) {
    throw new EllmaError(400, "future_session");
  }
  return repository.createSession({
    ownerId,
    taskId: session.taskId,
    goalId,
    startedAt: new Date(session.startedAt),
    endedAt: new Date(session.endedAt),
  });
}

export async function deleteSession(ownerId: string, id: string) {
  if (!(await repository.deleteSession(ownerId, id))) {
    throw notFound();
  }
  return { id };
}
