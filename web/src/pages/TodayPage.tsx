import {
  allTags,
  EMPTY_TODAY_FILTER,
  goalHours,
  groupSteps,
  hasAnyTag,
  isFiltering,
  reviewWeek,
  startOfWeek,
  STEP_FILTER_STATUSES,
  STEP_SORTS,
  toDateKey,
  type DateGroup,
  type GoalPulse,
  type Task,
} from "@ellma/shared";
import { CountedDuration, CountedHours, CountedNumber } from "../components/Counted";
import { GoalApple } from "../components/GoalApple";
import { Icon } from "../components/Icon";
import { TaskComposer } from "../components/TaskComposer";
import { TaskList } from "../components/TaskItem";
import { useEllma } from "../lib/ellma";
import { usePreferences } from "../lib/preferences";
import { linkHandler } from "../lib/router";
import type { Session } from "../lib/session";
import { useNow, useStore } from "../lib/store";
import { useViewFilter, useViewLayout } from "../lib/viewFilter";
import { ViewControls } from "../components/ViewControls";

function greeting(copy: ReturnType<typeof usePreferences>["copy"], hour: number): string {
  if (hour < 12) {
    return copy.today.greetingMorning;
  }
  return hour < 18 ? copy.today.greetingAfternoon : copy.today.greetingEvening;
}

/**
 * Card view: one goal's share of today, with its overdue and today steps, and a nudge to
 * pull a waiting step in when the day is still empty.
 */
function GoalDay({
  pulse,
  overdue,
  todays,
  today,
}: {
  pulse: GoalPulse;
  overdue: Task[];
  todays: Task[];
  today: string;
}) {
  const { copy } = usePreferences();
  const store = useStore();
  const { goal } = pulse;
  const path = `/goals/${goal.id}`;
  const empty = overdue.length + todays.length === 0;
  return (
    <section
      className={`card goal-day goal-${pulse.state}`}
      style={{ ["--goal" as string]: `var(--goal-${goal.color})` }}
    >
      <a className="goal-day-head" href={path} onClick={linkHandler(path)}>
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
      <TaskList tasks={overdue} showGoal={false} showDay />
      <TaskList tasks={todays} showGoal={false} />
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
    </section>
  );
}

export function TodayPage({ session }: { session: Session }) {
  const { copy } = usePreferences();
  const store = useStore();
  const ellma = useEllma();
  const now = useNow(30_000);
  const { pulses, today } = ellma.guide;
  const weekStart = startOfWeek(today);
  const review = reviewWeek(
    weekStart,
    store.sessionsByWeek[weekStart] ?? [],
    store.goals,
    store.tasks,
    now,
  );
  const [filter, setFilter, resetFilter] = useViewFilter(
    "today",
    store.userId,
    EMPTY_TODAY_FILTER,
    STEP_FILTER_STATUSES,
    STEP_SORTS,
  );
  const [layout, setLayout] = useViewLayout("today", store.userId);
  const { open, done } = groupSteps(store.tasks, store.goals, today, filter, (task) =>
    task.doneAt ? toDateKey(new Date(task.doneAt)) : null,
  );
  const stepsOf = (group: DateGroup): Task[] =>
    open.find((entry) => entry.group === group)?.items ?? [];
  const pulseOf = (goalId: string | null) => pulses.find((pulse) => pulse.goal.id === goalId);
  const doneToday = store.tasks.filter(
    (task) => task.doneAt && toDateKey(new Date(task.doneAt)) === today,
  );
  const tags = allTags(store.goals.filter((goal) => goal.status === "active"));
  const overdue = stepsOf("overdue");
  const todays = stepsOf("today");
  const showOpen = filter.statuses.length === 0 || filter.statuses.includes("open");
  const anything = store.tasks.length > 0 || pulses.length > 0;
  const moveOverdue = () =>
    void Promise.all(overdue.map((task) => store.patchTask(task.id, { plannedOn: today })));
  // Card view: every goal the tag filter keeps, those with something for today first.
  const activeIds = new Set(pulses.map((pulse) => pulse.goal.id));
  const ofGoal = (steps: Task[], goalId: string) => steps.filter((task) => task.goalId === goalId);
  const cards = pulses
    .filter((pulse) => hasAnyTag(pulse.goal, filter.tags))
    .map((pulse) => ({
      pulse,
      overdue: ofGoal(overdue, pulse.goal.id),
      todays: ofGoal(todays, pulse.goal.id),
    }))
    .sort(
      (left, right) =>
        Number(right.overdue.length + right.todays.length > 0) -
          Number(left.overdue.length + left.todays.length > 0) ||
        (filter.sort === "goal"
          ? left.pulse.goal.title.localeCompare(right.pulse.goal.title, copy.dateLocale)
          : 0),
    );
  const isLoose = (task: Task) => !(task.goalId && activeIds.has(task.goalId));
  const looseOverdue = overdue.filter(isLoose);
  const looseToday = todays.filter(isLoose);
  const dateLabel = now.toLocaleDateString(copy.dateLocale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">{dateLabel}</p>
          <h1>
            {greeting(copy, now.getHours())}
            {session.name ? `, ${session.name}` : ""}.
          </h1>
          <p className="page-lead">{copy.today.lead}</p>
        </div>
        <div className="stats-inline">
          <div>
            <strong>
              <CountedDuration seconds={review.perDay[review.days.indexOf(today)] ?? 0} />
            </strong>
            <span>{copy.today.focusedToday}</span>
          </div>
          <div>
            <strong>
              <CountedNumber value={doneToday.length} />
            </strong>
            <span>{copy.today.tasksDone}</span>
          </div>
        </div>
      </header>

      {pulses.length === 0 && store.status === "ready" && (
        <div className="empty-hero">
          <GoalApple color="apple" ratio={0} size={96} />
          <h2>{copy.goals.emptyTitle}</h2>
          <p>{copy.today.goalsEmpty}</p>
          <button type="button" className="button large" onClick={ellma.startGoalGuide}>
            <Icon name="sparkle" size={18} /> {copy.guide.first_goal.action}
          </button>
        </div>
      )}

      {anything && (
        <ViewControls
          tags={tags}
          statuses={STEP_FILTER_STATUSES.map((value) => ({
            value,
            label: copy.views.stepStatuses[value],
          }))}
          sorts={STEP_SORTS.map((value) => ({ value, label: copy.views.stepSorts[value] }))}
          filter={filter}
          onChange={setFilter}
          onReset={resetFilter}
          layout={layout}
          onLayout={setLayout}
        />
      )}

      {layout === "cards" && showOpen && (
        <>
          {overdue.length > 0 && (
            <p className="day-overdue-note">
              <span>{copy.views.overdueNote(overdue.length)}</span>
              <button type="button" className="button ghost small" onClick={moveOverdue}>
                <Icon name="calendar" size={14} /> {copy.views.moveOverdue}
              </button>
            </p>
          )}
          <div className="day-grid">
            {cards.map((card) => (
              <GoalDay key={card.pulse.goal.id} today={today} {...card} />
            ))}
            {anything && filter.tags.length === 0 && (
              <section className="card subtle goal-day">
                <div className="goal-day-head">
                  <span className="loose-mark" aria-hidden="true" />
                  <span>
                    <h2>{copy.today.otherTitle}</h2>
                    <small>{copy.today.otherHint}</small>
                  </span>
                </div>
                <TaskList tasks={looseOverdue} showDay />
                <TaskList tasks={looseToday} />
                <TaskComposer plannedOn={today} />
              </section>
            )}
          </div>
          {cards.length === 0 && filter.tags.length > 0 && (
            <p className="empty">{copy.views.nothing}</p>
          )}
        </>
      )}

      <div className="day-sections">
        {layout === "list" && overdue.length > 0 && (
          <section className="card day-section day-section-overdue" aria-labelledby="day-overdue">
            <header className="day-section-head">
              <h2 id="day-overdue">
                {copy.views.groups.overdue}{" "}
                <span className="date-group-count">{overdue.length}</span>
              </h2>
              <button type="button" className="button ghost small" onClick={moveOverdue}>
                <Icon name="calendar" size={14} /> {copy.views.moveOverdue}
              </button>
            </header>
            <TaskList tasks={overdue} showDay focusLabel pulseOf={pulseOf} />
          </section>
        )}

        {layout === "list" && showOpen && (
          <section className="card day-section day-section-today" aria-labelledby="day-today">
            <header className="day-section-head">
              <h2 id="day-today">
                {copy.views.groups.today} <span className="date-group-count">{todays.length}</span>
              </h2>
            </header>
            <TaskList
              tasks={todays}
              focusLabel
              pulseOf={pulseOf}
              empty={isFiltering(filter) ? copy.views.nothing : copy.today.empty}
            />
            <TaskComposer plannedOn={today} placeholder={copy.today.addStep} />
          </section>
        )}

        {(["tomorrow", "later", "none"] as const).map((group) => {
          const steps = stepsOf(group);
          if (steps.length === 0) {
            return null;
          }
          return (
            <details key={group} className="card subtle day-section day-section-folded">
              <summary>
                <h2>
                  {copy.views.groups[group]}{" "}
                  <span className="date-group-count">{steps.length}</span>
                </h2>
                <Icon name="chevronDown" size={18} />
              </summary>
              <TaskList tasks={steps} showDay={group === "later"} focusLabel pulseOf={pulseOf} />
            </details>
          );
        })}
      </div>

      {done.length > 0 && (
        <section className="card subtle done-today">
          <h2>{copy.today.done}</h2>
          <TaskList tasks={done} pulseOf={pulseOf} />
        </section>
      )}
    </div>
  );
}
