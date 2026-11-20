import { createCollection, Provider } from "yappio";

export type FocusSessionRecord = {
  ownerId: string;
  taskId: string | null;
  goalId: string | null;
  startedAt: Date;
  endedAt: Date | null;
  /** Only on a running multiple focus; split into one session per step when it ends. */
  taskIds?: string[];
};

export default createCollection<FocusSessionRecord>("EllmaFocusSession").withSchema({
  ownerId: { ...Provider.String, required: true, index: true },
  taskId: { ...Provider.String, default: null },
  goalId: { ...Provider.String, default: null },
  startedAt: { ...Provider.Date, required: true },
  endedAt: { ...Provider.Date, default: null },
  taskIds: Provider.Mixed,
});
