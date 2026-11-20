import { AppleMark } from "./AppleMark";

export type EllmaPhase = "idle" | "listening" | "thinking" | "answering" | "speaking";

/**
 * Ellma's face: the apple, with rings that show whether she listens, thinks or speaks.
 * When `success` grows, the apple hops once to confirm that something was done.
 */
export function EllmaOrb({
  phase,
  size = 44,
  success = 0,
}: {
  phase: EllmaPhase;
  size?: number;
  success?: number;
}) {
  return (
    <span className={`orb-face orb-${phase}`} aria-hidden="true">
      <span className="orb-ring" />
      <span className="orb-ring" />
      <span className="orb-ring" />
      <span key={success} className={success > 0 ? "orb-success" : undefined}>
        <AppleMark size={size} />
      </span>
    </span>
  );
}
