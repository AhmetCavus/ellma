import { createCollection, Provider } from "yappio";
import type { AssistantAction } from "@ellma/shared";

export type AssistantMessageRecord = {
  ownerId: string;
  role: "user" | "assistant";
  content: string;
  actions: AssistantAction[];
  createdAt: Date;
};

export default createCollection<AssistantMessageRecord>("EllmaAssistantMessage").withSchema({
  ownerId: { ...Provider.String, required: true, index: true },
  role: { ...Provider.String, enum: ["user", "assistant"], required: true },
  content: { ...Provider.String, default: "" },
  actions: Provider.Mixed,
  createdAt: { ...Provider.Date, required: true },
});
