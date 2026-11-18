import { focusSessionSchema, type FocusSession } from "@ellma/shared";
import FocusSessionModel, { type FocusSessionRecord } from "../models/focusSession.model.js";

type StoredSession = FocusSessionRecord & { _id: unknown };

function toSession(record: StoredSession): FocusSession {
  return focusSessionSchema.parse({
    id: String(record._id),
    taskId: record.taskId ?? null,
    goalId: record.goalId ?? null,
    startedAt: record.startedAt.toISOString(),
    endedAt: record.endedAt ? record.endedAt.toISOString() : null,
  });
}

export async function findActive(ownerId: string): Promise<FocusSession | null> {
  const record = await FocusSessionModel.model
    .findOne({ ownerId, endedAt: null })
    .sort({ startedAt: -1 })
    .lean<StoredSession | null>();
  return record ? toSession(record) : null;
}

export async function listOpen(ownerId: string): Promise<FocusSession[]> {
  const records = await FocusSessionModel.model
    .find({ ownerId, endedAt: null })
    .lean<StoredSession[]>();
  return records.map(toSession);
}

export async function endSession(ownerId: string, id: string, endedAt: Date): Promise<void> {
  await FocusSessionModel.model.updateOne({ _id: id, ownerId, endedAt: null }, { endedAt });
}

export async function createSession(record: FocusSessionRecord): Promise<FocusSession> {
  const created = await FocusSessionModel.model.create(record);
  return toSession(created.toObject() as StoredSession);
}

export async function listOverlapping(
  ownerId: string,
  from: Date,
  to: Date,
): Promise<FocusSession[]> {
  const records = await FocusSessionModel.model
    .find({
      ownerId,
      startedAt: { $lt: to },
      $or: [{ endedAt: null }, { endedAt: { $gt: from } }],
    })
    .sort({ startedAt: 1 })
    .limit(5000)
    .lean<StoredSession[]>();
  return records.map(toSession);
}

export async function deleteSession(ownerId: string, id: string): Promise<boolean> {
  const result = await FocusSessionModel.model.deleteOne({ _id: id, ownerId });
  return result.deletedCount > 0;
}
