import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import {
  formatClock,
  reviewWeek,
  sessionSeconds,
  startOfWeek,
  todayKey,
  type GoalColor,
} from "@ellma/shared";
import { AppleMark } from "../components/AppleMark";
import { GoalApple } from "../components/GoalApple";
import { GoalTag } from "../components/GoalDot";
import { Icon } from "../components/Icon";
import { usePreferences } from "../lib/preferences";
import { navigate } from "../lib/router";
import { updateSettings, useSettings } from "../lib/settings";
import { onTrackChange, playingTrack } from "../lib/sound";
import { isPlainShortcut } from "../lib/shortcuts";
import { useNow, useStore, type FocusResult } from "../lib/store";

type Outcome = FocusResult & { color: GoalColor | null };

/** "2:10" for hours and minutes of the week. */
function hoursAndMinutes(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}`;
}

/** The apple at the top of focus mode, with a soft halo that breathes with the session. */
function FocusEmblem({ children }: { children: ReactNode }) {
  return (
    <div className="focus-emblem">
      <span className="focus-halo" aria-hidden="true" />
      {children}
    </div>
  );
}

/**
 * What a finished session shows: the apple fills from where the week stood to where it
 * stands now, using the time the server saved, and one sentence says the same in words.
 */
function FocusDone({ outcome, onAgain }: { outcome: Outcome; onAgain: () => void }) {
  const { copy } = usePreferences();
  const before =
    outcome.targetSeconds > 0
      ? Math.max(0, outcome.weekSeconds - outcome.seconds) / outcome.targetSeconds
      : 0;
  const after = outcome.targetSeconds > 0 ? outcome.weekSeconds / outcome.targetSeconds : 1;
  const [fill, setFill] = useState(before);
  const back = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    back.current?.focus();
    // Two frames: the apple first paints at the old level, then eases to the new one.
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => setFill(after));
    });
    return () => cancelAnimationFrame(frame);
  }, [after]);

  const parts = [copy.focus.saved(copy.focus.savedDuration(outcome.seconds))];
  if (outcome.steps > 1) {
    parts.push(copy.focus.savedSplit(outcome.steps));
  } else if (outcome.goalId) {
    parts.push(
      outcome.targetSeconds > 0
        ? copy.focus.savedWeek(
            hoursAndMinutes(outcome.weekSeconds),
            (outcome.targetSeconds / 3600).toLocaleString(copy.dateLocale, {
              maximumFractionDigits: 1,
            }),
          )
        : copy.focus.savedWeekFree(hoursAndMinutes(outcome.weekSeconds)),
    );
  }
  const completed = outcome.steps > 1 ? copy.focus.savedTasks : copy.focus.savedTask;
  const sentence = `${parts.join(" · ")}.${outcome.completed ? ` ${completed}` : ""}`;

  return (
    <div className="focus-center focus-done">
      <FocusEmblem>
        {outcome.color ? (
          <GoalApple color={outcome.color} ratio={fill} size={96} className="focus-apple-filled" />
        ) : (
          <AppleMark size={64} className="focus-apple-filled" />
        )}
      </FocusEmblem>
      <p className="focus-done-text" role="status">
        {sentence}
      </p>
      <div className="button-row center">
        <button
          ref={back}
          type="button"
          className="button large"
          onClick={() => navigate("/today")}
        >
          {copy.focus.backToToday}
        </button>
        <button type="button" className="button ghost large" onClick={onAgain}>
          <Icon name="play" size={18} /> {copy.focus.again}
        </button>
      </div>
    </div>
  );
}

export function FocusPage() {
  const { copy } = usePreferences();
  const store = useStore();
  const now = useNow(1000, Boolean(store.active));
  const [choice, setChoice] = useState("");
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState<"" | "save" | "pause" | "resume">("");
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const { ambience } = useSettings();
  const track = useSyncExternalStore(onTrackChange, playingTrack);
  const active = store.active;
  const paused = active ? null : store.paused;
  // The focus on screen: running, or paused with its time already saved.
  const run = active ?? paused;
  // A multiple focus shares its time between two or more steps.
  const multiIds = run?.taskIds ?? [];
  const multi = multiIds.length > 1;
  const multiTasks = multiIds.flatMap((id) => store.tasks.filter((entry) => entry.id === id));
  const task = multi ? undefined : store.tasks.find((entry) => entry.id === run?.taskId);
  const goal = multi
    ? undefined
    : store.goals.find((entry) => entry.id === (run?.goalId ?? task?.goalId));
  const heading = multi
    ? copy.focus.multiTitle(multiIds.length)
    : (task?.title ?? goal?.title ?? copy.focus.freeFocus);
  const elapsed = active
    ? store.carriedSeconds + sessionSeconds(active, now)
    : (paused?.seconds ?? 0);
  const today = todayKey(now);
  const weekStart = startOfWeek(today);
  // The week as it stood before this session, so the apple only grows by saved time.
  const earlier = (store.sessionsByWeek[weekStart] ?? []).filter(
    (entry) => entry.id !== active?.id,
  );
  const goalWeek = goal
    ? (reviewWeek(weekStart, earlier, store.goals, store.tasks, now).goals.find(
        (entry) => entry.goalId === goal.id,
      )?.seconds ?? 0)
    : 0;
  const goalTarget = (goal?.weeklyTargetMinutes ?? 0) * 60;
  const candidates = store.tasks
    .filter((entry) => !entry.doneAt)
    .sort(
      (a, b) =>
        Number(b.plannedOn === today) - Number(a.plannedOn === today) ||
        (a.plannedOn ?? "9999").localeCompare(b.plannedOn ?? "9999"),
    );

  /** Success is shown only once the server has saved the session. */
  const stop = async (complete: boolean) => {
    if (saving) {
      return;
    }
    setSaving(true);
    setFailed("");
    const color = goal?.color ?? null;
    const result = await store.stopFocus(complete);
    setSaving(false);
    if (!result) {
      setFailed("save");
      return;
    }
    setOutcome({ ...result, color: result.goalId ? color : null });
  };

  /** Pausing saves the time so far; resuming starts a new session on the same step. */
  const togglePause = async () => {
    if (saving || !run) {
      return;
    }
    setSaving(true);
    setFailed("");
    const ok = active ? await store.pauseFocus() : await store.resumeFocus();
    setSaving(false);
    if (!ok) {
      setFailed(active ? "pause" : "resume");
    }
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Enter" && (event.metaKey || event.ctrlKey) && run) {
        event.preventDefault();
        void stop(Boolean(run.taskId));
      } else if (event.key.toLowerCase() === "s" && isPlainShortcut(event) && run) {
        event.preventDefault();
        void stop(false);
      } else if (event.key.toLowerCase() === "p" && isPlainShortcut(event) && run) {
        event.preventDefault();
        void togglePause();
      } else if (event.key.toLowerCase() === "m" && isPlainShortcut(event) && store.active) {
        event.preventDefault();
        updateSettings({ ambience: !ambience });
      } else if (event.key === "Escape" && !document.querySelector("dialog[open]")) {
        navigate("/today");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => {
    const previous = document.title;
    if (run) {
      document.title = `${active ? "" : `${copy.focus.paused} · `}${formatClock(elapsed)} · ${heading}`;
    }
    return () => {
      document.title = previous;
    };
  }, [active, copy, elapsed, heading, run]);

  const tint = run ? goal?.color : outcome?.color;
  return (
    <div
      className={`focus-screen ${paused ? "is-paused" : ""}`}
      style={{ ["--focus-tint" as string]: tint ? `var(--goal-${tint})` : "var(--apple)" }}
    >
      <div className="focus-ambient" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <button
        type="button"
        className="icon-button focus-exit"
        onClick={() => navigate("/today")}
        aria-label={copy.focus.exit}
        title={copy.focus.exit}
      >
        <Icon name="close" />
      </button>
      {active && (
        <button
          type="button"
          className={`icon-button focus-sound ${ambience ? "is-on" : ""}`}
          onClick={() => updateSettings({ ambience: !ambience })}
          aria-pressed={ambience}
          aria-label={ambience ? copy.focus.muteSound : copy.focus.unmuteSound}
          title={`${ambience ? copy.focus.muteSound : copy.focus.unmuteSound} (M)`}
        >
          <Icon name={ambience ? "speaker" : "speakerOff"} />
        </button>
      )}
      {outcome && !run ? (
        <FocusDone
          outcome={outcome}
          onAgain={() => {
            setOutcome(null);
            setChoice("");
          }}
        />
      ) : run ? (
        <div className={`focus-center ${paused ? "is-paused" : ""}`}>
          <FocusEmblem>
            {goal ? (
              <GoalApple
                color={goal.color}
                ratio={goalTarget > 0 ? goalWeek / goalTarget : 0}
                size={72}
                className="focus-apple"
                label={
                  goalTarget > 0
                    ? copy.goals.weekOf(
                        hoursAndMinutes(goalWeek),
                        (goalTarget / 3600).toLocaleString(copy.dateLocale, {
                          maximumFractionDigits: 1,
                        }),
                      )
                    : undefined
                }
              />
            ) : (
              <AppleMark size={56} className="focus-apple" />
            )}
          </FocusEmblem>
          <p className="eyebrow" role="status">
            {paused ? copy.focus.paused : multi ? copy.focus.multi : copy.focus.running}
          </p>
          <h1 className="focus-task">{heading}</h1>
          {goal && <GoalTag goal={goal} />}
          {multi && (
            <ul className="focus-steps">
              {multiTasks.map((entry) => (
                <li key={entry.id} className={entry.doneAt ? "is-done" : ""}>
                  <button
                    type="button"
                    className="task-check"
                    aria-pressed={Boolean(entry.doneAt)}
                    aria-label={entry.doneAt ? copy.tasks.markOpen : copy.tasks.markDone}
                    onClick={() => void store.patchTask(entry.id, { done: !entry.doneAt })}
                  >
                    <Icon name="check" size={14} />
                  </button>
                  <span className="focus-step-title">{entry.title}</span>
                  <GoalTag goal={store.goals.find((item) => item.id === entry.goalId)} />
                </li>
              ))}
            </ul>
          )}
          <div className="focus-clock" aria-live="off">
            {formatClock(elapsed)}
          </div>
          {paused && <p className="muted focus-paused-note">{copy.focus.pausedNote}</p>}
          {failed && (
            <p className="alert error" role="alert">
              {failed === "pause"
                ? copy.focus.pauseFailed
                : failed === "resume"
                  ? copy.focus.resumeFailed
                  : copy.focus.saveFailed}
            </p>
          )}
          <div className="focus-actions">
            <div className="focus-action">
              <button
                type="button"
                className={`button large ${paused ? "" : "ghost"}`}
                disabled={saving}
                aria-describedby={paused ? undefined : "focus-pause-help"}
                title="P"
                onClick={() => void togglePause()}
              >
                <Icon name={paused ? "play" : "pause"} size={18} />{" "}
                {paused ? copy.focus.resume : copy.focus.pause}
              </button>
              {!paused && <small id="focus-pause-help">{copy.focus.pauseHelp}</small>}
            </div>
            <div className="focus-action">
              <button
                type="button"
                className="button ghost large"
                disabled={saving}
                aria-describedby="focus-stop-help"
                title="S"
                onClick={() => void stop(false)}
              >
                <Icon name="stop" size={18} /> {saving ? copy.focus.saving : copy.focus.stop}
              </button>
              <small id="focus-stop-help">
                {multi ? copy.focus.stopHelpMulti : copy.focus.stopHelp}
              </small>
            </div>
            {run.taskId && (
              <div className="focus-action">
                <button
                  type="button"
                  className={`button large ${paused ? "ghost" : ""}`}
                  disabled={saving}
                  aria-describedby="focus-complete-help"
                  title={copy.focus.completeHint}
                  onClick={() => void stop(true)}
                >
                  <Icon name="check" size={18} />{" "}
                  {saving
                    ? copy.focus.saving
                    : multi
                      ? copy.focus.completeAll
                      : copy.focus.complete}
                </button>
                <small id="focus-complete-help">
                  {multi ? copy.focus.completeAllHelp : copy.focus.completeHelp}{" "}
                  <kbd>{copy.focus.completeHint}</kbd>
                </small>
              </div>
            )}
          </div>
          {active && ambience && track && (
            <p className="focus-scene">
              <Icon name="speaker" size={14} /> {copy.focus.scenes[track]}
            </p>
          )}
        </div>
      ) : (
        <form
          className="focus-center"
          onSubmit={(event) => {
            event.preventDefault();
            void store.startFocus(choice || null);
          }}
        >
          <FocusEmblem>
            <AppleMark size={56} className="focus-apple" />
          </FocusEmblem>
          <h1>{copy.focus.pickTask}</h1>
          <select
            value={choice}
            onChange={(event) => setChoice(event.target.value)}
            className="focus-select"
            aria-label={copy.focus.pickTask}
          >
            <option value="">{copy.focus.freeFocus}</option>
            {candidates.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.title}
              </option>
            ))}
          </select>
          <button className="button large">
            <Icon name="play" size={18} /> {copy.focus.start}
          </button>
        </form>
      )}
    </div>
  );
}
