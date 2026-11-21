import { SiteFooter } from "../components/SiteFooter";
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
import { REPOSITORY_URL } from "../lib/legal";
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

/** The recordings in web/public/tour, in the order of the tour copy. */
const TOUR = ["plant", "plan", "focus", "ripen"] as const;

/** One recording of the tour; people who prefer less motion see its still frame. */
function TourShot({ name, alt }: { name: string; alt: string }) {
  return (
    <figure className="tour-shot">
      <div className="window-bar" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <picture>
        <source media="(prefers-reduced-motion: reduce)" srcSet={`/tour/${name}.png`} />
        <img
          src={`/tour/${name}.gif`}
          alt={alt}
          width={960}
          height={600}
          loading="lazy"
          decoding="async"
        />
      </picture>
    </figure>
  );
}

function GitHubMark() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.56 9.56 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.75c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
    </svg>
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
          <span>ellma</span>
        </a>
        <div className="landing-nav-actions">
          <a
            className="button ghost small"
            href={REPOSITORY_URL}
            target="_blank"
            rel="noopener noreferrer"
            title={landing.githubHint}
            aria-label={landing.githubHint}
          >
            <GitHubMark />
            <span className="landing-nav-label">{landing.github}</span>
          </a>
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
          <a className="tour-link" href="#tour">
            {landing.tourLink} <Icon name="chevronRight" size={16} />
          </a>
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

      <section id="tour" className="landing-tour">
        <p className="eyebrow">{landing.tour.eyebrow}</p>
        <h2>{landing.tour.title}</h2>
        <p className="section-lead">{landing.tour.lead}</p>
        <ol className="tour-list">
          {landing.tour.items.map((item, index) => (
            <li key={item.title} className="tour-item">
              <div className="tour-text">
                <span className="tour-number">{String(index + 1).padStart(2, "0")}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
              <TourShot name={TOUR[index] ?? "plant"} alt={item.alt} />
            </li>
          ))}
        </ol>
      </section>

      <section className="landing-privacy">
        <p className="eyebrow">{landing.privacy.eyebrow}</p>
        <h2>{landing.privacy.title}</h2>
        <ul className="privacy-grid">
          {landing.privacy.items.map((item, index) => (
            <li key={item.title}>
              <span className="privacy-icon">
                <Icon name={(["server", "shield", "lock"] as const)[index] ?? "server"} size={22} />
              </span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </li>
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
      <p className="landing-footer">{landing.footer}</p>
      <SiteFooter />
    </div>
  );
}
