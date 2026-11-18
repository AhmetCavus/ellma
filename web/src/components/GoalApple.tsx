import { useId } from "react";
import type { GoalColor } from "@ellma/shared";

const BODY =
  "M32 19.5C27.2 14.6 15.6 13.8 10.6 23.6 6.2 32.4 9.6 46.6 16.8 53.4c4.6 4.3 10.2 4.4 15.2 1.8 5 2.6 10.6 2.5 15.2-1.8 7.2-6.8 10.6-21 6.2-29.8C48.4 13.8 36.8 14.6 32 19.5z";

/**
 * A goal drawn as an apple that fills with the goal's colour as the week's target is met.
 * `ratio` is 0–1; at 1 the apple is ripe and its leaf turns green.
 */
export function GoalApple({
  color,
  ratio,
  size = 56,
  label,
  className = "",
  transitionName,
}: {
  color: GoalColor;
  ratio: number;
  size?: number;
  label?: string;
  className?: string;
  /** Lets the apple travel between pages during a view transition. */
  transitionName?: string;
}) {
  const clip = `apple-${useId().replace(/:/g, "")}`;
  const level = Math.max(0, Math.min(1, ratio));
  return (
    <svg
      className={`goal-apple ${level >= 1 ? "is-ripe" : ""} ${className}`}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{
        ["--goal" as string]: `var(--goal-${color})`,
        ["--level" as string]: level,
        viewTransitionName: transitionName,
      }}
    >
      <defs>
        <clipPath id={clip}>
          <path d={BODY} />
        </clipPath>
      </defs>
      <path d={BODY} className="goal-apple-shell" />
      <g clipPath={`url(#${clip})`}>
        <g className="goal-apple-level">
          <path
            className="goal-apple-juice"
            d="M-32 15q8-3 16 0t16 0 16 0 16 0 16 0 16 0 16 0 16 0V70H-32Z"
          />
        </g>
      </g>
      <path
        d="M18.5 26.5c-2.6 3-3.4 7.6-2.4 12"
        fill="none"
        stroke="#fff"
        strokeOpacity=".5"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M32 20c-.3-4.3.5-8 2.6-11.2"
        fill="none"
        stroke="var(--stem)"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      <path
        className="goal-apple-leaf"
        d="M30.4 13.8c-2.4-5.3-7.9-7.2-13.2-6 1.3 5.5 7 8.7 13.2 6z"
      />
    </svg>
  );
}
