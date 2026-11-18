import { createCollection, Provider } from "yappio";

export type DailyNoteRecord = {
  ownerId: string;
  date: string;
  locale: string;
  text: string;
  createdAt: Date;
};

export default createCollection<DailyNoteRecord>("EllmaDailyNote").withSchema({
  ownerId: { ...Provider.String, required: true, index: true },
  date: { ...Provider.String, required: true },
  locale: { ...Provider.String, required: true },
  text: { ...Provider.String, default: "" },
  createdAt: { ...Provider.Date, required: true },
});
