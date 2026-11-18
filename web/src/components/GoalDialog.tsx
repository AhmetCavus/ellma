import { useState } from "react";
import { GOAL_COLORS, type Goal, type GoalColor, type GoalStatus } from "@ellma/shared";
import { usePreferences } from "../lib/preferences";
import { useStore } from "../lib/store";
import { navigate } from "../lib/router";
import { Dialog } from "./Dialog";

export function GoalDialog({ goal, onClose }: { goal?: Goal; onClose: () => void }) {
  const { copy } = usePreferences();
  const store = useStore();
  const [title, setTitle] = useState(goal?.title ?? "");
  const [why, setWhy] = useState(goal?.why ?? "");
  const [color, setColor] = useState<GoalColor>(
    goal?.color ?? GOAL_COLORS[store.goals.length % GOAL_COLORS.length] ?? "apple",
  );
  const [hours, setHours] = useState(goal ? String(goal.weeklyTargetMinutes / 60 || "") : "3");
  const [targetDate, setTargetDate] = useState(goal?.targetDate ?? "");
  const [status, setStatus] = useState<GoalStatus>(goal?.status ?? "active");
  const [busy, setBusy] = useState(false);

  return (
    <Dialog title={goal ? copy.goals.editGoal : copy.goals.newGoal} onClose={onClose}>
      <form
        className="form"
        onSubmit={(event) => {
          event.preventDefault();
          setBusy(true);
          const input = {
            title,
            why,
            color,
            status,
            weeklyTargetMinutes: Math.max(
              0,
              Math.min(168 * 60, Math.round((Number(hours) || 0) * 60)),
            ),
            targetDate: targetDate || null,
            milestones: goal?.milestones ?? [],
          };
          if (goal) {
            void store
              .updateGoal(goal.id, input)
              .then((saved) => saved && onClose())
              .finally(() => setBusy(false));
            return;
          }
          void store
            .createGoal(input)
            .then((created) => {
              if (created) {
                onClose();
                navigate(`/goals/${created.id}`);
              }
            })
            .finally(() => setBusy(false));
        }}
      >
        <label>
          {copy.goals.name}
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={copy.goals.namePlaceholder}
            required
            maxLength={140}
            autoFocus
          />
        </label>
        <label>
          {copy.goals.why}
          <textarea
            value={why}
            onChange={(event) => setWhy(event.target.value)}
            placeholder={copy.goals.whyPlaceholder}
            rows={3}
            maxLength={4000}
          />
        </label>
        <div className="form-row">
          <label>
            {copy.goals.weeklyTarget}
            <input
              type="number"
              min={0}
              max={168}
              step={0.5}
              inputMode="decimal"
              value={hours}
              onChange={(event) => setHours(event.target.value)}
            />
          </label>
          <label>
            {copy.goals.targetDate}
            <input
              type="date"
              value={targetDate}
              onChange={(event) => setTargetDate(event.target.value)}
            />
          </label>
        </div>
        <fieldset className="swatches">
          <legend>{copy.goals.color}</legend>
          {GOAL_COLORS.map((option) => (
            <label key={option} className="swatch" title={copy.goals.colors[option]}>
              <input
                type="radio"
                name="color"
                value={option}
                checked={color === option}
                onChange={() => setColor(option)}
              />
              <span style={{ background: `var(--goal-${option})` }} />
              <span className="visually-hidden">{copy.goals.colors[option]}</span>
            </label>
          ))}
        </fieldset>
        {goal && (
          <label>
            {copy.goals.status}
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as GoalStatus)}
            >
              {(["active", "completed", "archived"] as const).map((option) => (
                <option key={option} value={option}>
                  {copy.goals.statuses[option]}
                </option>
              ))}
            </select>
          </label>
        )}
        <footer className="form-actions">
          <button type="button" className="button ghost" onClick={onClose}>
            {copy.common.cancel}
          </button>
          <button className="button" disabled={busy || !title.trim()}>
            {busy ? copy.common.working : copy.common.save}
          </button>
        </footer>
      </form>
    </Dialog>
  );
}
