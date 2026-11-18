import { createCollection, Provider } from "yappio";
import { GOAL_COLORS, GOAL_STATUSES, type Milestone } from "@ellma/shared";

export type GoalRecord = {
  ownerId: string;
  title: string;
  why: string;
  color: string;
  weeklyTargetMinutes: number;
  targetDate: string | null;
  status: string;
  milestones: Milestone[];
  position: number;
  createdAt: Date;
  updatedAt: Date;
};

export default createCollection<GoalRecord>("EllmaGoal").withSchema({
  ownerId: { ...Provider.String, required: true, index: true },
  title: { ...Provider.String, required: true },
  why: { ...Provider.String, default: "" },
  color: { ...Provider.String, enum: [...GOAL_COLORS], default: "apple" },
  weeklyTargetMinutes: { ...Provider.Number, default: 0 },
  targetDate: { ...Provider.String, default: null },
  status: { ...Provider.String, enum: [...GOAL_STATUSES], default: "active" },
  milestones: Provider.Mixed,
  position: { ...Provider.Number, default: 0 },
  createdAt: { ...Provider.Date, required: true },
  updatedAt: { ...Provider.Date, required: true },
});
