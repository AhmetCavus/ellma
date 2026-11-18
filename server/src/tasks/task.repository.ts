import { taskSchema, type Task, type TaskQuery } from "@ellma/shared";
import TaskModel, { type TaskRecord } from "../models/task.model.js";
import FocusSessionModel from "../models/focusSession.model.js";

type StoredTask = TaskRecord & { _id: unknown };

export function toTask(record: StoredTask): Task {
  return taskSchema.parse({
    ...record,
    id: String(record._id),
    notes: record.notes ?? "",
    goalId: record.goalId ?? null,
    plannedOn: record.plannedOn ?? null,
    estimateMinutes: record.estimateMinutes ?? null,
    doneAt: record.doneAt ? record.doneAt.toISOString() : null,
    createdAt: record.createdAt.toISOString(),
  });
}

/** Every open task plus tasks planned in the range, so carried-over work never disappears. */
export async function listTasks(ownerId: string, query: TaskQuery): Promise<Task[]> {
  const records = await TaskModel.model
    .find({
      ownerId,
      $or: [{ doneAt: null }, { plannedOn: { $gte: query.from, $lte: query.to } }],
    })
    .sort({ position: 1, createdAt: 1 })
    .limit(3000)
    .lean<StoredTask[]>();
  return records.map(toTask);
}

export async function countOpenTasks(ownerId: string): Promise<number> {
  return TaskModel.model.countDocuments({ ownerId, doneAt: null });
}

export async function findTask(ownerId: string, id: string): Promise<Task | null> {
  const record = await TaskModel.model.findOne({ _id: id, ownerId }).lean<StoredTask | null>();
  return record ? toTask(record) : null;
}

export async function createTask(record: TaskRecord): Promise<Task> {
  const created = await TaskModel.model.create(record);
  return toTask(created.toObject() as StoredTask);
}

export async function updateTask(
  ownerId: string,
  id: string,
  changes: Partial<TaskRecord>,
): Promise<Task | null> {
  const record = await TaskModel.model
    .findOneAndUpdate({ _id: id, ownerId }, changes, { new: true, runValidators: true })
    .lean<StoredTask | null>();
  return record ? toTask(record) : null;
}

export async function deleteTask(ownerId: string, id: string): Promise<boolean> {
  const result = await TaskModel.model.deleteOne({ _id: id, ownerId });
  if (result.deletedCount === 0) {
    return false;
  }
  // Logged time stays with its goal; only the link to the removed task goes.
  await FocusSessionModel.model.updateMany({ ownerId, taskId: id }, { taskId: null });
  return true;
}
