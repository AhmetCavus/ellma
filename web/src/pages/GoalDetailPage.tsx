import { useState } from "react";
import { goalHours } from "@ellma/shared";
import { CountedHours, CountedNumber } from "../components/Counted";
import { confirmAction } from "../components/Dialog";
import { GoalApple } from "../components/GoalApple";
import { GoalDialog } from "../components/GoalDialog";
import { Icon } from "../components/Icon";
import { LogTimeDialog } from "../components/LogTimeDialog";
import { TaskComposer } from "../components/TaskComposer";
import { TaskList } from "../components/TaskItem";
import { useEllma } from "../lib/ellma";
import { celebrate } from "../lib/motion";
import { usePreferences } from "../lib/preferences";
import { linkHandler, navigate } from "../lib/router";
import { useStore } from "../lib/store";
import { playChime } from "../lib/voice";

export function GoalDetailPage({ goalId }: { goalId: string }) {
  const { copy } = usePreferences();
  const store = useStore();
  const ellma = useEllma();
  const [editing, setEditing] = useState(false);
  const [logging, setLogging] = useState(false);
  const [milestone, setMilestone] = useState("");
  const goal = store.goals.find((entry) => entry.id === goalId);
  if (!goal) {
    return (
      <div className="page">
        <a className="back-link" href="/goals" onClick={linkHandler("/goals")}>
          <Icon name="chevronLeft" size={16} /> {copy.goals.back}
        </a>
        <p className="empty">
          {store.status === "loading" ? copy.common.loading : copy.common.error}
        </p>
      </div>
    );
  }
  const { today } = ellma.guide;
  const pulse = ellma.guide.pulses.find((entry) => entry.goal.id === goal.id);
  const weekSeconds = pulse?.weekSeconds ?? 0;
  const target = goal.weeklyTargetMinutes * 60;
  const ratio = pulse?.ratio ?? (goal.status === "completed" ? 1 : 0);
  const openTasks = store.tasks
    .filter((task) => task.goalId === goal.id && !task.doneAt)
    .sort(
      (a, b) =>
        (a.plannedOn ?? "9999").localeCompare(b.plannedOn ?? "9999") || a.position - b.position,
    );
  const doneTasks = store.tasks.filter((task) => task.goalId === goal.id && task.doneAt).slice(-5);
  const milestonesDone = goal.milestones.filter((entry) => entry.doneAt).length;
  const reached = goal.status === "completed";

  const saveMilestones = (milestones: typeof goal.milestones) =>
    store.updateGoal(goal.id, { ...goal, milestones });

  return (
    <div className="page" style={{ ["--goal" as string]: `var(--goal-${goal.color})` }}>
      <a className="back-link" href="/goals" onClick={linkHandler("/goals")}>
        <Icon name="chevronLeft" size={16} /> {copy.goals.back}
      </a>
      <header className="goal-hero">
        <GoalApple
          color={goal.color}
          ratio={ratio}
          size={116}
          transitionName={`goal-${goal.id}`}
          label={
            target > 0
              ? copy.goals.weekOf(goalHours(weekSeconds), goalHours(target))
              : copy.goals.weekFree(goalHours(weekSeconds))
          }
        />
        <div className="goal-hero-text">
          <p className="eyebrow">
            {pulse ? (
              <span className={`state state-${pulse.state}`}>{copy.goals.states[pulse.state]}</span>
            ) : (
              copy.goals.statuses[goal.status]
            )}
            {pulse && pulse.daysLeft !== null ? ` · ${copy.goals.daysLeft(pulse.daysLeft)}` : ""}
          </p>
          <h1>{goal.title}</h1>
          {goal.why && <p className="goal-why">“{goal.why}”</p>}
          <div className="button-row">
            <button
              type="button"
              className="button"
              onClick={() => void ellma.send(copy.dock.askAbout(goal.title))}
            >
              <Icon name="sparkle" size={18} /> {copy.guide.next_step.alt}
            </button>
            <button type="button" className="button ghost" onClick={() => setLogging(true)}>
              <Icon name="clock" size={18} /> {copy.focus.logTime}
            </button>
            <button
              type="button"
              className="icon-button"
              onClick={() => setEditing(true)}
              aria-label={copy.common.edit}
              title={copy.common.edit}
            >
              <Icon name="edit" />
            </button>
            <button
              type="button"
              className="icon-button danger"
              aria-label={copy.common.delete}
              title={copy.common.delete}
              onClick={() => {
                if (confirmAction(copy.goals.deleteConfirm)) {
                  void store.deleteGoal(goal.id).then((removed) => removed && navigate("/goals"));
                }
              }}
            >
              <Icon name="trash" />
            </button>
          </div>
        </div>
      </header>

      <div className="stat-tiles">
        <div className="stat-tile">
          <span>{copy.goals.thisWeek}</span>
          <strong>
            <CountedHours seconds={weekSeconds} />
            <small> {target > 0 ? `/ ${goalHours(target)} h` : "h"}</small>
          </strong>
          <span className="meter" aria-hidden="true">
            <span style={{ width: `${ratio * 100}%` }} />
          </span>
        </div>
        <div className="stat-tile">
          <span>{copy.goals.totalHours}</span>
          <strong>
            <CountedHours seconds={store.totals[goal.id] ?? 0} />
            <small> h</small>
          </strong>
        </div>
        <div className="stat-tile">
          <span>{copy.goals.milestones}</span>
          <strong>
            <CountedNumber value={milestonesDone} />
            <small> / {goal.milestones.length}</small>
          </strong>
        </div>
      </div>

      <div className="columns">
        <section className="card column-main">
          <h2>{copy.goals.openTasks}</h2>
          <TaskList tasks={openTasks} empty={copy.goals.noTasks} showGoal={false} showDay />
          <TaskComposer plannedOn={today} goalId={goal.id} placeholder={copy.today.addStep} />
          {doneTasks.length > 0 && (
            <div className="subtle-list">
              <TaskList tasks={doneTasks} showGoal={false} />
            </div>
          )}
        </section>

        <section className="card column-side">
          <h2>{copy.goals.journey}</h2>
          {goal.milestones.length === 0 && <p className="empty">{copy.goals.milestonesEmpty}</p>}
          <ol className="journey">
            <li className="journey-done journey-edge">
              <span className="journey-node" />
              <span className="journey-title">{copy.goals.journeyStart}</span>
            </li>
            {goal.milestones.map((entry) => (
              <li key={entry.id} className={entry.doneAt ? "journey-done" : ""}>
                <button
                  type="button"
                  className="journey-node"
                  aria-pressed={Boolean(entry.doneAt)}
                  aria-label={entry.doneAt ? copy.tasks.markOpen : copy.tasks.markDone}
                  onClick={(event) => {
                    if (!entry.doneAt) {
                      playChime();
                      celebrate(event.currentTarget, "large");
                    }
                    void saveMilestones(
                      goal.milestones.map((item) =>
                        item.id === entry.id
                          ? { ...item, doneAt: item.doneAt ? null : new Date().toISOString() }
                          : item,
                      ),
                    );
                  }}
                >
                  <Icon name="check" size={13} />
                </button>
                <span className="journey-title">{entry.title}</span>
                <button
                  type="button"
                  className="icon-button"
                  aria-label={copy.common.delete}
                  onClick={() =>
                    void saveMilestones(goal.milestones.filter((item) => item.id !== entry.id))
                  }
                >
                  <Icon name="close" size={16} />
                </button>
              </li>
            ))}
            <li className={`journey-edge ${reached ? "journey-done" : ""}`}>
              <span className="journey-node journey-flag">
                <Icon name="flag" size={13} />
              </span>
              <span className="journey-title">{reached ? copy.goals.journeyEnd : goal.title}</span>
              {!reached && goal.status === "active" && (
                <button
                  type="button"
                  className="link-button"
                  onClick={(event) => {
                    playChime();
                    celebrate(event.currentTarget, "large");
                    celebrate(document.querySelector(".goal-hero .goal-apple"), "large");
                    void store
                      .updateGoal(goal.id, { ...goal, status: "completed" })
                      .then((saved) => saved && store.notify(copy.goals.reachedCheer(goal.title)));
                  }}
                >
                  {copy.goals.reached}
                </button>
              )}
            </li>
          </ol>
          <form
            className="composer"
            onSubmit={(event) => {
              event.preventDefault();
              if (!milestone.trim()) {
                return;
              }
              void saveMilestones([
                ...goal.milestones,
                { id: crypto.randomUUID().slice(0, 12), title: milestone.trim(), doneAt: null },
              ]).then((saved) => saved && setMilestone(""));
            }}
          >
            <Icon name="flag" size={18} />
            <input
              value={milestone}
              onChange={(event) => setMilestone(event.target.value)}
              placeholder={copy.goals.milestonePlaceholder}
              aria-label={copy.goals.addMilestone}
              maxLength={140}
            />
            <button className="button small" disabled={!milestone.trim()}>
              {copy.tasks.add}
            </button>
          </form>
        </section>
      </div>
      {editing && <GoalDialog goal={goal} onClose={() => setEditing(false)} />}
      {logging && <LogTimeDialog goalId={goal.id} onClose={() => setLogging(false)} />}
    </div>
  );
}
