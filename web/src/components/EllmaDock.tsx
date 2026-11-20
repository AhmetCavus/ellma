import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  formatClock,
  formatDuration,
  sessionSeconds,
  type AssistantAction,
  type GuideStep,
} from "@ellma/shared";
import { useEllma } from "../lib/ellma";
import { celebrate } from "../lib/motion";
import { usePreferences } from "../lib/preferences";
import { navigate } from "../lib/router";
import { SHORTCUTS_EVENT } from "../lib/shortcuts";
import { readStored, writeStored } from "../lib/storage";
import { useNow, useStore } from "../lib/store";
import { playChime } from "../lib/sound";
import { AppleMark } from "./AppleMark";
import { confirmAction } from "./Dialog";
import { EllmaOrb } from "./EllmaOrb";
import { Icon, type IconName } from "./Icon";

const ACTION_ICONS: Record<AssistantAction["kind"], IconName> = {
  goal_created: "target",
  task_added: "calendar",
  task_completed: "check",
  time_logged: "clock",
  focus_started: "play",
  milestone_added: "flag",
  milestone_done: "sparkle",
};

function ActionChips({ actions }: { actions: AssistantAction[] }) {
  const { copy } = usePreferences();
  if (actions.length === 0) {
    return null;
  }
  return (
    <ul className="actions">
      {actions.map((action, index) => (
        <li key={`${action.kind}-${index}`} className="action-chip">
          <Icon name={ACTION_ICONS[action.kind]} size={14} />
          <span>{copy.dock.actions[action.kind]}</span>
          {action.label && <strong>{action.label}</strong>}
        </li>
      ))}
    </ul>
  );
}

const YES_NO =
  /^(shall|should|do|does|did|is|are|was|would|will|can|could|may|have|has|ready|want|soll|sollen|sollte|möchtest|willst|ist|sind|war|kann|kannst|darf|hast|hat|bereit|passt|magst)\b/i;

/** Only offers Yes / No when Ellma's last sentence can really be answered that way. */
function isYesNoQuestion(reply: string): boolean {
  const last =
    reply
      .trim()
      .split(/(?<=[.!?…])\s+/)
      .pop() ?? "";
  return YES_NO.test(last);
}

type Nudge = {
  text: string;
  primary?: { label: string; icon?: IconName; run: () => void };
  alt?: { label: string; run: () => void };
  extra?: ReactNode;
};

/** Turns the guide's decision into Ellma's sentence and the buttons that carry it out. */
function useNudge(step: GuideStep, name: string): Nudge {
  const { copy } = usePreferences();
  const store = useStore();
  const ellma = useEllma();
  const now = useNow(1000, step.kind === "focus_running");
  const { today } = ellma.guide;
  const goalTitle = (goalId: string | null) =>
    store.goals.find((goal) => goal.id === goalId)?.title ?? "";
  const taskOf = (taskId: string | null) => store.tasks.find((task) => task.id === taskId);
  const focusOn = (taskId: string | null, goalId: string | null = null) =>
    void store.startFocus(taskId, goalId).then((started) => started && navigate("/focus"));

  switch (step.kind) {
    case "focus_running": {
      const what = taskOf(step.taskId)?.title ?? (goalTitle(step.goalId) || copy.focus.freeFocus);
      return {
        text: copy.guide.focus_running.text(what),
        extra: store.active && (
          <span className="dock-clock">
            {formatClock(store.carriedSeconds + sessionSeconds(store.active, now))}
          </span>
        ),
        primary: {
          label: copy.guide.focus_running.action,
          icon: "play",
          run: () => navigate("/focus"),
        },
        alt: {
          label: copy.guide.focus_running.alt,
          run: () =>
            void store
              .stopFocus(false)
              .then(
                (result) =>
                  result && store.notify(copy.focus.sessionSaved(formatDuration(result.seconds))),
              ),
        },
      };
    }
    case "first_goal":
      return {
        text: copy.guide.first_goal.text(name),
        primary: {
          label: copy.guide.first_goal.action,
          icon: "sparkle",
          run: ellma.startGoalGuide,
        },
      };
    case "carry_over":
      return {
        text: copy.guide.carry_over.text(step.taskIds.length),
        primary: {
          label: copy.guide.carry_over.action,
          icon: "calendar",
          run: () =>
            step.taskIds.forEach((taskId) => void store.patchTask(taskId, { plannedOn: today })),
        },
        alt: {
          label: copy.guide.carry_over.alt,
          run: () => void ellma.send(copy.guide.planDayPrompt),
        },
      };
    case "start_task": {
      const task = taskOf(step.taskId);
      return {
        text: copy.guide.start_task.text(task?.title ?? "", goalTitle(step.goalId)),
        primary: {
          label: copy.guide.start_task.action,
          icon: "play",
          run: () => focusOn(step.taskId),
        },
        alt: {
          label: copy.guide.start_task.alt,
          run: () => {
            playChime();
            celebrate(document.querySelector(".orb"));
            void store.patchTask(step.taskId, { done: true });
          },
        },
      };
    }
    case "next_step":
      return {
        text: copy.guide.next_step.text(goalTitle(step.goalId)),
        primary: {
          label: copy.guide.next_step.action,
          icon: "plus",
          run: () => ellma.setComposeFor(step.goalId),
        },
        alt: {
          label: copy.guide.next_step.alt,
          run: () => void ellma.send(copy.dock.askAbout(goalTitle(step.goalId))),
        },
      };
    case "plan_today":
      return {
        text: copy.guide.plan_today.text(taskOf(step.taskId)?.title ?? "", goalTitle(step.goalId)),
        primary: {
          label: copy.guide.plan_today.action,
          icon: "calendar",
          run: () => void store.patchTask(step.taskId, { plannedOn: today }),
        },
        alt: {
          label: copy.guide.plan_today.alt,
          run: () => void ellma.send(copy.guide.planDayPrompt),
        },
      };
    case "weekly_gap":
      return {
        text: copy.guide.weekly_gap.text(
          goalTitle(step.goalId),
          formatDuration(step.remainingSeconds),
        ),
        primary: {
          label: copy.guide.weekly_gap.action,
          icon: "play",
          run: () => focusOn(null, step.goalId),
        },
      };
    case "day_done": {
      const spare = step.spareTaskId;
      return {
        text: copy.guide.day_done.text(step.doneToday),
        primary: spare
          ? {
              label: copy.guide.day_done.action,
              icon: "plus",
              run: () => void store.patchTask(spare, { plannedOn: today }),
            }
          : undefined,
        alt: {
          label: copy.guide.day_done.alt,
          run: () => void ellma.send(copy.guide.planTomorrowPrompt),
        },
      };
    }
  }
}

function History({ onClose }: { onClose: () => void }) {
  const { copy } = usePreferences();
  const ellma = useEllma();
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [ellma.messages]);
  return (
    <section className="dock-history" aria-label={copy.dock.history}>
      <header>
        <h2>{copy.dock.history}</h2>
        {ellma.voiceSupported && (
          <label className="switch" title={copy.dock.handsFreeHint}>
            <input
              type="checkbox"
              checked={ellma.handsFree}
              onChange={(event) => ellma.setHandsFree(event.target.checked)}
            />
            <span>{copy.dock.handsFree}</span>
          </label>
        )}
        {ellma.speakerSupported && (
          <button
            type="button"
            className={`icon-button ${ellma.speakReplies ? "is-on" : ""}`}
            onClick={ellma.toggleSpeak}
            aria-pressed={ellma.speakReplies}
            aria-label={ellma.speakReplies ? copy.dock.speakOff : copy.dock.speakOn}
            title={`${ellma.speakReplies ? copy.dock.speakOff : copy.dock.speakOn} (V)`}
          >
            <Icon name={ellma.speakReplies ? "speaker" : "speakerOff"} />
          </button>
        )}
        <button
          type="button"
          className="icon-button"
          disabled={ellma.messages.length === 0}
          aria-label={copy.dock.clear}
          title={copy.dock.clear}
          onClick={() => {
            if (confirmAction(copy.dock.clearConfirm)) {
              void ellma.clearHistory();
            }
          }}
        >
          <Icon name="trash" size={18} />
        </button>
        <button
          type="button"
          className="icon-button"
          onClick={onClose}
          aria-label={copy.common.close}
        >
          <Icon name="close" />
        </button>
      </header>
      <div className="dock-history-list" ref={scroller}>
        {ellma.messages.length === 0 && <p className="empty">{copy.dock.historyEmpty}</p>}
        {ellma.messages.map((message) => (
          <div key={message.id} className={`bubble-row bubble-${message.role}`}>
            <div className="bubble-stack">
              <ActionChips actions={message.actions} />
              {message.content && <div className="bubble">{message.content}</div>}
            </div>
          </div>
        ))}
      </div>
      <p className="hint">{copy.dock.modelNote}</p>
    </section>
  );
}

/**
 * Ellma's place on every page: her face, what she suggests next, and the way to talk to her.
 * `solo` is the quiet variant for focus mode, where only the apple stays until she is needed.
 */
export function EllmaDock({ name = "", solo = false }: { name?: string; solo?: boolean }) {
  const { copy } = usePreferences();
  const store = useStore();
  const ellma = useEllma();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [tucked, setTucked] = useState(() => readStored("ellma-dock") === "tucked");
  const [text, setText] = useState("");
  const [slow, setSlow] = useState(false);
  const nudge = useNudge(ellma.guide.step, name);
  const { phase, exchange, intro } = ellma;
  const listening = phase === "listening";
  const busy = phase === "thinking" || phase === "answering";
  const composeGoal = store.goals.find((goal) => goal.id === ellma.composeFor);

  useEffect(() => {
    setSlow(false);
    if (phase !== "thinking") {
      return;
    }
    const timer = window.setTimeout(() => setSlow(true), 9000);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => setText(""), [ellma.writing, ellma.composeFor]);

  const engaged =
    listening ||
    Boolean(exchange) ||
    ellma.writing ||
    Boolean(composeGoal) ||
    Boolean(ellma.cheer) ||
    Boolean(ellma.problem) ||
    historyOpen;
  const introStep = !solo && intro !== null ? copy.intro.steps[intro] : undefined;
  const compact = (solo || tucked) && !engaged && !introStep;

  const setTuckedStored = (next: boolean) => {
    writeStored("ellma-dock", next ? "tucked" : null);
    setTucked(next);
  };

  const orbLabel = listening
    ? copy.dock.stopListening
    : busy || phase === "speaking"
      ? copy.dock.stop
      : copy.dock.talk;
  const onOrb = () => {
    if (compact && !solo) {
      setTuckedStored(false);
    } else if (busy || phase === "speaking") {
      ellma.stop();
    } else {
      ellma.talk();
    }
  };

  const submit = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    const value = text.trim();
    if (!value) {
      return;
    }
    if (composeGoal) {
      void store
        .createTask({ title: value, goalId: composeGoal.id, plannedOn: ellma.guide.today })
        .then((task) => task && ellma.setComposeFor(null));
    } else {
      void ellma.send(value);
    }
    setText("");
  };

  const asksSomething = Boolean(exchange && !exchange.pending && /\?\s*$/.test(exchange.reply));
  const suggestions = copy.dock.suggestions[ellma.view.page];

  let line: ReactNode;
  if (listening) {
    line = (
      <div className="dock-line" key="listening">
        <p className="dock-heard">{ellma.interim || copy.dock.listening}</p>
        <p className="hint">{copy.dock.listeningHint}</p>
      </div>
    );
  } else if (exchange) {
    line = (
      <div className="dock-line" key="exchange">
        <p className="dock-you">
          <span>{copy.dock.you}</span> {exchange.question}
        </p>
        <ActionChips actions={exchange.actions} />
        <p className="dock-reply" aria-live="polite">
          {exchange.reply ||
            (exchange.pending && (slow ? copy.dock.thinkingSlow : copy.dock.thinking))}
          {exchange.pending && <span className="typing" />}
        </p>
      </div>
    );
  } else if (ellma.cheer) {
    line = (
      <div className="dock-line dock-cheer" key={ellma.cheer}>
        <p className="dock-reply" role="status">
          {ellma.cheer}
        </p>
      </div>
    );
  } else if (introStep) {
    line = (
      <div className="dock-line" key={`intro-${intro}`}>
        <p className="dock-title">{introStep.title}</p>
        <p className="dock-reply">{introStep.text}</p>
      </div>
    );
  } else {
    line = (
      <div className="dock-line" key={ellma.guide.step.kind + nudge.text}>
        <p className="dock-reply">
          {nudge.text} {nudge.extra}
        </p>
      </div>
    );
  }

  let controls: ReactNode = null;
  if (ellma.writing || composeGoal) {
    controls = (
      <form className="dock-form" onSubmit={submit}>
        <input
          autoFocus
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={
            composeGoal ? copy.dock.stepPlaceholder(composeGoal.title) : copy.dock.writePlaceholder
          }
          aria-label={composeGoal ? copy.goals.addStep : copy.dock.write}
          maxLength={composeGoal ? 140 : 2000}
        />
        <button className="button small" disabled={!text.trim()}>
          {composeGoal ? copy.dock.stepAdd : copy.dock.send}
        </button>
      </form>
    );
  } else if (listening || busy) {
    controls = null;
  } else if (exchange) {
    controls = asksSomething ? (
      <div className="dock-buttons">
        {isYesNoQuestion(exchange.reply) && (
          <>
            <button
              type="button"
              className="button small"
              onClick={() => void ellma.send(copy.dock.yes)}
            >
              {copy.dock.yes}
            </button>
            <button
              type="button"
              className="button small ghost"
              onClick={() => void ellma.send(copy.dock.no)}
            >
              {copy.dock.no}
            </button>
          </>
        )}
        {ellma.voiceSupported && (
          <button type="button" className="button small ghost" onClick={ellma.talk}>
            <Icon name="mic" size={16} /> {copy.dock.answer}
          </button>
        )}
        <button type="button" className="button small ghost" onClick={() => ellma.setWriting(true)}>
          <Icon name="edit" size={16} /> {copy.dock.write}
        </button>
      </div>
    ) : null;
  } else if (introStep) {
    const last = intro === copy.intro.steps.length - 1;
    controls = (
      <div className="dock-buttons">
        <button type="button" className="button small" onClick={ellma.advanceIntro}>
          {last ? copy.intro.start : copy.intro.next}
          <Icon name="chevronRight" size={16} />
        </button>
        <span className="dock-dots" aria-hidden="true">
          {copy.intro.steps.map((step, index) => (
            <i key={step.title} className={index === intro ? "is-current" : ""} />
          ))}
        </span>
        {!last && (
          <button type="button" className="link-button" onClick={ellma.skipIntro}>
            {copy.intro.skip}
          </button>
        )}
      </div>
    );
  } else if (!ellma.cheer && (nudge.primary || nudge.alt)) {
    controls = (
      <div className="dock-buttons">
        {nudge.primary && (
          <button type="button" className="button small" onClick={nudge.primary.run}>
            {nudge.primary.icon && <Icon name={nudge.primary.icon} size={16} />}
            {nudge.primary.label}
          </button>
        )}
        {nudge.alt && (
          <button type="button" className="button small ghost" onClick={nudge.alt.run}>
            {nudge.alt.label}
          </button>
        )}
      </div>
    );
  }

  return (
    <aside
      className={`dock dock-${phase} ${solo ? "dock-solo" : ""} ${compact ? "dock-compact" : ""}`}
      aria-label={copy.dock.label}
    >
      {historyOpen && <History onClose={() => setHistoryOpen(false)} />}
      <div className="dock-bar">
        <button
          type="button"
          className="orb"
          onClick={onOrb}
          aria-label={compact && !solo ? copy.dock.expand : orbLabel}
          title={compact && !solo ? copy.dock.expand : `${orbLabel} (⌘/Ctrl J)`}
          aria-pressed={listening}
        >
          <EllmaOrb phase={phase} size={compact ? 34 : 40} success={ellma.success} />
          {compact && !solo && <span className="orb-badge" />}
        </button>
        {compact ? (
          solo && (
            <p className="dock-solo-hint">
              <kbd>{copy.dock.spaceKey}</kbd> {copy.dock.hintTalk}
            </p>
          )
        ) : (
          <>
            <div className="dock-body">
              {ellma.problem && (
                <p className="hint error" role="alert">
                  {ellma.problem}
                </p>
              )}
              {line}
              {controls}
            </div>
            <div className="dock-tools">
              {exchange && !exchange.pending && (
                <button
                  type="button"
                  className="icon-button"
                  onClick={ellma.dismiss}
                  aria-label={copy.dock.dismiss}
                  title={`${copy.dock.dismiss} (Esc)`}
                >
                  <Icon name="close" size={18} />
                </button>
              )}
              <button
                type="button"
                className={`icon-button ${ellma.writing ? "is-on" : ""}`}
                onClick={() => ellma.setWriting(!ellma.writing)}
                aria-label={copy.dock.write}
                title={`${copy.dock.write} (/)`}
                aria-pressed={ellma.writing}
              >
                <Icon name="keyboard" size={18} />
              </button>
              <button
                type="button"
                className={`icon-button ${historyOpen ? "is-on" : ""}`}
                onClick={() => setHistoryOpen((open) => !open)}
                aria-label={copy.dock.history}
                title={copy.dock.history}
                aria-expanded={historyOpen}
              >
                <Icon name="chat" size={18} />
              </button>
              {!solo && !introStep && (
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => {
                    setHistoryOpen(false);
                    ellma.dismiss();
                    setTuckedStored(true);
                  }}
                  aria-label={copy.dock.minimize}
                  title={copy.dock.minimize}
                >
                  <Icon name="chevronDown" size={18} />
                </button>
              )}
            </div>
          </>
        )}
      </div>
      {!compact && !listening && !busy && !introStep && (
        <div className="dock-hints">
          <span className="dock-keys">
            <kbd>{copy.dock.spaceKey}</kbd> {copy.dock.hintTalk}
            <kbd>/</kbd> {copy.dock.hintWrite}
            <button
              type="button"
              className="dock-key-button"
              onClick={() => window.dispatchEvent(new Event(SHORTCUTS_EVENT))}
            >
              <kbd>?</kbd> {copy.dock.hintShortcuts}
            </button>
          </span>
          <span className="dock-chips">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className="chip small"
                onClick={() => void ellma.send(suggestion)}
              >
                {suggestion}
              </button>
            ))}
            <button type="button" className="chip small" onClick={ellma.brief}>
              <Icon name="sparkle" size={14} /> {copy.dock.brief}
            </button>
          </span>
        </div>
      )}
    </aside>
  );
}
