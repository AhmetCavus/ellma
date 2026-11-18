import { useEffect, useRef, useState } from "react";
import { addDays, GOAL_COLORS, todayKey, type Goal, type Task } from "@ellma/shared";
import { celebrate } from "../lib/motion";
import { usePreferences } from "../lib/preferences";
import { navigate } from "../lib/router";
import { readStored, SEED_GOAL_KEY, writeStored } from "../lib/storage";
import { useStore } from "../lib/store";
import { playChime, useVoiceInput } from "../lib/voice";
import { EllmaOrb } from "./EllmaOrb";
import { GoalApple } from "./GoalApple";
import { Icon } from "./Icon";

const STEPS = ["what", "why", "hours", "deadline", "step"] as const;
type StepName = (typeof STEPS)[number];
const HOUR_CHOICES = [1, 2, 3, 5, 8];

/**
 * Ellma leads the user to a new goal one question at a time: what, why, weekly hours,
 * a date, and the first small step. Every answer can be typed or dictated.
 */
export function GoalGuide({ onClose }: { onClose: () => void }) {
  const { copy } = usePreferences();
  const store = useStore();
  const dialog = useRef<HTMLDialogElement>(null);
  const field = useRef<HTMLElement | null>(null);
  const bindField = (element: HTMLElement | null) => {
    field.current = element;
  };
  const [index, setIndex] = useState(0);
  // A goal typed on the landing page before signing up arrives here as the first answer.
  const [title, setTitle] = useState(() => (readStored(SEED_GOAL_KEY) ?? "").slice(0, 140));
  useEffect(() => writeStored(SEED_GOAL_KEY, null), []);
  const [why, setWhy] = useState("");
  const [hours, setHours] = useState(3);
  const [targetDate, setTargetDate] = useState("");
  const [firstStep, setFirstStep] = useState("");
  const [busy, setBusy] = useState(false);
  const [planted, setPlanted] = useState<{ goal: Goal; task: Task | null } | null>(null);
  const [ripeness, setRipeness] = useState(0);
  const step: StepName = STEPS[index] ?? "what";
  const today = todayKey();
  const color = GOAL_COLORS[store.goals.length % GOAL_COLORS.length] ?? "apple";

  const setters: Partial<Record<StepName, (update: (value: string) => string) => void>> = {
    what: setTitle,
    why: setWhy,
    step: setFirstStep,
  };
  const voice = useVoiceInput(copy.speechLocale, (transcript) =>
    setters[step]?.((value) => `${value} ${transcript}`.trim()),
  );

  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open) {
      element.showModal();
    }
    return () => element?.close();
  }, []);

  useEffect(() => {
    voice.stop();
    field.current?.focus();
    // Only a new question moves the focus; the voice hook itself changes every render.
  }, [index]);

  useEffect(() => {
    if (!planted) {
      return;
    }
    playChime();
    const timer = window.setTimeout(() => {
      setRipeness(0.22);
      celebrate(document.querySelector(".wizard-planted .goal-apple"), "large");
    }, 350);
    return () => window.clearTimeout(timer);
  }, [planted]);

  const plant = async () => {
    setBusy(true);
    const goal = await store.createGoal({
      title,
      why,
      color,
      status: "active",
      weeklyTargetMinutes: Math.round(hours * 60),
      targetDate: targetDate || null,
      milestones: [],
    });
    const task =
      goal && firstStep.trim()
        ? await store.createTask({ title: firstStep, goalId: goal.id, plannedOn: today })
        : null;
    setBusy(false);
    if (goal) {
      setPlanted({ goal, task });
    }
  };

  const canContinue = step !== "what" || title.trim().length > 0;
  const next = () => {
    if (!canContinue || busy) {
      return;
    }
    if (index < STEPS.length - 1) {
      setIndex(index + 1);
    } else {
      void plant();
    }
  };

  const onEnter = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      next();
    }
  };

  const dictation = voice.supported && (
    <button
      type="button"
      className={`mic ${voice.listening ? "mic-live" : ""}`}
      onClick={() => (voice.listening ? voice.stop() : voice.start())}
      aria-pressed={voice.listening}
      aria-label={copy.wizard.dictate}
      title={copy.wizard.dictate}
    >
      <Icon name="mic" size={22} />
    </button>
  );

  const deadlines: [string, string][] = [
    [copy.wizard.deadline.none, ""],
    [copy.wizard.deadline.month1, addDays(today, 30)],
    [copy.wizard.deadline.month3, addDays(today, 91)],
    [copy.wizard.deadline.month6, addDays(today, 182)],
    [copy.wizard.deadline.year1, addDays(today, 365)],
  ];

  const question = step === "why" ? copy.wizard.why.ask(title.trim()) : copy.wizard[step].ask;

  return (
    <dialog
      ref={dialog}
      className="wizard"
      aria-label={copy.wizard.title}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <header className="wizard-top">
        <span className="wizard-brand">
          <EllmaOrb phase={voice.listening ? "listening" : busy ? "thinking" : "idle"} size={34} />
          <span>{copy.wizard.title}</span>
        </span>
        {!planted && (
          <span
            className="wizard-progress"
            aria-label={copy.wizard.progress(index + 1, STEPS.length)}
          >
            {STEPS.map((name, position) => (
              <i key={name} className={position <= index ? "is-done" : ""} />
            ))}
          </span>
        )}
        <button
          type="button"
          className="icon-button"
          onClick={onClose}
          aria-label={copy.common.close}
        >
          <Icon name="close" />
        </button>
      </header>

      {planted ? (
        <div className="wizard-stage wizard-planted">
          <GoalApple color={planted.goal.color} ratio={ripeness} size={150} />
          <h1>{copy.wizard.doneTitle(planted.goal.title)}</h1>
          <p className="wizard-help">
            {planted.task ? copy.wizard.doneStep(planted.task.title) : copy.wizard.doneText}
          </p>
          <div className="button-row center">
            {planted.task && (
              <button
                type="button"
                className="button large"
                autoFocus
                onClick={() => {
                  const taskId = planted.task?.id ?? null;
                  onClose();
                  void store.startFocus(taskId).then((started) => started && navigate("/focus"));
                }}
              >
                <Icon name="play" size={18} /> {copy.wizard.startNow}
              </button>
            )}
            <button
              type="button"
              className={`button large ${planted.task ? "ghost" : ""}`}
              autoFocus={!planted.task}
              onClick={() => {
                onClose();
                navigate(`/goals/${planted.goal.id}`);
              }}
            >
              {copy.wizard.openGoal}
            </button>
          </div>
        </div>
      ) : (
        <form
          className="wizard-stage"
          key={step}
          onSubmit={(event) => {
            event.preventDefault();
            next();
          }}
        >
          <p className="eyebrow">{copy.wizard.progress(index + 1, STEPS.length)}</p>
          <h1>{question}</h1>
          <p className="wizard-help">{copy.wizard[step].help}</p>

          {step === "what" && (
            <>
              <div className="wizard-field">
                <input
                  ref={bindField}
                  value={voice.listening && voice.interim ? `${title} ${voice.interim}` : title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder={
                    voice.listening ? copy.wizard.dictating : copy.wizard.what.placeholder
                  }
                  aria-label={question}
                  maxLength={140}
                />
                {dictation}
              </div>
              <div className="wizard-chips">
                {copy.wizard.what.examples.map((example) => (
                  <button
                    key={example}
                    type="button"
                    className="chip"
                    onClick={() => {
                      setTitle(example);
                      field.current?.focus();
                    }}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </>
          )}

          {(step === "why" || step === "step") && (
            <div className="wizard-field">
              {step === "why" ? (
                <textarea
                  ref={bindField}
                  rows={3}
                  value={voice.listening && voice.interim ? `${why} ${voice.interim}` : why}
                  onChange={(event) => setWhy(event.target.value)}
                  onKeyDown={onEnter}
                  placeholder={
                    voice.listening ? copy.wizard.dictating : copy.wizard.why.placeholder
                  }
                  aria-label={question}
                  maxLength={4000}
                />
              ) : (
                <input
                  ref={bindField}
                  value={
                    voice.listening && voice.interim ? `${firstStep} ${voice.interim}` : firstStep
                  }
                  onChange={(event) => setFirstStep(event.target.value)}
                  placeholder={
                    voice.listening ? copy.wizard.dictating : copy.wizard.step.placeholder
                  }
                  aria-label={question}
                  maxLength={140}
                />
              )}
              {dictation}
            </div>
          )}

          {step === "hours" && (
            <div className="wizard-hours">
              <GoalApple color={color} ratio={Math.min(1, hours / 8)} size={96} />
              <div>
                <div className="wizard-stepper">
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => setHours(Math.max(0, hours - 0.5))}
                    aria-label="−"
                  >
                    −
                  </button>
                  <strong>{hours}</strong>
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => setHours(Math.min(60, hours + 0.5))}
                    aria-label="+"
                  >
                    +
                  </button>
                  <span>{hours === 0 ? copy.wizard.hours.none : copy.wizard.hours.unit}</span>
                </div>
                <div className="wizard-chips">
                  {HOUR_CHOICES.map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      className={`chip ${hours === choice ? "is-on" : ""}`}
                      onClick={() => setHours(choice)}
                    >
                      {choice} h
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === "deadline" && (
            <>
              <div className="wizard-chips">
                {deadlines.map(([label, value]) => (
                  <button
                    key={label}
                    type="button"
                    className={`chip ${targetDate === value ? "is-on" : ""}`}
                    onClick={() => setTargetDate(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <label className="wizard-date">
                {copy.wizard.deadline.pick}
                <input
                  type="date"
                  min={today}
                  value={targetDate}
                  onChange={(event) => setTargetDate(event.target.value)}
                />
              </label>
            </>
          )}

          <footer className="wizard-actions">
            {index > 0 && (
              <button type="button" className="button ghost" onClick={() => setIndex(index - 1)}>
                <Icon name="chevronLeft" size={16} /> {copy.wizard.back}
              </button>
            )}
            <button className="button large" disabled={!canContinue || busy}>
              {index === STEPS.length - 1
                ? busy
                  ? copy.wizard.creating
                  : copy.wizard.create
                : copy.wizard.next}
              {index < STEPS.length - 1 && <Icon name="chevronRight" size={18} />}
            </button>
            <span className="hint">{copy.wizard.enterHint}</span>
          </footer>
        </form>
      )}
    </dialog>
  );
}
