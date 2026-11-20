import { useState } from "react";
import { addDays, goalHours, todayKey, type GoalPulse, type Task } from "@ellma/shared";
import { usePreferences } from "../lib/preferences";
import { useStore } from "../lib/store";
import { navigate } from "../lib/router";
import { celebrate as burst } from "../lib/motion";
import { playChime } from "../lib/sound";
import { confirmAction } from "./Dialog";
import { GoalApple } from "./GoalApple";
import { GoalTag } from "./GoalDot";
import { Icon } from "./Icon";
import { TaskDialog } from "./TaskDialog";

export function TaskItem({
  task,
  showGoal = true,
  showDay = false,
  focusLabel = false,
  pulse,
}: {
  task: Task;
  showGoal?: boolean;
  showDay?: boolean;
  /** Shows "Start focus" as a labelled button instead of a quiet icon. */
  focusLabel?: boolean;
  /** The goal's week, so the row can show it as a small apple. */
  pulse?: GoalPulse;
}) {
  const { copy, locale } = usePreferences();
  const store = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const goal = store.goals.find((entry) => entry.id === task.goalId);
  const done = Boolean(task.doneAt);
  const today = todayKey();
  const isActive = store.active?.taskId === task.id;

  const toggle = (origin: Element) => {
    if (!done) {
      setCelebrate(true);
      playChime();
      burst(origin);
      window.setTimeout(() => setCelebrate(false), 700);
    }
    void store.patchTask(task.id, {
      done: !done,
      ...(done || task.plannedOn ? {} : { plannedOn: today }),
    });
  };

  const move = (plannedOn: string | null) => {
    setMenuOpen(false);
    void store.patchTask(task.id, { plannedOn });
  };

  return (
    <li
      className={`task ${done ? "task-done" : ""} ${celebrate ? "task-celebrate" : ""} ${isActive ? "task-active" : ""}`}
    >
      <button
        type="button"
        className="task-check"
        onClick={(event) => toggle(event.currentTarget)}
        aria-label={done ? copy.tasks.markOpen : copy.tasks.markDone}
        aria-pressed={done}
      >
        <Icon name="check" size={14} />
      </button>
      <button type="button" className="task-main" onClick={() => setEditing(true)}>
        <span className="task-title">{task.title}</span>
        <span className="task-meta">
          {showGoal && pulse && goal && (
            <span
              className="goal-tag"
              style={{ color: `var(--goal-${goal.color})` }}
              title={
                pulse.targetSeconds > 0
                  ? copy.goals.weekOf(goalHours(pulse.weekSeconds), goalHours(pulse.targetSeconds))
                  : copy.goals.weekFree(goalHours(pulse.weekSeconds))
              }
            >
              <GoalApple color={goal.color} ratio={pulse.ratio} size={16} />
              <span>{goal.title}</span>
            </span>
          )}
          {showGoal && !pulse && <GoalTag goal={goal} />}
          {showDay && task.plannedOn && (
            <span className="task-day">
              {new Date(`${task.plannedOn}T12:00:00`).toLocaleDateString(copy.dateLocale, {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
            </span>
          )}
          {task.estimateMinutes ? (
            <span className="task-day">{task.estimateMinutes} min</span>
          ) : null}
        </span>
      </button>
      {!done && !isActive && (
        <button
          type="button"
          className={
            focusLabel ? "button small ghost task-focus-labelled" : "icon-button task-focus"
          }
          aria-label={copy.tasks.startFocus}
          title={copy.tasks.startFocus}
          onClick={() => {
            void store.startFocus(task.id).then((started) => started && navigate("/focus"));
          }}
        >
          <Icon name="play" size={focusLabel ? 14 : 16} />
          {focusLabel && <span>{copy.tasks.startFocus}</span>}
        </button>
      )}
      <div className="menu-anchor">
        <button
          type="button"
          className="icon-button"
          aria-label={copy.tasks.more}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <Icon name="more" />
        </button>
        {menuOpen && (
          <div className="menu" role="menu" onMouseLeave={() => setMenuOpen(false)} lang={locale}>
            {!done && task.plannedOn !== today && (
              <button role="menuitem" onClick={() => move(today)}>
                <Icon name="calendar" size={16} /> {copy.tasks.moveToday}
              </button>
            )}
            {!done && (
              <button role="menuitem" onClick={() => move(addDays(today, 1))}>
                <Icon name="chevronRight" size={16} /> {copy.tasks.moveTomorrow}
              </button>
            )}
            {!done && task.plannedOn && (
              <button role="menuitem" onClick={() => move(null)}>
                <Icon name="clock" size={16} /> {copy.tasks.moveLater}
              </button>
            )}
            <button
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                setEditing(true);
              }}
            >
              <Icon name="edit" size={16} /> {copy.common.edit}
            </button>
            <button
              role="menuitem"
              className="danger"
              onClick={() => {
                setMenuOpen(false);
                if (confirmAction(copy.tasks.deleteConfirm)) {
                  void store.deleteTask(task.id);
                }
              }}
            >
              <Icon name="trash" size={16} /> {copy.common.delete}
            </button>
          </div>
        )}
      </div>
      {editing && <TaskDialog task={task} onClose={() => setEditing(false)} />}
    </li>
  );
}

export function TaskList({
  tasks,
  empty,
  showGoal,
  showDay,
  focusLabel,
  pulseOf,
}: {
  tasks: Task[];
  empty?: string;
  showGoal?: boolean;
  showDay?: boolean;
  focusLabel?: boolean;
  pulseOf?: (goalId: string | null) => GoalPulse | undefined;
}) {
  if (tasks.length === 0) {
    return empty ? <p className="empty">{empty}</p> : null;
  }
  return (
    <ul className="task-list">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          showGoal={showGoal}
          showDay={showDay}
          focusLabel={focusLabel}
          pulse={pulseOf?.(task.goalId)}
        />
      ))}
    </ul>
  );
}
