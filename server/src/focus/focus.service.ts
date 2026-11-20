import {
  focusStartSchema,
  focusStopSchema,
  LIMITS,
  manualSessionSchema,
  sessionQuerySchema,
  type FocusSession,
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

type Step = { taskId: string; goalId: string | null };

/** The steps of a multiple focus that still exist, in the order they were picked. */
async function existingSteps(ownerId: string, taskIds: string[]): Promise<Step[]> {
  const found = await Promise.all(taskIds.map((id) => findTask(ownerId, id)));
  return found.flatMap((task) => (task ? [{ taskId: task.id, goalId: task.goalId }] : []));
}

/**
 * Saves a multiple focus as back-to-back equal slices, one per step, so an hour spent on
 * two steps counts as half an hour each and weekly totals stay true to the time worked.
 */
async function endAsSlices(ownerId: string, session: FocusSession, endedAt: Date) {
  const steps = await existingSteps(ownerId, session.taskIds);
  if (steps.length < 2) {
    const only = steps[0] ?? { taskId: session.taskId, goalId: session.goalId };
    await repository.endAsSlice(ownerId, session.id, { ...only, endedAt });
    return;
  }
  const start = Date.parse(session.startedAt);
  const slice = (endedAt.getTime() - start) / steps.length;
  const boundary = (index: number) =>
    index === steps.length ? endedAt : new Date(Math.round(start + slice * index));
  const [first, ...rest] = steps as [Step, ...Step[]];
  await repository.endAsSlice(ownerId, session.id, { ...first, endedAt: boundary(1) });
  await Promise.all(
    rest.map((step, offset) =>
      repository.createSession({
        ownerId,
        ...step,
        startedAt: boundary(offset + 1),
        endedAt: boundary(offset + 2),
      }),
    ),
  );
}

/** Ends every running session and returns them as they ran, with their end time. */
async function endOpenSessions(ownerId: string, now: Date) {
  const open = await repository.listOpen(ownerId);
  return Promise.all(
    open.map(async (session) => {
      const endedAt = cappedEnd(session.startedAt, now);
      if (session.taskIds.length > 1) {
        await endAsSlices(ownerId, session, endedAt);
      } else {
        await repository.endSession(ownerId, session.id, endedAt);
      }
      return { ...session, endedAt: endedAt.toISOString() };
    }),
  );
}

const idle = { completedTask: null, completedTasks: [], stopped: null };

export async function focusState(ownerId: string): Promise<FocusState> {
  return { active: await repository.findActive(ownerId), ...idle };
}

export async function startFocus(ownerId: string, input: unknown): Promise<FocusState> {
  const request = focusStartSchema.parse(input);
  let goalId = request.goalId;
  let taskId = request.taskId;
  let taskIds: string[] = [];
  if (request.taskIds.length > 1) {
    const steps = await existingSteps(ownerId, request.taskIds);
    const [first] = steps;
    if (!first || steps.length !== request.taskIds.length) {
      throw new EllmaError(404, "task_not_found");
    }
    taskIds = steps.map((step) => step.taskId);
    taskId = first.taskId;
    goalId = first.goalId;
  } else {
    taskId = request.taskIds[0] ?? taskId;
    if (taskId) {
      const task = await findTask(ownerId, taskId);
      if (!task) {
        throw new EllmaError(404, "task_not_found");
      }
      goalId = task.goalId;
    } else {
      await assertGoalOwned(ownerId, goalId);
    }
  }
  const now = new Date();
  await endOpenSessions(ownerId, now);
  const active = await repository.createSession({
    ownerId,
    taskId,
    goalId,
    taskIds,
    startedAt: now,
    endedAt: null,
  });
  return { active, ...idle };
}

export async function stopFocus(ownerId: string, input: unknown): Promise<FocusState> {
  const { completeTask } = focusStopSchema.parse(input);
  const ended = await endOpenSessions(ownerId, new Date());
  const stopped = ended.at(-1) ?? null;
  const toComplete = stopped
    ? stopped.taskIds.length > 1
      ? stopped.taskIds
      : stopped.taskId
        ? [stopped.taskId]
        : []
    : [];
  const completedTasks = completeTask
    ? (
        await Promise.all(
          toComplete.map((id) => updateTask(ownerId, id, { done: true }).catch(() => null)),
        )
      ).filter((task) => task !== null)
    : [];
  return { active: null, completedTask: completedTasks[0] ?? null, completedTasks, stopped };
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
