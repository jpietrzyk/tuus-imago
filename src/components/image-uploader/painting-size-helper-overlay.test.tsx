import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import PaintingSizeHelperOverlay from "./painting-size-helper-overlay";

const installResizeObserverStub = () => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: ResizeObserverCallback) {
        queueMicrotask(callback);
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
};

function renderOverlayWithSize(
  width: number,
  height: number,
  props: React.ComponentProps<typeof PaintingSizeHelperOverlay>,
) {
  const { container } = render(
    <PaintingSizeHelperOverlay {...props}>
      <div />
    </PaintingSizeHelperOverlay>,
  );

  const wrapper = container.firstElementChild as HTMLElement;
  wrapper.getBoundingClientRect = () =>
    DOMRect.fromRect({ x: 0, y: 0, width, height });

  return wrapper;
}

async function expectFitBoxSize(width: number, height: number) {
  const box = screen.getByTestId("overlay-fit-box");
  await waitFor(() => {
    expect(Number.parseFloat(box.style.width)).toBeCloseTo(width, 1);
    expect(Number.parseFloat(box.style.height)).toBeCloseTo(height, 1);
  });
}

describe("PaintingSizeHelperOverlay", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sizes the reference box to the container height without reserve", async () => {
    installResizeObserverStub();
    renderOverlayWithSize(1200, 800, {
      selectedSize: 0,
      paintingAspectRatio: 1,
    });

    await expectFitBoxSize(800, 800);
  });

  it("reduces the reference box height by the bottom reserve", async () => {
    installResizeObserverStub();
    renderOverlayWithSize(1200, 800, {
      selectedSize: 0,
      paintingAspectRatio: 1,
      bottomReservePx: 100,
    });

    await expectFitBoxSize(700, 700);
  });

  it("scales vertical paintings down with the reserve when height-constrained", async () => {
    installResizeObserverStub();
    renderOverlayWithSize(900, 800, {
      selectedSize: 0,
      paintingAspectRatio: 2 / 3,
      bottomReservePx: 100,
    });

    // Without the reserve the square side would be 800 (533x800 box).
    await expectFitBoxSize((700 * 2) / 3, 700);
  });

  it("keeps the width constraint when the container is narrower", async () => {
    installResizeObserverStub();
    renderOverlayWithSize(600, 800, {
      selectedSize: 0,
      paintingAspectRatio: 2 / 3,
      bottomReservePx: 100,
    });

    // Width-constrained: reserve does not shrink below the width limit.
    await expectFitBoxSize(400, 600);
  });
});
