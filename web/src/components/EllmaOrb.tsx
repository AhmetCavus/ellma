import { AppleMark } from "./AppleMark";

export type EllmaPhase = "idle" | "listening" | "thinking" | "answering" | "speaking";

/** Ellma's face: the apple, with rings that show whether she listens, thinks or speaks. */
export function EllmaOrb({ phase, size = 44 }: { phase: EllmaPhase; size?: number }) {
  return (
    <span className={`orb-face orb-${phase}`} aria-hidden="true">
      <span className="orb-ring" />
      <span className="orb-ring" />
      <span className="orb-ring" />
      <AppleMark size={size} />
    </span>
  );
}
