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

  it("clears drag feedback when the touch is cancelled", () => {    const onSwipeLeft = vi.fn();
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

function NeighbourHarness({
  onSwipeLeft,
  onSwipeRight,
}: {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}) {
  const {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onTouchCancel,
    frameRef,
    contentRef,
    incomingPrevRef,
    incomingNextRef,
  } = useSliderSwipeNavigation({
    onSwipeLeft,
    onSwipeRight,
    animationDurationMs: 0,
  });

  return (
    <div
      ref={frameRef}
      data-testid="swipe-frame"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchCancel}
    >
      <div ref={contentRef} data-testid="swipe-content" />
      <div ref={incomingPrevRef} data-testid="incoming-prev" />
      <div ref={incomingNextRef} data-testid="incoming-next" />
    </div>
  );
}

describe("useSliderSwipeNavigation neighbour previews", () => {
  const mockFrameWidth = (element: HTMLElement, width: number) => {
    element.getBoundingClientRect = () =>
      ({
        width,
        height: 100,
        top: 0,
        left: 0,
        right: width,
        bottom: 100,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect;
  };

  it("keeps the frame still while the content and neighbour slide", () => {
    const onSwipeLeft = vi.fn();
    const onSwipeRight = vi.fn();

    render(
      <NeighbourHarness
        onSwipeLeft={onSwipeLeft}
        onSwipeRight={onSwipeRight}
      />,
    );

    const frame = screen.getByTestId("swipe-frame");
    mockFrameWidth(frame, 100);

    fireEvent.touchStart(frame, { touches: [{ clientX: 200, clientY: 100 }] });
    fireEvent.touchMove(frame, { touches: [{ clientX: 150, clientY: 100 }] });

    // The frame is only the clip window now: it must not move itself.
    expect(frame.style.transform).toBe("");

    const content = screen.getByTestId("swipe-content");
    expect(content.style.transform).toContain("translateX(-50px)");

    // Swiping left pulls the next neighbour in from the right edge (one frame
    // width away at rest) while the previous one stays parked off the left.
    expect(screen.getByTestId("incoming-next").style.transform).toBe(
      "translateX(50px)",
    );
    expect(screen.getByTestId("incoming-prev").style.transform).toBe(
      "translateX(-150px)",
    );
  });

  it("parks the neighbour previews again when the touch is cancelled", () => {
    const onSwipeLeft = vi.fn();
    const onSwipeRight = vi.fn();

    render(
      <NeighbourHarness
        onSwipeLeft={onSwipeLeft}
        onSwipeRight={onSwipeRight}
      />,
    );

    const frame = screen.getByTestId("swipe-frame");
    mockFrameWidth(frame, 100);

    fireEvent.touchStart(frame, { touches: [{ clientX: 200, clientY: 100 }] });
    fireEvent.touchMove(frame, { touches: [{ clientX: 150, clientY: 100 }] });
    fireEvent.touchCancel(frame);

    expect(screen.getByTestId("incoming-next").style.transform).toBe(
      "translateX(100%)",
    );
    expect(screen.getByTestId("incoming-prev").style.transform).toBe(
      "translateX(-100%)",
    );
    expect(screen.getByTestId("swipe-content").style.transform).toBe("");
  });

  it("snaps the slid-in neighbour into place after a successful swipe", async () => {
    const onSwipeLeft = vi.fn();
    const onSwipeRight = vi.fn();

    render(
      <NeighbourHarness
        onSwipeLeft={onSwipeLeft}
        onSwipeRight={onSwipeRight}
      />,
    );

    const frame = screen.getByTestId("swipe-frame");
    mockFrameWidth(frame, 100);

    fireEvent.touchStart(frame, { touches: [{ clientX: 200, clientY: 100 }] });
    fireEvent.touchMove(frame, { touches: [{ clientX: 100, clientY: 100 }] });
    fireEvent.touchEnd(frame, { changedTouches: [{ clientX: 100, clientY: 100 }] });

    await waitFor(() => expect(onSwipeLeft).toHaveBeenCalledTimes(1));

    await waitFor(() => {
      expect(screen.getByTestId("swipe-content").style.transform).toBe("");
      expect(screen.getByTestId("incoming-next").style.transform).toBe(
        "translateX(100%)",
      );
    });
  });
});

