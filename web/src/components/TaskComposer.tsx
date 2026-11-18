import { useState } from "react";
import { usePreferences } from "../lib/preferences";
import { useStore } from "../lib/store";
import { Icon } from "./Icon";

export function TaskComposer({
  plannedOn,
  goalId = null,
  placeholder,
}: {
  plannedOn: string | null;
  goalId?: string | null;
  placeholder?: string;
}) {
  const { copy } = usePreferences();
  const store = useStore();
  const [title, setTitle] = useState("");
  const [selectedGoal, setSelectedGoal] = useState<string | null>(goalId);
  const [busy, setBusy] = useState(false);
  const activeGoals = store.goals.filter((goal) => goal.status === "active");

  return (
    <form
      className="composer"
      onSubmit={(event) => {
        event.preventDefault();
        if (!title.trim() || busy) {
          return;
        }
        setBusy(true);
        void store
          .createTask({ title, plannedOn, goalId: goalId ?? selectedGoal })
          .then((task) => task && setTitle(""))
          .finally(() => setBusy(false));
      }}
    >
      <Icon name="plus" size={18} />
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder={placeholder ?? copy.tasks.addPlaceholder}
        aria-label={placeholder ?? copy.tasks.addPlaceholder}
        maxLength={140}
      />
      {goalId === null && activeGoals.length > 0 && (
        <select
          value={selectedGoal ?? ""}
          onChange={(event) => setSelectedGoal(event.target.value || null)}
          aria-label={copy.tasks.goal}
        >
          <option value="">{copy.common.noGoal}</option>
          {activeGoals.map((goal) => (
            <option key={goal.id} value={goal.id}>
              {goal.title}
            </option>
          ))}
        </select>
      )}
      <button className="button small" disabled={!title.trim() || busy}>
        {copy.tasks.add}
      </button>
    </form>
  );
}
