import { formatClock, sessionSeconds } from "@ellma/shared";
import { usePreferences } from "../lib/preferences";
import { navigate } from "../lib/router";
import { useNow, useStore } from "../lib/store";
import { Icon } from "./Icon";

export function FocusBar() {
  const { copy } = usePreferences();
  const store = useStore();
  const now = useNow(1000, Boolean(store.active));
  if (!store.active) {
    return null;
  }
  const task = store.tasks.find((entry) => entry.id === store.active?.taskId);
  const goal = store.goals.find((entry) => entry.id === store.active?.goalId);
  return (
    <button
      type="button"
      className="focus-bar"
      onClick={() => navigate("/focus")}
      aria-label={copy.focus.open}
    >
      <span className="focus-bar-dot" />
      <span className="focus-bar-title">{task?.title ?? goal?.title ?? copy.focus.freeFocus}</span>
      <span className="focus-bar-clock">{formatClock(sessionSeconds(store.active, now))}</span>
      <Icon name="chevronRight" size={16} />
    </button>
  );
}
