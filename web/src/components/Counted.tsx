import { formatDuration, goalHours } from "@ellma/shared";
import { useCountUp } from "../lib/motion";

/** Numbers that roll to their new value, so progress is seen and not just read. */
export function CountedHours({ seconds }: { seconds: number }) {
  return <>{goalHours(useCountUp(seconds))}</>;
}

export function CountedDuration({ seconds }: { seconds: number }) {
  return <>{formatDuration(useCountUp(seconds))}</>;
}

export function CountedNumber({ value }: { value: number }) {
  return <>{Math.round(useCountUp(value, 500))}</>;
}
