import { useState } from "react";
import { todayKey, type Task } from "@ellma/shared";
import { usePreferences } from "../lib/preferences";
import { useStore } from "../lib/store";
import { Dialog } from "./Dialog";

export function TaskDialog({
  task,
  onClose,
  defaults,
}: {
  task?: Task;
  onClose: () => void;
  defaults?: { plannedOn?: string | null; goalId?: string | null };
}) {
  const { copy } = usePreferences();
  const store = useStore();
  const [title, setTitle] = useState(task?.title ?? "");
  const [notes, setNotes] = useState(task?.notes ?? "");
  const [goalId, setGoalId] = useState<string | null>(task?.goalId ?? defaults?.goalId ?? null);
  const [plannedOn, setPlannedOn] = useState<string>(
    task ? (task.plannedOn ?? "") : (defaults?.plannedOn ?? todayKey()),
  );
  const [estimate, setEstimate] = useState(
    task?.estimateMinutes ? String(task.estimateMinutes) : "",
  );
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<Task | null>(null);
  const goals = store.goals.filter((goal) => goal.status === "active" || goal.id === goalId);

  if (created) {
    return (
      <Dialog title={copy.tasks.newTask} onClose={onClose}>
        <TaskCreated task={created} onOk={onClose} />
      </Dialog>
    );
  }

  return (
    <Dialog title={task ? copy.tasks.editTask : copy.tasks.newTask} onClose={onClose}>
      <form
        className="form"
        onSubmit={(event) => {
          event.preventDefault();
          setBusy(true);
          const values = {
            title,
            notes,
            goalId,
            plannedOn: plannedOn || null,
            estimateMinutes: estimate ? Math.max(1, Math.min(1440, Number(estimate))) : null,
          };
          if (task) {
            void store
              .patchTask(task.id, values)
              .then((saved) => saved && onClose())
              .finally(() => setBusy(false));
          } else {
            void store
              .createTask(values)
              .then((saved) => saved && setCreated(saved))
              .finally(() => setBusy(false));
          }
        }}
      >
        <label>
          {copy.tasks.title}
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            maxLength={140}
            autoFocus
          />
        </label>
        <div className="form-row">
          <label>
            {copy.tasks.goal}
            <select
              value={goalId ?? ""}
              onChange={(event) => setGoalId(event.target.value || null)}
            >
              <option value="">{copy.common.noGoal}</option>
              {goals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            {copy.tasks.plannedOn}
            <input
              type="date"
              value={plannedOn}
              onChange={(event) => setPlannedOn(event.target.value)}
            />
          </label>
        </div>
        <label>
          {copy.tasks.estimate}
          <input
            type="number"
            min={1}
            max={1440}
            inputMode="numeric"
            value={estimate}
            onChange={(event) => setEstimate(event.target.value)}
          />
        </label>
        <label>
          {copy.tasks.notes}
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            maxLength={4000}
          />
        </label>
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

/** Confirms a newly created task; OK returns to the screen the dialog was opened from. */
export function TaskCreated({ task, onOk }: { task: Task; onOk: () => void }) {
  const { copy } = usePreferences();
  return (
    <div className="form task-created" role="status">
      <p>
        <strong>{copy.tasks.created}</strong>
        <br />
        {copy.tasks.createdDetail(task.title)}
      </p>
      <footer className="form-actions">
        <button type="button" className="button" onClick={onOk} autoFocus>
          {copy.tasks.ok}
        </button>
      </footer>
    </div>
  );
}
