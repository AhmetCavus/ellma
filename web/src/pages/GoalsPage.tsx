import { useState } from "react";
import {
  allTags,
  EMPTY_GOALS_FILTER,
  GOAL_FILTER_STATUSES,
  GOAL_SORTS,
  goalAttention,
  goalHours,
  groupGoals,
  type Goal,
  type GoalPulse,
} from "@ellma/shared";
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
          <p className="hint view-hint">{copy.goals.groupedHint}</p>
        </>
      )}

      {pulses.length > 0 && groups.length === 0 && <p className="empty">{copy.views.nothing}</p>}

      {groups.map(({ group, items }) => (
        <section
          key={group}
          className={`date-group date-group-${group}`}
          aria-labelledby={`goals-${group}`}
        >
          <h2 id={`goals-${group}`} className="date-group-title">
            {copy.views.groups[group]} <span className="date-group-count">{items.length}</span>
          </h2>
          <ul className="goal-grid">
            {items.map((pulse) => (
              <GoalCard key={pulse.goal.id} pulse={pulse} />
            ))}
          </ul>
        </section>
      ))}

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

function GoalCard({ pulse }: { pulse: GoalPulse }) {
  const { copy } = usePreferences();
  const store = useStore();
  const ellma = useEllma();
  const { goal, nextTask } = pulse;
  const path = `/goals/${goal.id}`;
  const attention = goalAttention(pulse);
  return (
    <li
      className={`goal-card goal-${pulse.state}`}
      style={{ ["--goal" as string]: `var(--goal-${goal.color})` }}
    >
      <a className="goal-card-main" href={path} onClick={linkHandler(path)}>
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
