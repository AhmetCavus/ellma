import { useEffect, useState } from "react";
import {
  addDays,
  formatDuration,
  goalHours,
  isoWeekNumber,
  reviewWeek,
  sessionSeconds,
  startOfWeek,
  todayKey,
  UNASSIGNED,
} from "@ellma/shared";
import { CountedDuration, CountedNumber } from "../components/Counted";
import { confirmAction } from "../components/Dialog";
import { GoalDot } from "../components/GoalDot";
import { Icon } from "../components/Icon";
import { LogTimeDialog } from "../components/LogTimeDialog";
import { useEllma } from "../lib/ellma";
import { usePreferences } from "../lib/preferences";
import { useNow, useStore } from "../lib/store";

export function ProgressPage() {
  const { copy } = usePreferences();
  const store = useStore();
  const ellma = useEllma();
  const now = useNow(60_000);
  const currentWeek = startOfWeek(todayKey(now));
  const [weekStart, setWeekStart] = useState(currentWeek);
  const [logging, setLogging] = useState(false);
  const { loadWeek } = store;

  useEffect(() => {
    void loadWeek(weekStart);
  }, [loadWeek, weekStart]);

  const sessions = store.sessionsByWeek[weekStart] ?? [];
  const review = reviewWeek(weekStart, sessions, store.goals, store.tasks, now);
  const maxDay = Math.max(3600, ...review.perDay);
  const goalById = new Map(store.goals.map((goal) => [goal.id, goal]));
  const goalName = (id: string) => goalById.get(id)?.title ?? copy.common.noGoal;
  const goalColor = (id: string) =>
    id === UNASSIGNED ? "slate" : (goalById.get(id)?.color ?? "slate");

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">{copy.progress.weekNumber(isoWeekNumber(weekStart))}</p>
          <h1>{copy.progress.title}</h1>
          <p className="page-lead">{copy.progress.lead}</p>
        </div>
        <div className="button-row">
          <button
            type="button"
            className="icon-button"
            onClick={() => setWeekStart(addDays(weekStart, -7))}
            aria-label={copy.progress.previous}
          >
            <Icon name="chevronLeft" />
          </button>
          <button
            type="button"
            className="button ghost small"
            disabled={weekStart === currentWeek}
            onClick={() => setWeekStart(currentWeek)}
          >
            {copy.progress.thisWeek}
          </button>
          <button
            type="button"
            className="icon-button"
            disabled={weekStart >= currentWeek}
            onClick={() => setWeekStart(addDays(weekStart, 7))}
            aria-label={copy.progress.next}
          >
            <Icon name="chevronRight" />
          </button>
        </div>
      </header>

      <div className="stat-tiles">
        <div className="stat-tile">
          <span>{copy.progress.total}</span>
          <strong>
            <CountedDuration seconds={review.totalSeconds} />
          </strong>
        </div>
        <div className="stat-tile">
          <span>{copy.progress.completedTasks}</span>
          <strong>
            <CountedNumber value={review.completedTasks} />
          </strong>
        </div>
        <div className="stat-tile">
          <span>{copy.progress.bestDay}</span>
          <strong>
            {review.bestDay ? copy.weekdaysShort[review.days.indexOf(review.bestDay)] : "–"}
          </strong>
        </div>
      </div>

      <div className="columns">
        <section className="card column-main">
          <h2>{copy.progress.perDay}</h2>
          <div className="day-chart" role="img" aria-label={copy.progress.perDay}>
            {review.days.map((day, index) => (
              <div
                key={day}
                className="day-column"
                title={`${copy.weekdaysShort[index]}: ${formatDuration(review.perDay[index] ?? 0)}`}
              >
                <div className="day-bar">
                  {review.goals.map((entry) => {
                    const seconds = entry.perDay[index] ?? 0;
                    return seconds > 0 ? (
                      <span
                        key={entry.goalId}
                        style={{
                          height: `${(seconds / maxDay) * 100}%`,
                          background: `var(--goal-${goalColor(entry.goalId)})`,
                        }}
                      />
                    ) : null;
                  })}
                </div>
                <span className="day-value">
                  {(review.perDay[index] ?? 0) > 0 ? goalHours(review.perDay[index] ?? 0) : ""}
                </span>
                <span className={`day-label ${day === todayKey(now) ? "is-today" : ""}`}>
                  {copy.weekdaysShort[index]}
                </span>
              </div>
            ))}
          </div>
          {review.totalSeconds === 0 && <p className="empty">{copy.progress.empty}</p>}
        </section>

        <section className="card column-side">
          <h2>{copy.progress.perGoal}</h2>
          <ul className="goal-progress-list">
            {review.goals.map((entry) => {
              const percent =
                entry.targetSeconds > 0
                  ? Math.round((entry.seconds / entry.targetSeconds) * 100)
                  : null;
              return (
                <li key={entry.goalId}>
                  <div className="goal-progress-static">
                    <span className="goal-progress-title">
                      <GoalDot color={goalColor(entry.goalId)} />
                      {goalName(entry.goalId)}
                    </span>
                    <span className="goal-progress-hours">{formatDuration(entry.seconds)}</span>
                    <span className="meter" aria-hidden="true">
                      <span
                        style={{
                          width: `${percent === null ? (entry.seconds > 0 ? 100 : 0) : Math.min(100, percent)}%`,
                          background: `var(--goal-${goalColor(entry.goalId)})`,
                        }}
                      />
                    </span>
                    <small className="muted">
                      {percent === null ? copy.progress.noTarget : copy.progress.ofTarget(percent)}
                    </small>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="button-column">
            <button type="button" className="button ghost" onClick={() => setLogging(true)}>
              <Icon name="clock" size={18} /> {copy.focus.logTime}
            </button>
            <button
              type="button"
              className="button"
              onClick={() => void ellma.send(copy.progress.reflectPrompt)}
            >
              <Icon name="sparkle" size={18} /> {copy.progress.reflect}
            </button>
          </div>
        </section>
      </div>

      {sessions.length > 0 && (
        <section className="card">
          <h2>{copy.progress.sessions}</h2>
          <ul className="session-list">
            {[...sessions].reverse().map((entry) => {
              const task = store.tasks.find((candidate) => candidate.id === entry.taskId);
              const started = new Date(entry.startedAt);
              return (
                <li key={entry.id}>
                  <GoalDot color={goalColor(entry.goalId ?? UNASSIGNED)} />
                  <span className="session-what">
                    {task?.title ?? goalName(entry.goalId ?? UNASSIGNED)}
                    <small className="muted">
                      {started.toLocaleDateString(copy.dateLocale, {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      ·{" "}
                      {started.toLocaleTimeString(copy.dateLocale, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </small>
                  </span>
                  <strong>{formatDuration(sessionSeconds(entry, now))}</strong>
                  <button
                    type="button"
                    className="icon-button"
                    disabled={!entry.endedAt}
                    aria-label={copy.progress.deleteSession}
                    onClick={() => {
                      if (confirmAction(copy.progress.deleteSessionConfirm)) {
                        void store.deleteSession(entry.id);
                      }
                    }}
                  >
                    <Icon name="trash" size={16} />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
      {logging && <LogTimeDialog onClose={() => setLogging(false)} />}
    </div>
  );
}
