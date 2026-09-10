import { useEffect, useState } from "react";

export function useRecentlyChanged(value: unknown, durationMs = 1800): boolean {
  const [isRecent, setIsRecent] = useState(false);
  const [previousValue, setPreviousValue] = useState(value);

  if (previousValue !== value) {
    setPreviousValue(value);
    setIsRecent(true);
  }

  useEffect(() => {
    if (!isRecent) {
      return;
    }
    const timeoutId = window.setTimeout(() => setIsRecent(false), durationMs);
    return () => window.clearTimeout(timeoutId);
  }, [isRecent, durationMs, value]);

  return isRecent;
}
