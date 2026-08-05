import "@testing-library/jest-dom/vitest";
import "@testing-library/jest-dom";

// ResizeObserver polyfill for jsdom
const globalWithResizeObserver = globalThis as typeof globalThis & {
  ResizeObserver?: typeof ResizeObserver;
};

if (typeof globalWithResizeObserver.ResizeObserver === "undefined") {
  globalWithResizeObserver.ResizeObserver = class ResizeObserver {
    constructor(callback: ResizeObserverCallback) {
      void callback;
    }

    observe(target: Element) {
      void target;
    }

    unobserve(target: Element) {
      void target;
    }

    disconnect() {}
  };
}

// Radix Select relies on pointer-capture APIs that are missing in jsdom.
if (typeof Element !== "undefined") {
  const elementProto = Element.prototype as Element & {
    hasPointerCapture?: (pointerId: number) => boolean;
    setPointerCapture?: (pointerId: number) => void;
    releasePointerCapture?: (pointerId: number) => void;
    scrollIntoView?: (arg?: boolean | ScrollIntoViewOptions) => void;
  };

  if (typeof elementProto.hasPointerCapture !== "function") {
    elementProto.hasPointerCapture = () => false;
  }
  if (typeof elementProto.setPointerCapture !== "function") {
    elementProto.setPointerCapture = () => {};
  }
  if (typeof elementProto.releasePointerCapture !== "function") {
    elementProto.releasePointerCapture = () => {};
  }
  if (typeof elementProto.scrollIntoView !== "function") {
    elementProto.scrollIntoView = () => {};
  }
}

// jsdom returns null from HTMLCanvasElement.prototype.getContext() (and logs a
// "Not implemented" warning) unless the optional native `canvas` package is
// installed. Return a stub 2D context so preview rendering can still size the
// canvas buffer in tests — only dimensions are asserted, never pixels. Tests
// that need specific context behaviour mock getContext themselves
// (see preview-canvas-utils.test.ts).
const createCanvasRenderingContext2DStub = (): CanvasRenderingContext2D => {
  const noop = () => {};
  return {
    canvas: null,
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    filter: "none",
    globalAlpha: 1,
    globalCompositeOperation: "source-over",
    imageSmoothingEnabled: true,
    arc: noop,
    beginPath: noop,
    clearRect: noop,
    clip: noop,
    closePath: noop,
    createImageData: () => ({ data: new Uint8ClampedArray(0) }),
    drawImage: noop,
    fill: noop,
    fillRect: noop,
    fillText: noop,
    getImageData: () => ({ data: new Uint8ClampedArray(0) }),
    lineTo: noop,
    measureText: () => ({ width: 0 }),
    moveTo: noop,
    putImageData: noop,
    rect: noop,
    restore: noop,
    rotate: noop,
    save: noop,
    scale: noop,
    setTransform: noop,
    stroke: noop,
    strokeRect: noop,
    strokeText: noop,
    transform: noop,
    translate: noop,
  } as unknown as CanvasRenderingContext2D;
};

if (typeof window.HTMLCanvasElement === "function") {
  const canvasPrototype = HTMLCanvasElement.prototype as {
    getContext: (...args: unknown[]) => RenderingContext | null;
  };
  const nativeGetContext = canvasPrototype.getContext;
  canvasPrototype.getContext = function (this: HTMLCanvasElement, ...args: unknown[]) {
    const native = nativeGetContext.apply(this, args as [string]) ?? null;
    return native ?? createCanvasRenderingContext2DStub();
  };
}

if (typeof window !== "undefined" && !window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}
