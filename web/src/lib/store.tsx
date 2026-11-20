import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  addDays,
  focusSessionSchema,
  goalSchema,
  localMidnight,
  reviewWeek,
  startOfWeek,
  taskSchema,
  toApiError,
  todayKey,
  type EllmaApi,
  type FocusSession,
  type Goal,
  type GoalInput,
  type ManualSession,
  type Task,
  type TaskCreate,
  type TaskPatch,
} from "@ellma/shared";
import { z } from "zod";
import { usePreferences } from "./preferences";
import { CACHE_PREFIX, comfortStorageAllowed } from "./consent";
import { playSound } from "./sound";
import { readStored, writeStored } from "./storage";
import type { Session } from "./session";

type Status = "loading" | "ready" | "offline";

/** What a stop saved, as the server stored it, and where the goal's week stands now. */
export type FocusResult = {
  seconds: number;
  completed: boolean;
  goalId: string | null;
  weekSeconds: number;
  targetSeconds: number;
};

/**
 * A paused focus: its time is already saved on the server (pausing ends the running
 * session), so only what to resume and how long this focus has lasted so far live here.
 */
export type PausedFocus = { taskId: string | null; goalId: string | null; seconds: number };

function savedSeconds(session: FocusSession | null): number {
  if (!session) {
    return 0;
  }
  const end = Date.parse(session.endedAt ?? new Date().toISOString());
  return Math.max(0, Math.floor((end - Date.parse(session.startedAt)) / 1000));
}

type Store = {
  userId: string;
  status: Status;
  goals: Goal[];
  tasks: Task[];
  totals: Record<string, number>;
  active: FocusSession | null;
  /** Set while the focus is paused. */
  paused: PausedFocus | null;
  /** Seconds this focus saved before its last resume; the clock adds the running session. */
  carriedSeconds: number;
  sessionsByWeek: Record<string, FocusSession[]>;
  toast: string;
  notify: (message: string) => void;
  refresh: () => Promise<void>;
  loadWeek: (weekStart: string) => Promise<FocusSession[] | null>;
  createGoal: (input: GoalInput) => Promise<Goal | null>;
  updateGoal: (id: string, input: GoalInput) => Promise<boolean>;
  deleteGoal: (id: string) => Promise<boolean>;
  createTask: (input: TaskCreate) => Promise<Task | null>;
  patchTask: (id: string, patch: TaskPatch) => Promise<Task | null>;
  deleteTask: (id: string) => Promise<boolean>;
  startFocus: (taskId: string | null, goalId?: string | null) => Promise<boolean>;
  stopFocus: (completeTask: boolean) => Promise<FocusResult | null>;
  pauseFocus: () => Promise<boolean>;
  resumeFocus: () => Promise<boolean>;
  logSession: (input: ManualSession) => Promise<boolean>;
  deleteSession: (id: string) => Promise<boolean>;
};

const StoreContext = createContext<Store | null>(null);

const cacheSchema = z.object({
  goals: z.array(goalSchema),
  tasks: z.array(taskSchema),
  totals: z.record(z.number()),
  active: focusSessionSchema.nullable(),
  // A pause and the time a resumed focus carries survive a reload with the local copy.
  paused: z
    .object({
      taskId: z.string().nullable(),
      goalId: z.string().nullable(),
      seconds: z.number().min(0),
    })
    .nullable()
    .default(null),
  carriedSeconds: z.number().min(0).default(0),
});

const cacheKey = (userId: string) => `${CACHE_PREFIX}${userId}`;

function readCache(userId: string) {
  try {
    const raw = comfortStorageAllowed() ? readStored(cacheKey(userId)) : null;
    return raw ? cacheSchema.parse(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

/** UTC range for the user's local Monday–Sunday week. */
export function weekRange(weekStart: string) {
  return {
    from: localMidnight(weekStart).toISOString(),
    to: localMidnight(addDays(weekStart, 7)).toISOString(),
  };
}

function upsert<T extends { id: string }>(list: T[], item: T): T[] {
  const index = list.findIndex((entry) => entry.id === item.id);
  if (index === -1) {
    return [...list, item];
  }
  const next = [...list];
  next[index] = item;
  return next;
}

export function StoreProvider({ session, children }: { session: Session; children: ReactNode }) {
  const { copy } = usePreferences();
  const userId = String(session.profile?._id ?? "anonymous");
  const cached = useMemo(() => readCache(userId), [userId]);
  const [status, setStatus] = useState<Status>(cached ? "ready" : "loading");
  const [goals, setGoals] = useState<Goal[]>(cached?.goals ?? []);
  const [tasks, setTasks] = useState<Task[]>(cached?.tasks ?? []);
  const [totals, setTotals] = useState<Record<string, number>>(cached?.totals ?? {});
  const [active, setActive] = useState<FocusSession | null>(cached?.active ?? null);
  const [paused, setPaused] = useState<PausedFocus | null>(cached?.paused ?? null);
  const [carriedSeconds, setCarriedSeconds] = useState(cached?.carriedSeconds ?? 0);
  const [sessionsByWeek, setSessionsByWeek] = useState<Record<string, FocusSession[]>>({});
  const [toast, setToast] = useState("");
  const toastTimer = useRef<number>();
  const api: EllmaApi = session.api;

  const notify = useCallback((message: string) => {
    window.clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = window.setTimeout(() => setToast(""), 4200);
  }, []);

  /** Runs a request; expired sessions sign out, other failures show one calm message. */
  const attempt = useCallback(
    async <T,>(operation: () => Promise<T>): Promise<T | null> => {
      try {
        return await operation();
      } catch (failure) {
        const error = toApiError(failure);
        if (error.isUnauthorized) {
          session.signOut(copy.common.sessionExpired);
        } else {
          notify(error.isNetwork ? copy.common.offline : copy.common.error);
        }
        return null;
      }
    },
    [copy, notify, session],
  );

  const loadWeek = useCallback(
    async (weekStart: string) => {
      const range = weekRange(weekStart);
      const sessions = await attempt(() => api.listSessions(range.from, range.to));
      if (sessions) {
        setSessionsByWeek((previous) => ({ ...previous, [weekStart]: sessions }));
      }
      return sessions;
    },
    [api, attempt],
  );

  const refresh = useCallback(async () => {
    const today = todayKey();
    try {
      const [nextGoals, nextTasks, focus, goalTotals] = await Promise.all([
        api.listGoals(),
        api.listTasks(addDays(today, -35), addDays(today, 21)),
        api.focusState(),
        api.goalTotals(),
      ]);
      setGoals(nextGoals);
      setTasks(nextTasks);
      setActive(focus.active);
      if (focus.active) {
        // A focus started or resumed elsewhere replaces a pause shown here.
        setPaused(null);
      }
      setTotals(Object.fromEntries(goalTotals.map((row) => [row.goalId, row.seconds])));
      setStatus("ready");
    } catch (failure) {
      const error = toApiError(failure);
      if (error.isUnauthorized) {
        session.signOut(copy.common.sessionExpired);
        return;
      }
      setStatus((previous) => (previous === "loading" && !cached ? "offline" : previous));
      notify(error.isNetwork ? copy.common.offline : copy.common.error);
    }
    await loadWeek(startOfWeek(today));
  }, [api, cached, copy, loadWeek, notify, session]);

  useEffect(() => {
    void refresh();
    const onFocus = () => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    };
    document.addEventListener("visibilitychange", onFocus);
    return () => document.removeEventListener("visibilitychange", onFocus);
  }, [refresh]);

  useEffect(() => {
    if (status === "ready" && comfortStorageAllowed()) {
      writeStored(
        cacheKey(userId),
        JSON.stringify({ goals, tasks, totals, active, paused, carriedSeconds }),
      );
    }
  }, [active, carriedSeconds, goals, paused, status, tasks, totals, userId]);

  const value = useMemo<Store>(() => {
    const reloadProgress = async () => {
      const goalTotals = await attempt(() => api.goalTotals());
      if (goalTotals) {
        setTotals(Object.fromEntries(goalTotals.map((row) => [row.goalId, row.seconds])));
      }
      return loadWeek(startOfWeek(todayKey()));
    };
    return {
      userId,
      status,
      goals,
      tasks,
      totals,
      active,
      paused,
      carriedSeconds,
      sessionsByWeek,
      toast,
      notify,
      refresh,
      loadWeek,
      async createGoal(input) {
        const goal = await attempt(() => api.createGoal(input));
        if (goal) {
          setGoals((previous) => upsert(previous, goal));
        }
        return goal;
      },
      async updateGoal(id, input) {
        const goal = await attempt(() => api.updateGoal(id, input));
        if (goal) {
          setGoals((previous) => upsert(previous, goal));
        }
        return Boolean(goal);
      },
      async deleteGoal(id) {
        const removed = await attempt(() => api.deleteGoal(id));
        if (removed) {
          setGoals((previous) => previous.filter((goal) => goal.id !== id));
          setTasks((previous) =>
            previous.map((task) => (task.goalId === id ? { ...task, goalId: null } : task)),
          );
        }
        return Boolean(removed);
      },
      async createTask(input) {
        const task = await attempt(() => api.createTask(input));
        if (task) {
          setTasks((previous) => upsert(previous, task));
        }
        return task;
      },
      async patchTask(id, patch) {
        const before = tasks.find((task) => task.id === id);
        if (before) {
          const { done, ...rest } = patch;
          const optimistic: Task = {
            ...before,
            ...rest,
            doneAt: done === undefined ? before.doneAt : done ? new Date().toISOString() : null,
          };
          setTasks((previous) => upsert(previous, optimistic));
        }
        const task = await attempt(() => api.updateTask(id, patch));
        setTasks((previous) =>
          task ? upsert(previous, task) : before ? upsert(previous, before) : previous,
        );
        return task;
      },
      async deleteTask(id) {
        const removed = await attempt(() => api.deleteTask(id));
        if (removed) {
          setTasks((previous) => previous.filter((task) => task.id !== id));
        }
        return Boolean(removed);
      },
      async startFocus(taskId, goalId = null) {
        const state = await attempt(() => api.startFocus({ taskId, goalId }));
        if (state) {
          playSound("focusStart");
          setActive(state.active);
          setPaused(null);
          setCarriedSeconds(0);
          await reloadProgress();
        }
        return Boolean(state);
      },
      async stopFocus(completeTask) {
        let seconds: number;
        let goalId: string | null;
        let completed = false;
        if (!active && paused) {
          // The time is already saved; finishing a pause only checks the task off if asked.
          const pausedTaskId = paused.taskId;
          if (completeTask && pausedTaskId) {
            const task = await attempt(() => api.updateTask(pausedTaskId, { done: true }));
            if (!task) {
              return null;
            }
            setTasks((previous) => upsert(previous, task));
            completed = true;
          }
          seconds = paused.seconds;
          goalId = paused.goalId;
        } else {
          const running = active;
          const state = await attempt(() => api.stopFocus(completeTask));
          if (!state) {
            return null;
          }
          setActive(null);
          if (state.completedTask) {
            const done = state.completedTask;
            setTasks((previous) => upsert(previous, done));
            completed = true;
          }
          const saved = state.stopped ?? running;
          seconds = carriedSeconds + savedSeconds(saved);
          goalId = saved?.goalId ?? tasks.find((task) => task.id === saved?.taskId)?.goalId ?? null;
        }
        playSound(completed ? "complete" : "focusEnd");
        setPaused(null);
        setCarriedSeconds(0);
        const weekSessions = (await reloadProgress()) ?? [];
        const week = reviewWeek(startOfWeek(todayKey()), weekSessions, goals, tasks).goals.find(
          (entry) => entry.goalId === goalId,
        );
        const goal = goals.find((entry) => entry.id === goalId);
        return {
          seconds,
          completed,
          goalId,
          weekSeconds: week?.seconds ?? 0,
          targetSeconds: (goal?.weeklyTargetMinutes ?? 0) * 60,
        };
      },
      async pauseFocus() {
        const running = active;
        if (!running) {
          return false;
        }
        const state = await attempt(() => api.stopFocus(false));
        if (!state) {
          return false;
        }
        playSound("focusEnd");
        const saved = state.stopped ?? running;
        setActive(null);
        setPaused({
          taskId: saved.taskId,
          goalId: saved.goalId,
          seconds: carriedSeconds + savedSeconds(saved),
        });
        setCarriedSeconds(0);
        await reloadProgress();
        return true;
      },
      async resumeFocus() {
        if (!paused) {
          return false;
        }
        const state = await attempt(() =>
          api.startFocus({ taskId: paused.taskId, goalId: paused.taskId ? null : paused.goalId }),
        );
        if (!state) {
          return false;
        }
        playSound("focusStart");
        setActive(state.active);
        setCarriedSeconds(paused.seconds);
        setPaused(null);
        await reloadProgress();
        return true;
      },
      async logSession(input) {
        const logged = await attempt(() => api.logSession(input));
        if (logged) {
          await reloadProgress();
        }
        return Boolean(logged);
      },
      async deleteSession(id) {
        const removed = await attempt(() => api.deleteSession(id));
        if (removed) {
          setSessionsByWeek((previous) =>
            Object.fromEntries(
              Object.entries(previous).map(([week, list]) => [
                week,
                list.filter((entry) => entry.id !== id),
              ]),
            ),
          );
          await reloadProgress();
        }
        return Boolean(removed);
      },
    };
  }, [
    active,
    api,
    attempt,
    carriedSeconds,
    paused,
    goals,
    loadWeek,
    notify,
    refresh,
    sessionsByWeek,
    status,
    tasks,
    toast,
    totals,
  ]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const value = useContext(StoreContext);
  if (!value) {
    throw new Error("useStore must be used inside StoreProvider.");
  }
  return value;
}

export function useNow(intervalMs = 1000, enabled = true): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!enabled) {
      return;
    }
    const timer = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(timer);
  }, [enabled, intervalMs]);
  return now;
}
