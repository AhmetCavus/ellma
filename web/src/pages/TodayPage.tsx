import { goalHours, reviewWeek, startOfWeek, toDateKey, type GoalPulse } from "@ellma/shared";
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

function greeting(copy: ReturnType<typeof usePreferences>["copy"], hour: number): string {
  if (hour < 12) {
    return copy.today.greetingMorning;
  }
  return hour < 18 ? copy.today.greetingAfternoon : copy.today.greetingEvening;
}

/** One goal's share of today: its steps, and a nudge to pick one when the day is empty. */
function GoalDay({ pulse, today }: { pulse: GoalPulse; today: string }) {
  const { copy } = usePreferences();
  const store = useStore();
  const { goal } = pulse;
  const path = `/goals/${goal.id}`;
  const empty = pulse.todayTasks.length + pulse.overdueTasks.length === 0;
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
      <TaskList tasks={pulse.overdueTasks} showGoal={false} showDay />
      <TaskList tasks={pulse.todayTasks} showGoal={false} />
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
  const activeIds = new Set(pulses.map((pulse) => pulse.goal.id));
  // Steps of no goal (or of a goal that is no longer active) still need a home.
  const loose = store.tasks.filter(
    (task) => !task.doneAt && !(task.goalId && activeIds.has(task.goalId)),
  );
  const looseOverdue = loose.filter((task) => task.plannedOn && task.plannedOn < today);
  const looseToday = loose
    .filter((task) => task.plannedOn === today)
    .sort((a, b) => a.position - b.position);
  const looseLater = loose.filter((task) => !task.plannedOn);
  const doneToday = store.tasks.filter(
    (task) => task.doneAt && toDateKey(new Date(task.doneAt)) === today,
  );
  const dateLabel = now.toLocaleDateString(copy.dateLocale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  // Goals with something to do today come first.
  const ordered = [...pulses].sort(
    (left, right) =>
      Number(right.todayTasks.length + right.overdueTasks.length > 0) -
      Number(left.todayTasks.length + left.overdueTasks.length > 0),
  );

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

      <div className="day-grid">
        {ordered.map((pulse) => (
          <GoalDay key={pulse.goal.id} pulse={pulse} today={today} />
        ))}

        {(loose.length > 0 || pulses.length > 0) && (
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
            {looseLater.length > 0 && (
              <>
                <p className="eyebrow">{copy.today.waiting}</p>
                <TaskList tasks={looseLater} />
              </>
            )}
            <TaskComposer plannedOn={today} />
          </section>
        )}
      </div>

      {doneToday.length > 0 && (
        <section className="card subtle done-today">
          <h2>{copy.today.done}</h2>
          <TaskList tasks={doneToday} />
        </section>
      )}
    </div>
  );
}
