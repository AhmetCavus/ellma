import { useState } from "react";
import { LIMITS, type Task } from "@ellma/shared";
import { usePreferences } from "../lib/preferences";
import { navigate } from "../lib/router";
import { useStore } from "../lib/store";
import { LOOSE_CARD } from "../lib/viewFilter";
import { Dialog } from "./Dialog";
import { GoalTag } from "./GoalDot";
import { Icon } from "./Icon";

/**
 * Picks the steps of a multiple focus from one card (a goal, merged goals, or the steps
 * without a goal). Steps planned for today or overdue come first and start selected.
 */
export function MultiFocusDialog({
  cards,
  today,
  onClose,
}: {
  cards: string[];
  today: string;
  onClose: () => void;
}) {
  const { copy } = usePreferences();
  const store = useStore();
  const activeGoals = new Set(
    store.goals.filter((goal) => goal.status === "active").map((goal) => goal.id),
  );
  const belongs = (task: Task) =>
    task.goalId && activeGoals.has(task.goalId)
      ? cards.includes(task.goalId)
      : cards.includes(LOOSE_CARD);
  const open = store.tasks
    .filter((task) => !task.doneAt && belongs(task))
    .sort(
      (left, right) =>
        cards.indexOf(left.goalId ?? LOOSE_CARD) - cards.indexOf(right.goalId ?? LOOSE_CARD) ||
        left.position - right.position,
    );
  const isPlanned = (task: Task) => Boolean(task.plannedOn && task.plannedOn <= today);
  const planned = open.filter(isPlanned);
  const other = open.filter((task) => !isPlanned(task));
  const [chosen, setChosen] = useState<string[]>(() =>
    planned.slice(0, LIMITS.focusItems).map((task) => task.id),
  );
  const [busy, setBusy] = useState(false);
  const full = chosen.length >= LIMITS.focusItems;

  const toggle = (id: string) =>
    setChosen((previous) =>
      previous.includes(id) ? previous.filter((entry) => entry !== id) : [...previous, id],
    );

  const list = (tasks: Task[], title: string) =>
    tasks.length > 0 && (
      <fieldset className="multi-focus-group">
        <legend>{title}</legend>
        {tasks.map((task) => {
          const checked = chosen.includes(task.id);
          return (
            <label key={task.id} className={`multi-focus-item ${checked ? "is-on" : ""}`}>
              <input
                type="checkbox"
                checked={checked}
                disabled={!checked && full}
                onChange={() => toggle(task.id)}
              />
              <span>
                <span className="multi-focus-title">{task.title}</span>
                <GoalTag goal={store.goals.find((goal) => goal.id === task.goalId)} />
              </span>
            </label>
          );
        })}
      </fieldset>
    );

  return (
    <Dialog title={copy.focus.multiPick} onClose={onClose}>
      <form
        className="form multi-focus"
        onSubmit={(event) => {
          event.preventDefault();
          if (chosen.length < 2 || busy) {
            return;
          }
          setBusy(true);
          // Keep the on-screen order rather than the order of clicking.
          const ids = open.map((task) => task.id).filter((id) => chosen.includes(id));
          void store
            .startMultiFocus(ids)
            .then((started) => {
              if (started) {
                onClose();
                navigate("/focus");
              }
            })
            .finally(() => setBusy(false));
        }}
      >
        <p className="muted">{copy.focus.multiHint}</p>
        {open.length < 2 ? (
          <p className="empty">{copy.focus.multiNone}</p>
        ) : (
          <>
            {list(planned, copy.focus.multiPlanned)}
            {list(other, copy.focus.multiOther)}
          </>
        )}
        <p className="hint" role="status">
          {chosen.length < 2
            ? copy.focus.multiNeedTwo
            : full
              ? copy.focus.multiMax(LIMITS.focusItems)
              : ""}
        </p>
        <button className="button large" disabled={chosen.length < 2 || busy}>
          <Icon name="play" size={18} /> {copy.focus.multiStart(chosen.length)}
        </button>
      </form>
    </Dialog>
  );
}
