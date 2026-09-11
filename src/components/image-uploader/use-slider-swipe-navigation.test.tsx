import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useSliderSwipeNavigation } from "./use-slider-swipe-navigation";

interface HarnessProps {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  swipeThreshold?: number;
  canSwipeLeft?: boolean;
  canSwipeRight?: boolean;
}

function SwipeHarness({
  onSwipeLeft,
  onSwipeRight,
  swipeThreshold,
  canSwipeLeft,
  canSwipeRight,
}: HarnessProps) {
  const { onTouchStart, onTouchMove, onTouchEnd, onTouchCancel, frameRef } =
    useSliderSwipeNavigation({
      onSwipeLeft,
      onSwipeRight,
      swipeThreshold,
      canSwipeLeft,
      canSwipeRight,
      animationDurationMs: 0,
    });

  return (
    <div
      ref={frameRef}
      data-testid="swipe-area"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchCancel}
    />
  );
}

describe("useSliderSwipeNavigation", () => {
  it("calls onSwipeLeft for left swipe beyond threshold", async () => {
    const onSwipeLeft = vi.fn();
    const onSwipeRight = vi.fn();

    render(
      <SwipeHarness onSwipeLeft={onSwipeLeft} onSwipeRight={onSwipeRight} />,
    );

    const area = screen.getByTestId("swipe-area");

    fireEvent.touchStart(area, { touches: [{ clientX: 120, clientY: 100 }] });
    fireEvent.touchMove(area, { touches: [{ clientX: 80, clientY: 100 }] });
    fireEvent.touchEnd(area, {
      changedTouches: [{ clientX: 80, clientY: 100 }],
    });

    await waitFor(() => expect(onSwipeLeft).toHaveBeenCalledTimes(1));
    expect(onSwipeRight).not.toHaveBeenCalled();
  });

  it("calls onSwipeRight for right swipe beyond threshold", async () => {
    const onSwipeLeft = vi.fn();
    const onSwipeRight = vi.fn();

    render(
      <SwipeHarness onSwipeLeft={onSwipeLeft} onSwipeRight={onSwipeRight} />,
    );

    const area = screen.getByTestId("swipe-area");

    fireEvent.touchStart(area, { touches: [{ clientX: 80, clientY: 100 }] });
    fireEvent.touchMove(area, { touches: [{ clientX: 120, clientY: 100 }] });
    fireEvent.touchEnd(area, {
      changedTouches: [{ clientX: 120, clientY: 100 }],
    });

    await waitFor(() => expect(onSwipeRight).toHaveBeenCalledTimes(1));
    expect(onSwipeLeft).not.toHaveBeenCalled();
  });

  it("does not trigger swipe callbacks below threshold", () => {
    const onSwipeLeft = vi.fn();
    const onSwipeRight = vi.fn();

    render(
      <SwipeHarness
        onSwipeLeft={onSwipeLeft}
        onSwipeRight={onSwipeRight}
        swipeThreshold={30}
      />,
    );

    const area = screen.getByTestId("swipe-area");

    fireEvent.touchStart(area, { touches: [{ clientX: 100, clientY: 100 }] });
    fireEvent.touchMove(area, { touches: [{ clientX: 88, clientY: 100 }] });
    fireEvent.touchEnd(area, {
      changedTouches: [{ clientX: 88, clientY: 100 }],
    });

    expect(onSwipeLeft).not.toHaveBeenCalled();
    expect(onSwipeRight).not.toHaveBeenCalled();
  });

  it("translates the frame while dragging to give swipe feedback", () => {
    const onSwipeLeft = vi.fn();
    const onSwipeRight = vi.fn();

    render(
      <SwipeHarness onSwipeLeft={onSwipeLeft} onSwipeRight={onSwipeRight} />,
    );

    const area = screen.getByTestId("swipe-area");

    fireEvent.touchStart(area, { touches: [{ clientX: 120, clientY: 100 }] });
    fireEvent.touchMove(area, { touches: [{ clientX: 90, clientY: 100 }] });

    expect(area.style.transform).toContain("translateX(-30px)");
    expect(area.style.transform).toContain("scale(");
    expect(Number(area.style.opacity)).toBeLessThan(1);
  });

  it("does not translate when swiping towards an unavailable slot", () => {
    const onSwipeLeft = vi.fn();
    const onSwipeRight = vi.fn();

    render(
      <SwipeHarness
        onSwipeLeft={onSwipeLeft}
        onSwipeRight={onSwipeRight}
        canSwipeLeft={false}
      />,
    );

    const area = screen.getByTestId("swipe-area");

    fireEvent.touchStart(area, { touches: [{ clientX: 120, clientY: 100 }] });
    fireEvent.touchMove(area, { touches: [{ clientX: 40, clientY: 100 }] });

    expect(area.style.transform).toContain("translateX(-28px)");
  });

  it("clears drag feedback when the touch is cancelled", () => {
    const onSwipeLeft = vi.fn();
    const onSwipeRight = vi.fn();

    render(
      <SwipeHarness onSwipeLeft={onSwipeLeft} onSwipeRight={onSwipeRight} />,
    );

    const area = screen.getByTestId("swipe-area");

    fireEvent.touchStart(area, { touches: [{ clientX: 120, clientY: 100 }] });
    fireEvent.touchMove(area, { touches: [{ clientX: 90, clientY: 100 }] });

    expect(area.style.transform).not.toBe("");

    fireEvent.touchCancel(area);

    expect(area.style.transform).toBe("");
    expect(area.style.opacity).toBe("");
    expect(onSwipeLeft).not.toHaveBeenCalled();
    expect(onSwipeRight).not.toHaveBeenCalled();
  });
});
