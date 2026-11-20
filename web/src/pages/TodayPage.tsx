import {
  allTags,
  EMPTY_TODAY_FILTER,
  groupSteps,
  hasAnyTag,
  isFiltering,
  reviewWeek,
  startOfWeek,
  STEP_FILTER_STATUSES,
  STEP_SORTS,
  toDateKey,
  type DateGroup,
  type Task,
} from "@ellma/shared";
import { CountedDuration, CountedNumber } from "../components/Counted";
import { GoalApple } from "../components/GoalApple";
import { Icon } from "../components/Icon";
import { TaskComposer } from "../components/TaskComposer";
import { TaskList } from "../components/TaskItem";
import { TodayCards } from "../components/TodayCards";
import { useEllma } from "../lib/ellma";
import { usePreferences } from "../lib/preferences";
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
  const cardSteps = (goalId: string) => ({
    overdue: ofGoal(overdue, goalId),
    todays: ofGoal(todays, goalId),
  });
  const hasToday = (goalId: string) => {
    const steps = cardSteps(goalId);
    return steps.overdue.length + steps.todays.length > 0;
  };
  const cardPulses = pulses
    .filter((pulse) => hasAnyTag(pulse.goal, filter.tags))
    .sort(
      (left, right) =>
        Number(hasToday(right.goal.id)) - Number(hasToday(left.goal.id)) ||
        (filter.sort === "goal"
          ? left.goal.title.localeCompare(right.goal.title, copy.dateLocale)
          : 0),
    );
  const isLoose = (task: Task) => !(task.goalId && activeIds.has(task.goalId));
  const loose = { overdue: overdue.filter(isLoose), todays: todays.filter(isLoose) };
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
          <TodayCards
            pulses={cardPulses}
            stepsOf={cardSteps}
            loose={loose}
            showLoose={anything && filter.tags.length === 0}
            today={today}
          />
          {cardPulses.length === 0 && filter.tags.length > 0 && (
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
