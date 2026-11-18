import { createCollection, Provider } from "yappio";

export type FocusSessionRecord = {
  ownerId: string;
  taskId: string | null;
  goalId: string | null;
  startedAt: Date;
  endedAt: Date | null;
};

export default createCollection<FocusSessionRecord>("EllmaFocusSession").withSchema({
  ownerId: { ...Provider.String, required: true, index: true },
  taskId: { ...Provider.String, default: null },
  goalId: { ...Provider.String, default: null },
  startedAt: { ...Provider.Date, required: true },
  endedAt: { ...Provider.Date, default: null },
});
