import { useMemo } from "react";
import { buildGuide, startOfWeek, todayKey, type Guide } from "@ellma/shared";
import { useNow, useStore } from "./store";

/** Ellma's current view of the goals: one pulse per active goal and the next best step. */
export function useGuide(): Guide & { today: string } {
  const store = useStore();
  const now = useNow(30_000);
  const today = todayKey(now);
  const sessions = store.sessionsByWeek[startOfWeek(today)];
  return useMemo(
    () => ({
      ...buildGuide({
        goals: store.goals,
        tasks: store.tasks,
        sessions: sessions ?? [],
        active: store.active,
        today,
        now,
      }),
      today,
    }),
    [now, sessions, store.active, store.goals, store.tasks, today],
  );
}
