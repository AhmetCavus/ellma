import { useEffect, useState } from "react";
import { formatClock, formatDuration, sessionSeconds, todayKey } from "@ellma/shared";
import { AppleMark } from "../components/AppleMark";
import { GoalTag } from "../components/GoalDot";
import { Icon } from "../components/Icon";
import { usePreferences } from "../lib/preferences";
import { navigate } from "../lib/router";
import { isPlainShortcut } from "../lib/shortcuts";
import { useNow, useStore } from "../lib/store";
import { playChime } from "../lib/voice";

export function FocusPage() {
  const { copy } = usePreferences();
  const store = useStore();
  const now = useNow(1000, Boolean(store.active));
  const [choice, setChoice] = useState("");
  const active = store.active;
  const task = store.tasks.find((entry) => entry.id === active?.taskId);
  const goal = store.goals.find((entry) => entry.id === (active?.goalId ?? task?.goalId));
  const today = todayKey(now);
  const candidates = store.tasks
    .filter((entry) => !entry.doneAt)
    .sort(
      (a, b) =>
        Number(b.plannedOn === today) - Number(a.plannedOn === today) ||
        (a.plannedOn ?? "9999").localeCompare(b.plannedOn ?? "9999"),
    );

  const stop = async (complete: boolean) => {
    const result = await store.stopFocus(complete);
    if (!result) {
      return;
    }
    if (result.completed) {
      playChime();
      store.notify(copy.focus.taskCompleted);
    } else {
      store.notify(copy.focus.sessionSaved(formatDuration(result.seconds)));
    }
    navigate("/today");
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Enter" && (event.metaKey || event.ctrlKey) && store.active) {
        event.preventDefault();
        void stop(Boolean(store.active.taskId));
      } else if (event.key.toLowerCase() === "s" && isPlainShortcut(event) && store.active) {
        event.preventDefault();
        void stop(false);
      } else if (event.key === "Escape" && !document.querySelector("dialog[open]")) {
        navigate("/today");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => {
    const previous = document.title;
    if (active) {
      document.title = `${formatClock(sessionSeconds(active, now))} · ${task?.title ?? copy.focus.freeFocus}`;
    }
    return () => {
      document.title = previous;
    };
  }, [active, copy, now, task]);

  return (
    <div className="focus-screen">
      <button
        type="button"
        className="icon-button focus-exit"
        onClick={() => navigate("/today")}
        aria-label={copy.focus.exit}
        title={copy.focus.exit}
      >
        <Icon name="close" />
      </button>
      {active ? (
        <div className="focus-center">
          <AppleMark size={56} className="apple-breathe" />
          <p className="eyebrow">{copy.focus.running}</p>
          <h1 className="focus-task">{task?.title ?? goal?.title ?? copy.focus.freeFocus}</h1>
          {goal && <GoalTag goal={goal} />}
          <div className="focus-clock" aria-live="off">
            {formatClock(sessionSeconds(active, now))}
          </div>
          <div className="button-row center">
            <button type="button" className="button ghost large" onClick={() => void stop(false)}>
              <Icon name="stop" size={18} /> {copy.focus.stop}
            </button>
            {active.taskId && (
              <button
                type="button"
                className="button large"
                onClick={() => void stop(true)}
                title={copy.focus.completeHint}
              >
                <Icon name="check" size={18} /> {copy.focus.complete}
              </button>
            )}
          </div>
          {active.taskId && <p className="hint">{copy.focus.completeHint}</p>}
        </div>
      ) : (
        <form
          className="focus-center"
          onSubmit={(event) => {
            event.preventDefault();
            void store.startFocus(choice || null);
          }}
        >
          <AppleMark size={56} />
          <h1>{copy.focus.pickTask}</h1>
          <select
            value={choice}
            onChange={(event) => setChoice(event.target.value)}
            className="focus-select"
            aria-label={copy.focus.pickTask}
          >
            <option value="">{copy.focus.freeFocus}</option>
            {candidates.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.title}
              </option>
            ))}
          </select>
          <button className="button large">
            <Icon name="play" size={18} /> {copy.focus.start}
          </button>
        </form>
      )}
    </div>
  );
}
