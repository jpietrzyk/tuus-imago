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

// Simple polyfill for HTMLCanvasElement in jsdom to suppress warnings
if (typeof window.HTMLCanvasElement !== "function") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).HTMLCanvasElement = class HTMLCanvasElement {
    width: number = 300;
    height: number = 150;

    getContext() {
      // Return a minimal mock context
      return {
        fillRect: () => {},
        clearRect: () => {},
        getImageData: () => ({ data: new Uint8ClampedArray(0) }),
        putImageData: () => {},
        createImageData: () => ({ data: new Uint8ClampedArray(0) }),
        setTransform: () => {},
        drawImage: () => {},
        save: () => {},
        fillText: () => {},
        restore: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        closePath: () => {},
        stroke: () => {},
        translate: () => {},
        scale: () => {},
        rotate: () => {},
        arc: () => {},
        fill: () => {},
        measureText: () => ({ width: 0 }),
        transform: () => {},
        rect: () => {},
        clip: () => {},
      };
    }

    toDataURL() {
      return "";
    }
  };
}
