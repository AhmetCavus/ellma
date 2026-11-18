import { useState } from "react";
import { usePreferences } from "../lib/preferences";
import { useStore } from "../lib/store";
import { Dialog } from "./Dialog";

function localTimeValue(date: Date): string {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function LogTimeDialog({
  onClose,
  goalId = null,
}: {
  onClose: () => void;
  goalId?: string | null;
}) {
  const { copy } = usePreferences();
  const store = useStore();
  const [selectedGoal, setSelectedGoal] = useState<string | null>(goalId);
  const [minutes, setMinutes] = useState("30");
  const [endedAt, setEndedAt] = useState(() => localTimeValue(new Date()));
  const [busy, setBusy] = useState(false);

  return (
    <Dialog title={copy.focus.logTitle} onClose={onClose}>
      <form
        className="form"
        onSubmit={(event) => {
          event.preventDefault();
          const end = new Date(endedAt);
          const length = Math.max(1, Math.min(16 * 60, Math.round(Number(minutes) || 0)));
          setBusy(true);
          void store
            .logSession({
              goalId: selectedGoal,
              startedAt: new Date(end.getTime() - length * 60_000).toISOString(),
              endedAt: end.toISOString(),
            })
            .then((saved) => {
              if (saved) {
                store.notify(copy.focus.logged);
                onClose();
              }
            })
            .finally(() => setBusy(false));
        }}
      >
        <label>
          {copy.tasks.goal}
          <select
            value={selectedGoal ?? ""}
            onChange={(event) => setSelectedGoal(event.target.value || null)}
          >
            <option value="">{copy.common.noGoal}</option>
            {store.goals
              .filter((goal) => goal.status === "active")
              .map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.title}
                </option>
              ))}
          </select>
        </label>
        <div className="form-row">
          <label>
            {copy.focus.minutes}
            <input
              type="number"
              min={1}
              max={960}
              inputMode="numeric"
              value={minutes}
              onChange={(event) => setMinutes(event.target.value)}
              required
            />
          </label>
          <label>
            {copy.focus.endedAt}
            <input
              type="datetime-local"
              value={endedAt}
              max={localTimeValue(new Date())}
              onChange={(event) => setEndedAt(event.target.value)}
              required
            />
          </label>
        </div>
        <footer className="form-actions">
          <button type="button" className="button ghost" onClick={onClose}>
            {copy.common.cancel}
          </button>
          <button className="button" disabled={busy}>
            {busy ? copy.common.working : copy.common.save}
          </button>
        </footer>
      </form>
    </Dialog>
  );
}
