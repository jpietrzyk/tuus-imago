import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useEstimatedProgress } from "./use-estimated-progress";

describe("useEstimatedProgress", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("reports the start value while inactive", () => {
    const { result } = renderHook(() => useEstimatedProgress(false));

    expect(result.current).toBe(0);
  });

  it("advances while active and never exceeds the cap", () => {
    const { result } = renderHook(() =>
      useEstimatedProgress(true, { step: 30, intervalMs: 100, cap: 90 }),
    );

    expect(result.current).toBe(0);

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe(30);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current).toBe(90);
  });

  it("resets when it becomes inactive", () => {
    const { result, rerender } = renderHook(
      ({ active }: { active: boolean }) =>
        useEstimatedProgress(active, { step: 40, intervalMs: 100, cap: 80 }),
      { initialProps: { active: true } },
    );

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe(80);

    rerender({ active: false });

    expect(result.current).toBe(0);
  });
});
