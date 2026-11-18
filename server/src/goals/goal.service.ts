import { goalInputSchema, type GoalInput } from "@ellma/shared";
import { EllmaError, notFound } from "../platform/errors.js";
import * as repository from "./goal.repository.js";

const MAX_GOALS = 200;

export const listGoals = repository.listGoals;
export const goalTotals = repository.goalTotals;

export async function createGoal(ownerId: string, input: GoalInput) {
  const goal = goalInputSchema.parse(input);
  const existing = await repository.listGoals(ownerId);
  if (existing.length >= MAX_GOALS) {
    throw new EllmaError(409, "goal_limit");
  }
  const now = new Date();
  return repository.createGoal({
    ...goal,
    ownerId,
    position: (await repository.lastPosition(ownerId)) + 1,
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateGoal(ownerId: string, id: string, input: GoalInput) {
  const goal = goalInputSchema.parse(input);
  const updated = await repository.updateGoal(ownerId, id, { ...goal, updatedAt: new Date() });
  if (!updated) {
    throw notFound();
  }
  return updated;
}

export async function reorderGoals(ownerId: string, ids: string[]) {
  await repository.setPositions(ownerId, ids);
  return repository.listGoals(ownerId);
}

export async function deleteGoal(ownerId: string, id: string) {
  if (!(await repository.deleteGoal(ownerId, id))) {
    throw notFound();
  }
  return { id };
}

export async function assertGoalOwned(ownerId: string, id: string | null): Promise<void> {
  if (id && !(await repository.goalExists(ownerId, id))) {
    throw new EllmaError(404, "goal_not_found");
  }
}
