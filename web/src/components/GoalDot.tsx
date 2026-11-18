import type { Goal } from "@ellma/shared";

export function GoalDot({ color, size = 10 }: { color: Goal["color"] | undefined; size?: number }) {
  return (
    <span
      className="goal-dot"
      style={{ width: size, height: size, background: `var(--goal-${color ?? "slate"})` }}
      aria-hidden="true"
    />
  );
}

export function GoalTag({ goal }: { goal: Goal | undefined }) {
  if (!goal) {
    return null;
  }
  return (
    <span className="goal-tag" style={{ color: `var(--goal-${goal.color})` }}>
      <GoalDot color={goal.color} size={8} />
      <span>{goal.title}</span>
    </span>
  );
}
