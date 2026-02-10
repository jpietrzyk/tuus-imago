import "@testing-library/jest-dom/vitest";
import "@testing-library/jest-dom";

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
