import {
  daysBetween,
  taskCreateSchema,
  taskPatchSchema,
  taskQuerySchema,
  type TaskCreate,
  type TaskPatch,
} from "@ellma/shared";
import type { TaskRecord } from "../models/task.model.js";
import { EllmaError, notFound } from "../platform/errors.js";
import { assertGoalOwned } from "../goals/goal.service.js";
import * as repository from "./task.repository.js";

const MAX_OPEN_TASKS = 2000;
const MAX_RANGE_DAYS = 62;

export async function listTasks(ownerId: string, query: unknown) {
  const range = taskQuerySchema.parse(query);
  const span = daysBetween(range.from, range.to);
  if (span < 0 || span > MAX_RANGE_DAYS) {
    throw new EllmaError(400, "invalid_range");
  }
  return repository.listTasks(ownerId, range);
}

export async function createTask(ownerId: string, input: TaskCreate) {
  const task = taskCreateSchema.parse(input);
  await assertGoalOwned(ownerId, task.goalId);
  if ((await repository.countOpenTasks(ownerId)) >= MAX_OPEN_TASKS) {
    throw new EllmaError(409, "task_limit");
  }
  return repository.createTask({
    ...task,
    ownerId,
    position: Date.now(),
    doneAt: null,
    createdAt: new Date(),
  });
}

export async function updateTask(ownerId: string, id: string, input: TaskPatch) {
  const { done, ...patch } = taskPatchSchema.parse(input);
  if (patch.goalId !== undefined) {
    await assertGoalOwned(ownerId, patch.goalId);
  }
  const changes: Partial<TaskRecord> = { ...patch };
  if (done !== undefined) {
    const current = await repository.findTask(ownerId, id);
    if (!current) {
      throw notFound();
    }
    // Keep the original completion time when a task is marked done twice.
    changes.doneAt = done ? (current.doneAt ? new Date(current.doneAt) : new Date()) : null;
  }
  const updated = await repository.updateTask(ownerId, id, changes);
  if (!updated) {
    throw notFound();
  }
  return updated;
}

export async function deleteTask(ownerId: string, id: string) {
  if (!(await repository.deleteTask(ownerId, id))) {
    throw notFound();
  }
  return { id };
}

export const findTask = repository.findTask;
