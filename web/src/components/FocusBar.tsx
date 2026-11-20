import { formatClock, sessionSeconds } from "@ellma/shared";
import { usePreferences } from "../lib/preferences";
import { navigate } from "../lib/router";
import { useNow, useStore } from "../lib/store";
import { Icon } from "./Icon";

/** The running (or paused) focus, reachable from every page. */
export function FocusBar() {
  const { copy } = usePreferences();
  const store = useStore();
  const now = useNow(1000, Boolean(store.active));
  const run = store.active ?? store.paused;
  if (!run) {
    return null;
  }
  const task = store.tasks.find((entry) => entry.id === run.taskId);
  const goal = store.goals.find((entry) => entry.id === run.goalId);
  const seconds = store.active
    ? store.carriedSeconds + sessionSeconds(store.active, now)
    : (store.paused?.seconds ?? 0);
  return (
    <button
      type="button"
      className={`focus-bar ${store.active ? "" : "is-paused"}`}
      onClick={() => navigate("/focus")}
      aria-label={copy.focus.open}
    >
      {store.active ? (
        <span className="focus-bar-dot" />
      ) : (
        <Icon name="pause" size={14} label={copy.focus.paused} />
      )}
      <span className="focus-bar-title">{task?.title ?? goal?.title ?? copy.focus.freeFocus}</span>
      <span className="focus-bar-clock">{formatClock(seconds)}</span>
      <Icon name="chevronRight" size={16} />
    </button>
  );
}
