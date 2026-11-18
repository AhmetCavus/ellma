import { useEffect, useRef, useState } from "react";

export function prefersReducedMotion(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

/** Animates a number towards its target, so progress visibly moves instead of jumping. */
export function useCountUp(target: number, durationMs = 700): number {
  const [value, setValue] = useState(target);
  const shown = useRef(target);
  useEffect(() => {
    const from = shown.current;
    if (from === target || prefersReducedMotion()) {
      shown.current = target;
      setValue(target);
      return;
    }
    const started = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      const progress = Math.min(1, (now - started) / durationMs);
      const eased = 1 - (1 - progress) ** 3;
      shown.current = from + (target - from) * eased;
      setValue(shown.current);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [durationMs, target]);
  return value;
}

const PARTY_COLORS = ["apple", "amber", "leaf", "teal", "sky", "indigo", "plum"];

/**
 * A burst of small apple-coloured sparks from an element or point. Used for finished steps,
 * reached milestones and ripe weeks: progress should feel like something.
 */
export function celebrate(
  origin: Element | { x: number; y: number } | null,
  size: "small" | "large" = "small",
): void {
  if (prefersReducedMotion() || !origin) {
    return;
  }
  const box = origin instanceof Element ? origin.getBoundingClientRect() : null;
  const x = box ? box.left + box.width / 2 : (origin as { x: number }).x;
  const y = box ? box.top + box.height / 2 : (origin as { y: number }).y;
  const count = size === "large" ? 34 : 12;
  const reach = size === "large" ? 190 : 56;
  const layer = document.createElement("div");
  layer.className = "burst";
  layer.style.left = `${x}px`;
  layer.style.top = `${y}px`;
  // Dialogs live in the top layer; sparks must be inside the open one to be visible.
  (document.querySelector("dialog[open]") ?? document.body).append(layer);
  let longest = 0;
  for (let index = 0; index < count; index++) {
    const spark = document.createElement("span");
    const angle = (index / count) * Math.PI * 2 + Math.random() * 0.6;
    const distance = reach * (0.45 + Math.random() * 0.55);
    const duration = 620 + Math.random() * (size === "large" ? 700 : 260);
    longest = Math.max(longest, duration);
    spark.style.background = `var(--goal-${PARTY_COLORS[index % PARTY_COLORS.length]})`;
    if (index % 3 === 0) {
      spark.style.borderRadius = "2px";
    }
    layer.append(spark);
    spark.animate(
      [
        { transform: "translate(-50%, -50%) scale(0.4)", opacity: 1 },
        {
          transform: `translate(calc(-50% + ${Math.cos(angle) * distance}px), calc(-50% + ${
            Math.sin(angle) * distance + (size === "large" ? 60 : 14)
          }px)) scale(1) rotate(${Math.round(Math.random() * 360)}deg)`,
          opacity: 0,
        },
      ],
      { duration, easing: "cubic-bezier(0.16, 0.8, 0.3, 1)", fill: "forwards" },
    );
  }
  window.setTimeout(() => layer.remove(), longest + 80);
}
