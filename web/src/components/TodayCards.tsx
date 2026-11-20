import { useState, type DragEvent, type ReactNode } from "react";
import { goalHours, type GoalPulse, type Task } from "@ellma/shared";
import { usePreferences } from "../lib/preferences";
import { linkHandler } from "../lib/router";
import { useStore } from "../lib/store";
import { LOOSE_CARD, useCardGroups } from "../lib/viewFilter";
import { CountedHours } from "./Counted";
import { GoalApple } from "./GoalApple";
import { Icon } from "./Icon";
import { MultiFocusDialog } from "./MultiFocusDialog";
import { TaskComposer } from "./TaskComposer";
import { TaskList } from "./TaskItem";

const DRAG_TYPE = "application/x-ellma-card";

type CardStep = { overdue: Task[]; todays: Task[] };

/** A card's menu: multiple focus, merging with another card, and splitting merged ones. */
function CardMenu({
  others,
  canFocus,
  merged,
  onFocus,
  onMerge,
  onSplit,
}: {
  others: { key: string; title: string }[];
  canFocus: boolean;
  merged: boolean;
  onFocus: () => void;
  onMerge: (key: string) => void;
  onSplit: () => void;
}) {
  const { copy } = usePreferences();
  const [open, setOpen] = useState(false);
  const run = (action: () => void) => () => {
    setOpen(false);
    action();
  };
  if (!canFocus && others.length === 0 && !merged) {
    return null;
  }
  return (
    <div className="menu-anchor goal-day-menu">
      <button
        type="button"
        className="icon-button"
        aria-label={copy.views.cardActions}
        title={copy.views.cardActions}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Icon name="more" />
      </button>
      {open && (
        <div className="menu" role="menu" onMouseLeave={() => setOpen(false)}>
          {canFocus && (
            <button role="menuitem" onClick={run(onFocus)}>
              <Icon name="play" size={16} /> {merged ? copy.views.focusTogether : copy.focus.multi}
            </button>
          )}
          {others.map((other) => (
            <button key={other.key} role="menuitem" onClick={run(() => onMerge(other.key))}>
              <Icon name="plus" size={16} /> {copy.views.mergeWith(other.title)}
            </button>
          ))}
          {merged && (
            <button role="menuitem" onClick={run(onSplit)}>
              <Icon name="close" size={16} /> {copy.views.split}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Card view of Today: one card per goal (and one for steps without a goal). Dragging a card
 * onto another merges them, remembered on this device, and opens the multiple focus picker.
 */
export function TodayCards({
  pulses,
  stepsOf,
  loose,
  showLoose,
  today,
}: {
  pulses: GoalPulse[];
  stepsOf: (goalId: string) => CardStep;
  loose: CardStep;
  showLoose: boolean;
  today: string;
}) {
  const { copy } = usePreferences();
  const store = useStore();
  const [groups, merge, split] = useCardGroups(store.userId);
  const [picker, setPicker] = useState<string[] | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [target, setTarget] = useState<string | null>(null);

  const singles = [...pulses.map((pulse) => pulse.goal.id), ...(showLoose ? [LOOSE_CARD] : [])];
  // Merged groups take the place of their first visible member.
  const units: string[][] = [];
  const placed = new Set<string>();
  for (const key of singles) {
    if (placed.has(key)) {
      continue;
    }
    const group = groups.find((entry) => entry.includes(key));
    const members = group ? group.filter((member) => singles.includes(member)) : [key];
    members.forEach((member) => placed.add(member));
    units.push(members);
  }

  const pulseOf = (goalId: string | null) => pulses.find((pulse) => pulse.goal.id === goalId);
  const titleOf = (key: string) =>
    key === LOOSE_CARD ? copy.today.otherTitle : (pulseOf(key)?.goal.title ?? "");
  const activeGoals = new Set(
    store.goals.filter((goal) => goal.status === "active").map((goal) => goal.id),
  );
  const openSteps = (keys: string[]) =>
    store.tasks.filter(
      (task) =>
        !task.doneAt &&
        (task.goalId && activeGoals.has(task.goalId)
          ? keys.includes(task.goalId)
          : keys.includes(LOOSE_CARD)),
    ).length;
  const joinCards = (left: string, right: string) => setPicker(merge(left, right));

  const shell = (keys: string[], className: string, style: object, body: ReactNode) => {
    const lead = keys[0] ?? "";
    const isTarget = target !== null && keys.includes(target);
    const accepts = (event: DragEvent) =>
      dragging !== null && !keys.includes(dragging) && event.dataTransfer.types.includes(DRAG_TYPE);
    return (
      <section
        key={keys.join("+")}
        className={`card goal-day ${className} ${isTarget ? "is-drop-target" : ""} ${
          dragging && keys.includes(dragging) ? "is-dragging" : ""
        }`}
        style={style}
        draggable={units.length > 1}
        data-card={keys.join("+")}
        onDragStart={(event) => {
          if ((event.target as HTMLElement).closest("input, textarea, select, .menu")) {
            event.preventDefault();
            return;
          }
          event.dataTransfer.setData(DRAG_TYPE, lead);
          event.dataTransfer.effectAllowed = "move";
          setDragging(lead);
        }}
        onDragEnd={() => {
          setDragging(null);
          setTarget(null);
        }}
        onDragOver={(event) => {
          if (accepts(event)) {
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
            setTarget(lead);
          }
        }}
        onDrop={(event) => {
          const from = event.dataTransfer.getData(DRAG_TYPE);
          event.preventDefault();
          setDragging(null);
          setTarget(null);
          if (from && !keys.includes(from)) {
            joinCards(from, lead);
          }
        }}
      >
        {isTarget && <span className="drop-label">{copy.views.dropHere}</span>}
        {body}
      </section>
    );
  };

  const menuFor = (keys: string[]) => (
    <CardMenu
      others={units
        .filter((unit) => unit !== keys)
        .map((unit) => ({
          key: unit[0] ?? "",
          title: unit.map(titleOf).join(" + "),
        }))}
      canFocus={openSteps(keys) > 1}
      merged={keys.length > 1}
      onFocus={() => setPicker(keys)}
      onMerge={(other) => joinCards(keys[0] ?? "", other)}
      onSplit={() => split(keys[0] ?? "")}
    />
  );

  const renderUnit = (keys: string[]) => {
    const [only] = keys;
    if (keys.length === 1 && only === LOOSE_CARD) {
      return shell(
        keys,
        "subtle",
        {},
        <>
          <div className="goal-day-top">
            <div className="goal-day-head">
              <span className="loose-mark" aria-hidden="true" />
              <span>
                <h2>{copy.today.otherTitle}</h2>
                <small>{copy.today.otherHint}</small>
              </span>
            </div>
            {menuFor(keys)}
          </div>
          <TaskList tasks={loose.overdue} showDay />
          <TaskList tasks={loose.todays} />
          <TaskComposer plannedOn={today} />
        </>,
      );
    }
    const pulse = keys.length === 1 ? pulseOf(only ?? null) : undefined;
    if (pulse) {
      const { goal } = pulse;
      const path = `/goals/${goal.id}`;
      const steps = stepsOf(goal.id);
      const empty = steps.overdue.length + steps.todays.length === 0;
      return shell(
        keys,
        `goal-${pulse.state}`,
        { ["--goal" as string]: `var(--goal-${goal.color})` },
        <>
          <div className="goal-day-top">
            <a className="goal-day-head" href={path} onClick={linkHandler(path)} draggable={false}>
              <GoalApple
                color={goal.color}
                ratio={pulse.ratio}
                size={44}
                transitionName={`goal-${goal.id}`}
              />
              <span>
                <h2>{goal.title}</h2>
                <small>
                  <CountedHours seconds={pulse.weekSeconds} />
                  {pulse.targetSeconds > 0
                    ? copy.goals.weekOf("", goalHours(pulse.targetSeconds))
                    : copy.goals.weekFree("")}
                </small>
              </span>
              <span className={`state state-${pulse.state}`}>{copy.goals.states[pulse.state]}</span>
            </a>
            {menuFor(keys)}
          </div>
          <TaskList tasks={steps.overdue} showGoal={false} showDay />
          <TaskList tasks={steps.todays} showGoal={false} />
          {empty && (
            <div className="goal-day-empty">
              <p className="muted">{copy.today.noStepToday}</p>
              {pulse.backlog.slice(0, 2).map((task) => (
                <button
                  key={task.id}
                  type="button"
                  className="pull"
                  onClick={() => void store.patchTask(task.id, { plannedOn: today })}
                >
                  <Icon name="plus" size={16} />
                  <span>{task.title}</span>
                  <em>{copy.today.pull}</em>
                </button>
              ))}
            </div>
          )}
          <TaskComposer plannedOn={today} goalId={goal.id} placeholder={copy.today.addStep} />
        </>,
      );
    }
    // Merged: the goals side by side, their steps together, and one way to focus on them.
    const overdue = keys.flatMap((key) =>
      key === LOOSE_CARD ? loose.overdue : stepsOf(key).overdue,
    );
    const todays = keys.flatMap((key) => (key === LOOSE_CARD ? loose.todays : stepsOf(key).todays));
    return shell(
      keys,
      "goal-day-merged",
      {},
      <>
        <div className="goal-day-top">
          <div className="goal-day-head">
            <span className="merged-apples" aria-hidden="true">
              {keys.map((key) => {
                const entry = pulseOf(key);
                return entry ? (
                  <GoalApple key={key} color={entry.goal.color} ratio={entry.ratio} size={30} />
                ) : (
                  <span key={key} className="loose-mark small" />
                );
              })}
            </span>
            <span>
              <h2>{keys.map(titleOf).join(" + ")}</h2>
              <small>{copy.views.merged(keys.length)}</small>
            </span>
          </div>
          {menuFor(keys)}
        </div>
        <TaskList tasks={overdue} showDay pulseOf={pulseOf} />
        <TaskList tasks={todays} pulseOf={pulseOf} />
        {overdue.length + todays.length === 0 && <p className="muted">{copy.today.noStepToday}</p>}
        <div className="button-row goal-day-actions">
          {openSteps(keys) > 1 && (
            <button type="button" className="button small" onClick={() => setPicker(keys)}>
              <Icon name="play" size={14} /> {copy.views.focusTogether}
            </button>
          )}
          <button type="button" className="button ghost small" onClick={() => split(keys[0] ?? "")}>
            <Icon name="close" size={14} /> {copy.views.split}
          </button>
        </div>
      </>,
    );
  };

  return (
    <>
      {units.length > 1 && <p className="hint view-hint">{copy.views.todayDragHint}</p>}
      <div
        className={`day-grid ${dragging ? "is-dragging" : ""}`}
        onDragOver={(event) => {
          // Over the gap between cards nothing is targeted.
          if (event.target === event.currentTarget) {
            setTarget(null);
          }
        }}
      >
        {units.map(renderUnit)}
      </div>
      {picker && <MultiFocusDialog cards={picker} today={today} onClose={() => setPicker(null)} />}
    </>
  );
}
