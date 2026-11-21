import { useState, type FormEvent } from "react";
import {
  allTags,
  DATE_GROUPS,
  EMPTY_GOALS_FILTER,
  GOAL_FILTER_STATUSES,
  GOAL_SORTS,
  goalAttention,
  goalHours,
  groupGoals,
  PLAN_TARGETS,
  planGoal,
  type DateGroup,
  type Goal,
  type GoalPulse,
  type PlanTarget,
  type Task,
} from "@ellma/shared";
import { Dialog } from "../components/Dialog";
import { TaskCreated } from "../components/TaskDialog";
import { CountedHours } from "../components/Counted";
import { GoalApple } from "../components/GoalApple";
import { Icon } from "../components/Icon";
import { useEllma } from "../lib/ellma";
import { usePreferences } from "../lib/preferences";
import { linkHandler, navigate } from "../lib/router";
import { useStore } from "../lib/store";
import { useViewFilter } from "../lib/viewFilter";
import { ViewControls } from "../components/ViewControls";

/** Home. Every goal is an apple with its week, its why and the one step that comes next. */
export function GoalsPage() {
  const { copy } = usePreferences();
  const store = useStore();
  const ellma = useEllma();
  const [showInactive, setShowInactive] = useState(false);
  const { pulses, today } = ellma.guide;
  const inactive = store.goals.filter((goal) => goal.status !== "active");
  const [filter, setFilter, resetFilter] = useViewFilter(
    "goals",
    store.userId,
    EMPTY_GOALS_FILTER,
    GOAL_FILTER_STATUSES,
    GOAL_SORTS,
  );
  const groups = groupGoals(pulses, store.tasks, today, filter);
  const tags = allTags(store.goals.filter((goal) => goal.status === "active"));
  const [dragging, setDragging] = useState<string | null>(null);
  const [target, setTarget] = useState<DateGroup | null>(null);
  const [firstStep, setFirstStep] = useState<{
    goal: Goal;
    plannedOn: string | null;
    target: PlanTarget;
  } | null>(null);
  const isTarget = (group: DateGroup): group is PlanTarget =>
    (PLAN_TARGETS as readonly string[]).includes(group);
  // While a goal is dragged every day it can go to is shown, even when empty.
  const shown = DATE_GROUPS.flatMap((group) => {
    const items = groups.find((entry) => entry.group === group)?.items ?? [];
    return items.length > 0 || (dragging && isTarget(group)) ? [{ group, items }] : [];
  });

  /** Plans a goal's next step for a day; see `planGoal` for what moves. */
  const plan = async (goalId: string, to: PlanTarget) => {
    const goal = store.goals.find((entry) => entry.id === goalId);
    if (!goal) {
      return;
    }
    const result = planGoal(goalId, store.tasks, to, today);
    if (result.kind === "needs_step") {
      setFirstStep({ goal, plannedOn: result.plannedOn, target: to });
      return;
    }
    const saved = await Promise.all(
      result.moves.map((move) => store.patchTask(move.taskId, { plannedOn: move.plannedOn })),
    );
    if (saved.length > 0 && saved.every(Boolean)) {
      store.notify(copy.views.planned(goal.title, copy.views.groups[to]));
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>{copy.goals.title}</h1>
          <p className="page-lead">{copy.goals.lead}</p>
        </div>
        <button type="button" className="button" onClick={ellma.startGoalGuide} title="G">
          <Icon name="plus" size={18} /> {copy.goals.newGoal}
        </button>
      </header>

      {pulses.length === 0 && store.status === "ready" && (
        <div className="empty-hero">
          <GoalApple color="apple" ratio={0} size={96} />
          <h2>{copy.goals.emptyTitle}</h2>
          <p>{copy.goals.empty}</p>
          <button type="button" className="button large" onClick={ellma.startGoalGuide}>
            <Icon name="sparkle" size={18} /> {copy.guide.first_goal.action}
          </button>
        </div>
      )}

      {pulses.length > 0 && (
        <>
          <ViewControls
            tags={tags}
            statuses={GOAL_FILTER_STATUSES.map((value) => ({
              value,
              label: copy.goals.states[value],
            }))}
            sorts={GOAL_SORTS.map((value) => ({ value, label: copy.views.goalSorts[value] }))}
            filter={filter}
            onChange={setFilter}
            onReset={resetFilter}
          />
          <p className="hint view-hint">
            {copy.goals.groupedHint} {copy.views.goalsDragHint}
          </p>
        </>
      )}

      {pulses.length > 0 && groups.length === 0 && <p className="empty">{copy.views.nothing}</p>}

      {shown.map(({ group, items }) => (
        <section
          key={group}
          className={`date-group date-group-${group} ${
            dragging && isTarget(group) ? "is-droppable" : ""
          } ${target === group ? "is-drop-target" : ""}`}
          aria-labelledby={`goals-${group}`}
          data-group={group}
          onDragOver={(event) => {
            if (dragging && isTarget(group)) {
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              setTarget(group);
            }
          }}
          onDrop={(event) => {
            event.preventDefault();
            const goalId = event.dataTransfer.getData(GOAL_DRAG_TYPE) || dragging;
            setDragging(null);
            setTarget(null);
            if (goalId && isTarget(group)) {
              void plan(goalId, group);
            }
          }}
        >
          <h2 id={`goals-${group}`} className="date-group-title">
            {copy.views.groups[group]} <span className="date-group-count">{items.length}</span>
          </h2>
          {items.length === 0 ? (
            <p className="drop-zone">{copy.views.dropHere}</p>
          ) : (
            <ul className="goal-grid">
              {items.map((pulse) => (
                <GoalCard
                  key={pulse.goal.id}
                  pulse={pulse}
                  dragging={dragging === pulse.goal.id}
                  onDragStart={() => setDragging(pulse.goal.id)}
                  onDragEnd={() => {
                    setDragging(null);
                    setTarget(null);
                  }}
                  onPlan={(to) => void plan(pulse.goal.id, to)}
                />
              ))}
            </ul>
          )}
        </section>
      ))}

      {firstStep && (
        <FirstStepDialog
          goal={firstStep.goal}
          plannedOn={firstStep.plannedOn}
          onClose={() => setFirstStep(null)}
          onAdded={() =>
            store.notify(
              copy.views.planned(firstStep.goal.title, copy.views.groups[firstStep.target]),
            )
          }
        />
      )}

      {inactive.length > 0 && (
        <>
          <label className="switch inline">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(event) => setShowInactive(event.target.checked)}
            />
            <span>
              {copy.goals.showInactive} ({inactive.length})
            </span>
          </label>
          {showInactive && (
            <ul className="goal-shelf">
              {inactive.map((goal) => (
                <InactiveGoal key={goal.id} goal={goal} />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

const GOAL_DRAG_TYPE = "application/x-ellma-goal";

/** Asks for a goal's first step when it is dropped on a day without one. */
function FirstStepDialog({
  goal,
  plannedOn,
  onClose,
  onAdded,
}: {
  goal: Goal;
  plannedOn: string | null;
  onClose: () => void;
  onAdded: () => void;
}) {
  const { copy } = usePreferences();
  const store = useStore();
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<Task | null>(null);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim() || busy) {
      return;
    }
    setBusy(true);
    void store
      .createTask({ title, goalId: goal.id, plannedOn })
      .then((task) => {
        if (task) {
          onAdded();
          setCreated(task);
        }
      })
      .finally(() => setBusy(false));
  };
  if (created) {
    return (
      <Dialog title={copy.views.firstStepTitle(goal.title)} onClose={onClose}>
        <TaskCreated task={created} onOk={onClose} />
      </Dialog>
    );
  }
  return (
    <Dialog title={copy.views.firstStepTitle(goal.title)} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <label>
          {copy.views.firstStepLabel}
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={140}
            required
            autoFocus
          />
        </label>
        <button className="button" disabled={busy || !title.trim()}>
          <Icon name="plus" size={16} /> {copy.views.firstStepAdd}
        </button>
      </form>
    </Dialog>
  );
}

/** "Plan next step" for keyboards and touch screens: the same as dropping on a day. */
function PlanMenu({ onPlan }: { onPlan: (to: PlanTarget) => void }) {
  const { copy } = usePreferences();
  const [open, setOpen] = useState(false);
  return (
    <div className="menu-anchor goal-card-menu">
      <button
        type="button"
        className="icon-button"
        aria-label={copy.views.planFor}
        title={copy.views.planFor}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Icon name="calendar" size={18} />
      </button>
      {open && (
        <div className="menu" role="menu" onMouseLeave={() => setOpen(false)}>
          <p className="menu-title">{copy.views.planFor}</p>
          {PLAN_TARGETS.map((to) => (
            <button
              key={to}
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onPlan(to);
              }}
            >
              {copy.views.groups[to]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function GoalCard({
  pulse,
  dragging,
  onDragStart,
  onDragEnd,
  onPlan,
}: {
  pulse: GoalPulse;
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onPlan: (to: PlanTarget) => void;
}) {
  const { copy } = usePreferences();
  const store = useStore();
  const ellma = useEllma();
  const { goal, nextTask } = pulse;
  const path = `/goals/${goal.id}`;
  const attention = goalAttention(pulse);
  return (
    <li
      className={`goal-card goal-${pulse.state} ${dragging ? "is-dragging" : ""}`}
      style={{ ["--goal" as string]: `var(--goal-${goal.color})` }}
      draggable
      data-goal={goal.id}
      onDragStart={(event) => {
        if ((event.target as HTMLElement).closest(".menu")) {
          event.preventDefault();
          return;
        }
        event.dataTransfer.setData(GOAL_DRAG_TYPE, goal.id);
        event.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
    >
      <PlanMenu onPlan={onPlan} />
      <a className="goal-card-main" href={path} onClick={linkHandler(path)} draggable={false}>
        <GoalApple
          color={goal.color}
          ratio={pulse.ratio}
          size={76}
          transitionName={`goal-${goal.id}`}
        />
        <span className="goal-card-text">
          <span className="goal-card-top">
            {attention ? (
              <span className="state state-behind">{copy.goals.attention[attention]}</span>
            ) : (
              <span className={`state state-${pulse.state}`}>{copy.goals.states[pulse.state]}</span>
            )}
          </span>
          <span className="goal-card-title">{goal.title}</span>
          <span className="goal-card-week">
            <strong>
              <CountedHours seconds={pulse.weekSeconds} />
            </strong>
            {pulse.targetSeconds > 0
              ? copy.goals.weekOf("", goalHours(pulse.targetSeconds))
              : copy.goals.weekFree("")}
          </span>
        </span>
      </a>
      {(goal.targetDate || goal.tags.length > 0) && (
        <p className="goal-card-facts">
          {goal.targetDate && pulse.daysLeft !== null && (
            <span className={`goal-deadline ${pulse.daysLeft < 0 ? "is-late" : ""}`}>
              <Icon name="flag" size={14} />
              {copy.goals.deadline(
                new Date(`${goal.targetDate}T12:00:00`).toLocaleDateString(copy.dateLocale, {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                }),
              )}
              <small>{copy.goals.daysLeft(pulse.daysLeft)}</small>
            </span>
          )}
          {goal.tags.map((tag) => (
            <span key={tag} className="tag">
              #{tag}
            </span>
          ))}
        </p>
      )}
      {goal.why && <p className="goal-card-why">{goal.why}</p>}
      {pulse.milestonesTotal > 0 && (
        <p
          className="goal-card-trail"
          title={copy.goals.milestoneCount(pulse.milestonesDone, pulse.milestonesTotal)}
        >
          {goal.milestones.map((milestone) => (
            <i key={milestone.id} className={milestone.doneAt ? "is-done" : ""} />
          ))}
          <span>{pulse.nextMilestone ?? copy.goals.journeyEnd}</span>
        </p>
      )}
      <div className="goal-card-step">
        <span className="goal-card-step-label">{copy.goals.nextStep}</span>
        {nextTask ? (
          <>
            <span className="goal-card-step-title">{nextTask.title}</span>
            <button
              type="button"
              className="button small"
              onClick={() =>
                void store.startFocus(nextTask.id).then((started) => started && navigate("/focus"))
              }
            >
              <Icon name="play" size={14} /> {copy.goals.start}
            </button>
          </>
        ) : (
          <>
            <span className="goal-card-step-title muted">{copy.goals.noStep}</span>
            <button
              type="button"
              className="button small ghost"
              onClick={() => ellma.setComposeFor(goal.id)}
            >
              <Icon name="plus" size={14} /> {copy.goals.addStep}
            </button>
          </>
        )}
      </div>
    </li>
  );
}

function InactiveGoal({ goal }: { goal: Goal }) {
  const { copy } = usePreferences();
  const path = `/goals/${goal.id}`;
  return (
    <li>
      <a href={path} onClick={linkHandler(path)}>
        <GoalApple color={goal.color} ratio={goal.status === "completed" ? 1 : 0} size={32} />
        <span>{goal.title}</span>
        <small>{copy.goals.statuses[goal.status]}</small>
      </a>
    </li>
  );
}
