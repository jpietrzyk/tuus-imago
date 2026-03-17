import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { useSliderSwipeNavigation } from "./use-slider-swipe-navigation";

interface HarnessProps {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  swipeThreshold?: number;
}

function SwipeHarness({
  onSwipeLeft,
  onSwipeRight,
  swipeThreshold,
}: HarnessProps) {
  const { onTouchStart, onTouchEnd } = useSliderSwipeNavigation({
    onSwipeLeft,
    onSwipeRight,
    swipeThreshold,
  });

  return (
    <div
      data-testid="swipe-area"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    />
  );
}

describe("useSliderSwipeNavigation", () => {
  it("calls onSwipeLeft for left swipe beyond threshold", () => {
    const onSwipeLeft = vi.fn();
    const onSwipeRight = vi.fn();

    render(
      <SwipeHarness onSwipeLeft={onSwipeLeft} onSwipeRight={onSwipeRight} />,
    );

    const area = screen.getByTestId("swipe-area");

    fireEvent.touchStart(area, { touches: [{ clientX: 120 }] });
    fireEvent.touchEnd(area, { changedTouches: [{ clientX: 80 }] });

    expect(onSwipeLeft).toHaveBeenCalledTimes(1);
    expect(onSwipeRight).not.toHaveBeenCalled();
  });

  it("calls onSwipeRight for right swipe beyond threshold", () => {
    const onSwipeLeft = vi.fn();
    const onSwipeRight = vi.fn();

    render(
      <SwipeHarness onSwipeLeft={onSwipeLeft} onSwipeRight={onSwipeRight} />,
    );

    const area = screen.getByTestId("swipe-area");

    fireEvent.touchStart(area, { touches: [{ clientX: 80 }] });
    fireEvent.touchEnd(area, { changedTouches: [{ clientX: 120 }] });

    expect(onSwipeRight).toHaveBeenCalledTimes(1);
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

    fireEvent.touchStart(area, { touches: [{ clientX: 100 }] });
    fireEvent.touchEnd(area, { changedTouches: [{ clientX: 78 }] });

    expect(onSwipeLeft).not.toHaveBeenCalled();
    expect(onSwipeRight).not.toHaveBeenCalled();
  });
});
