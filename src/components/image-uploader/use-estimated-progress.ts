import { useEffect, useState } from "react";

interface UseEstimatedProgressOptions {
  /** Progress value shown the moment the task becomes active. */
  start?: number;
  /** Amount added on every tick. */
  step?: number;
  /** Delay between ticks, in milliseconds. */
  intervalMs?: number;
  /** Value the estimate asymptotically approaches and never exceeds. */
  cap?: number;
}

/**
 * Estimated progress for work whose real completion percentage is not exposed
 * (e.g. a Cloudinary on-the-fly AI effect, which is generated server-side and
 * only reports success/failure). The value rises quickly at first and eases to
 * `cap` so the user sees movement without the bar ever looking finished before
 * the result actually arrives. Callers hide the progress UI when `isActive`
 * turns false, at which point the value resets.
 */
export function useEstimatedProgress(
  isActive: boolean,
  {
    start = 0,
    step = 4,
    intervalMs = 250,
    cap = 90,
  }: UseEstimatedProgressOptions = {},
): number {
  const [{ active, progress }, setState] = useState({
    active: isActive,
    progress: start,
  });

  // Reset when the task starts or stops. Adjusting state during render (guarded
  // by a comparison) is the recommended way to derive state from a prop change
  // without an effect, which would trigger the set-state-in-effect lint rule.
  if (active !== isActive) {
    setState({ active: isActive, progress: start });
  }

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setState((previous) => ({
        ...previous,
        progress: Math.min(previous.progress + step, cap),
      }));
    }, intervalMs);

    return () => window.clearInterval(intervalId);
  }, [isActive, step, intervalMs, cap]);

  return progress;
}
