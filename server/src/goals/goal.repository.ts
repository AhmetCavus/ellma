import { goalSchema, type Goal } from "@ellma/shared";
import GoalModel, { type GoalRecord } from "../models/goal.model.js";
import TaskModel from "../models/task.model.js";
import FocusSessionModel from "../models/focusSession.model.js";

type StoredGoal = GoalRecord & { _id: unknown };

function toGoal(record: StoredGoal): Goal {
  return goalSchema.parse({
    ...record,
    id: String(record._id),
    milestones: record.milestones ?? [],
    tags: record.tags ?? [],
    targetDate: record.targetDate ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  });
}

export async function listGoals(ownerId: string): Promise<Goal[]> {
  const records = await GoalModel.model
    .find({ ownerId })
    .sort({ position: 1, createdAt: 1 })
    .limit(500)
    .lean<StoredGoal[]>();
  return records.map(toGoal);
}

export async function goalExists(ownerId: string, id: string): Promise<boolean> {
  return Boolean(await GoalModel.model.exists({ _id: id, ownerId }));
}

export async function lastPosition(ownerId: string): Promise<number> {
  const last = await GoalModel.model
    .findOne({ ownerId })
    .sort({ position: -1 })
    .select("position")
    .lean<{ position: number } | null>();
  return last?.position ?? 0;
}

export async function createGoal(record: GoalRecord): Promise<Goal> {
  const created = await GoalModel.model.create(record);
  return toGoal(created.toObject() as StoredGoal);
}

export async function updateGoal(
  ownerId: string,
  id: string,
  changes: Partial<GoalRecord>,
): Promise<Goal | null> {
  const record = await GoalModel.model
    .findOneAndUpdate({ _id: id, ownerId }, changes, { new: true, runValidators: true })
    .lean<StoredGoal | null>();
  return record ? toGoal(record) : null;
}

export async function setPositions(ownerId: string, ids: string[]): Promise<void> {
  await GoalModel.model.bulkWrite(
    ids.map((id, index) => ({
      updateOne: { filter: { _id: id, ownerId }, update: { position: index + 1 } },
    })),
  );
}

export async function deleteGoal(ownerId: string, id: string): Promise<boolean> {
  const result = await GoalModel.model.deleteOne({ _id: id, ownerId });
  if (result.deletedCount === 0) {
    return false;
  }
  await Promise.all([
    TaskModel.model.updateMany({ ownerId, goalId: id }, { goalId: null }),
    FocusSessionModel.model.updateMany({ ownerId, goalId: id }, { goalId: null }),
  ]);
  return true;
}

export async function goalTotals(ownerId: string) {
  const rows = await FocusSessionModel.model.aggregate<{ _id: string | null; ms: number }>([
    { $match: { ownerId, endedAt: { $ne: null }, goalId: { $ne: null } } },
    { $group: { _id: "$goalId", ms: { $sum: { $subtract: ["$endedAt", "$startedAt"] } } } },
  ]);
  return rows
    .filter((row) => row._id)
    .map((row) => ({ goalId: String(row._id), seconds: Math.floor(row.ms / 1000) }));
}
