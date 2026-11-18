import { useEffect, useMemo, useRef, useState } from "react";
import { goalHours } from "@ellma/shared";
import { AppleMark } from "../components/AppleMark";
import { CountedHours } from "../components/Counted";
import { EllmaOrb, type EllmaPhase } from "../components/EllmaOrb";
import { GoalApple } from "../components/GoalApple";
import { Icon } from "../components/Icon";
import { SettingsInline } from "../components/Settings";
import { celebrate, prefersReducedMotion } from "../lib/motion";
import { usePreferences } from "../lib/preferences";
import { linkHandler, navigate } from "../lib/router";
import { SEED_GOAL_KEY, writeStored } from "../lib/storage";

// The week behind each scene of the preview: hours invested out of a 5-hour target.
const WEEK = [1.5, 3.5, 5];
const TARGET = 5;
const STATES = ["behind", "on_track", "ripe"] as const;

type Stage = "listening" | "thinking" | "answering" | "idle";

/**
 * A scripted miniature of the real app, built from the same apple, orb and sparks: the
 * visitor says something, Ellma acts, the goal's apple fills. It plays by itself and
 * every sentence can be picked by hand.
 */
function LivePreview() {
  const { copy } = usePreferences();
  const { demo } = copy.landing;
  const reduced = useMemo(prefersReducedMotion, []);
  const apple = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [stage, setStage] = useState<Stage>("listening");
  const [heard, setHeard] = useState(0);
  const [said, setSaid] = useState(0);
  const scene = demo.scenes[index] ?? demo.scenes[0];
  const answered = stage === "answering" || stage === "idle";
  // Until Ellma has answered, the apple still shows the week before this sentence.
  const weekIndex = answered ? index : Math.max(0, index - 1);
  const hours = WEEK[weekIndex] ?? 0;
  const ratio = hours / TARGET;

  const play = (next: number) => {
    setIndex(next % demo.scenes.length);
    setHeard(0);
    setSaid(0);
    setStage("listening");
  };

  useEffect(() => {
    if (!scene) {
      return;
    }
    let delay: number;
    let advance: () => void;
    if (stage === "listening") {
      const done = heard >= scene.say.length;
      delay = done ? 650 : 36;
      advance = done
        ? () => setStage("thinking")
        : () => setHeard(reduced ? scene.say.length : heard + 1);
    } else if (stage === "thinking") {
      delay = 1100;
      advance = () => setStage("answering");
    } else if (stage === "answering") {
      const done = said >= scene.reply.length;
      delay = done ? 0 : 20;
      advance = done
        ? () => setStage("idle")
        : () => setSaid(reduced ? scene.reply.length : said + 2);
    } else {
      delay = reduced ? 9000 : 4200;
      advance = () => play(index + 1);
    }
    const timer = window.setTimeout(advance, delay);
    return () => window.clearTimeout(timer);
    // `play` only reads the scene count, which never changes while the page is open.
  }, [heard, index, reduced, said, scene, stage]);

  useEffect(() => {
    if (stage === "answering" && said === 0 && ratio >= 1) {
      const box = apple.current?.getBoundingClientRect();
      // Sparks only when the apple is actually on screen.
      if (box && box.bottom > 0 && box.top < window.innerHeight) {
        celebrate(apple.current, "large");
      }
    }
  }, [ratio, said, stage]);

  if (!scene) {
    return null;
  }
  const phase: EllmaPhase = stage;
  const state = STATES[weekIndex] ?? "on_track";
  const step = answered ? scene.step : (demo.scenes[index - 1]?.step ?? "…");

  return (
    <div className="preview" aria-label={demo.caption}>
      <div
        className="preview-goal"
        style={{ ["--goal" as string]: "var(--goal-apple)" }}
        aria-hidden="true"
      >
        <div ref={apple}>
          <GoalApple color="apple" ratio={ratio} size={92} />
        </div>
        <div className="goal-card-text">
          <span className={`state state-${state}`}>{copy.goals.states[state]}</span>
          <span className="goal-card-title">{demo.goal}</span>
          <span className="goal-card-week">
            <strong>
              <CountedHours seconds={hours * 3600} />
            </strong>
            {copy.goals.weekOf("", goalHours(TARGET * 3600))}
          </span>
        </div>
        <div className="preview-step">
          <span className="goal-card-step-label">{demo.nextStep}</span>
          <span className="goal-card-step-title" key={step}>
            {step}
          </span>
        </div>
      </div>

      <div className={`preview-dock dock-${phase}`} aria-hidden="true">
        <span className="orb">
          <EllmaOrb phase={phase} size={40} />
        </span>
        <div className="dock-body">
          <p className="dock-you">
            <span>{demo.you}</span> {scene.say.slice(0, heard)}
            {stage === "listening" && <i className="caret" />}
          </p>
          {answered && (
            <ul className="actions">
              <li className="action-chip">
                <Icon name="check" size={14} />
                <strong>{scene.action}</strong>
              </li>
            </ul>
          )}
          <p className="dock-reply">
            {stage === "thinking" ? (
              <>
                {copy.dock.thinking}
                <span className="typing" />
              </>
            ) : (
              scene.reply.slice(0, said)
            )}
          </p>
        </div>
      </div>

      <div className="preview-picker">
        <p className="hint">{demo.caption}</p>
        {demo.scenes.map((entry, position) => (
          <button
            key={entry.say}
            type="button"
            className={`chip small ${position === index ? "is-on" : ""}`}
            aria-pressed={position === index}
            onClick={() => play(position)}
          >
            “{entry.say}”
          </button>
        ))}
      </div>
    </div>
  );
}

/** Fills its apple when it scrolls into view, so the three steps ripen as you read. */
function RipeningApple({ ratio }: { ratio: number }) {
  const holder = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const element = holder.current;
    if (!element || !("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => entry?.isIntersecting && setVisible(true),
      { threshold: 0.6 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={holder} className="step-apple">
      <GoalApple color="apple" ratio={visible ? ratio : 0} size={84} />
    </div>
  );
}

export function LandingPage() {
  const { copy } = usePreferences();
  const { landing } = copy;
  const [goal, setGoal] = useState("");

  return (
    <div className="landing">
      <header className="landing-nav">
        <a className="brand" href="/" onClick={linkHandler("/")}>
          <AppleMark size={32} />
          <span>Ellma</span>
        </a>
        <div className="landing-nav-actions">
          <SettingsInline />
          <a className="button ghost small" href="/login" onClick={linkHandler("/login")}>
            {landing.secondary}
          </a>
        </div>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-text">
          <p className="eyebrow">{landing.eyebrow}</p>
          <h1>
            {landing.titleStart} <em>{landing.titleEmphasis}</em>
          </h1>
          <p className="lead">{landing.lead}</p>
          <div className="button-row">
            <a className="button large" href="/signup" onClick={linkHandler("/signup")}>
              {landing.primary} <Icon name="chevronRight" size={18} />
            </a>
            <a className="button ghost large" href="/login" onClick={linkHandler("/login")}>
              {landing.secondary}
            </a>
          </div>
        </div>
        <LivePreview />
      </section>

      <section className="landing-steps">
        <h2>{landing.stepsTitle}</h2>
        <ol>
          {landing.steps.map((step, index) => (
            <li key={step.title}>
              <RipeningApple ratio={[0, 0.55, 1][index] ?? 0} />
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
        <ul className="landing-facts">
          {landing.facts.map((fact) => (
            <li key={fact}>{fact}</li>
          ))}
        </ul>
      </section>

      <section className="landing-closing">
        <AppleMark size={72} className="apple-mark-float" />
        <h2>{landing.closingTitle}</h2>
        <p>{landing.closingBody}</p>
        <form
          className="landing-seed"
          onSubmit={(event) => {
            event.preventDefault();
            writeStored(SEED_GOAL_KEY, goal.trim() || null);
            navigate("/signup");
          }}
        >
          <input
            value={goal}
            onChange={(event) => setGoal(event.target.value)}
            placeholder={landing.closingPlaceholder}
            aria-label={landing.closingTitle}
            maxLength={140}
          />
          <button className="button large">{landing.closingAction}</button>
        </form>
      </section>
      <footer className="landing-footer">{landing.footer}</footer>
    </div>
  );
}
