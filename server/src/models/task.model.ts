import { createCollection, Provider } from "yappio";

export type TaskRecord = {
  ownerId: string;
  title: string;
  notes: string;
  goalId: string | null;
  plannedOn: string | null;
  estimateMinutes: number | null;
  position: number;
  doneAt: Date | null;
  createdAt: Date;
};

export default createCollection<TaskRecord>("EllmaTask").withSchema({
  ownerId: { ...Provider.String, required: true, index: true },
  title: { ...Provider.String, required: true },
  notes: { ...Provider.String, default: "" },
  goalId: { ...Provider.String, default: null },
  plannedOn: { ...Provider.String, default: null },
  estimateMinutes: { ...Provider.Number, default: null },
  position: { ...Provider.Number, default: 0 },
  doneAt: { ...Provider.Date, default: null },
  createdAt: { ...Provider.Date, required: true },
});
