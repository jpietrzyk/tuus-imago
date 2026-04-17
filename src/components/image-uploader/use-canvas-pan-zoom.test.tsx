import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, act } from "@testing-library/react";
import { useRef, useState } from "react";
import { useCanvasPanZoom } from "./use-canvas-pan-zoom";

class MockTouch {
  clientX: number;
  clientY: number;
  identifier: number;
  target: EventTarget;
  pageX: number;
  pageY: number;
  screenX: number;
  screenY: number;
  radiusX = 0;
  radiusY = 0;
  rotationAngle = 0;
  force = 1;

  constructor(init: TouchInit) {
    this.clientX = init.clientX;
    this.clientY = init.clientY;
    this.identifier = init.identifier;
    this.target = init.target;
    this.pageX = init.clientX;
    this.pageY = init.clientY;
    this.screenX = init.clientX;
    this.screenY = init.clientY;
  }
}

beforeEach(() => {
  if (typeof Touch === "undefined") {
    (globalThis as unknown as Record<string, unknown>).Touch = MockTouch;
  }
});

function PanZoomHost({
  isEditMode,
  initialZoom = 1,
  initialPanX = 0,
  initialPanY = 0,
}: {
  isEditMode: boolean;
  initialZoom?: number;
  initialPanX?: number;
  initialPanY?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(initialZoom);
  const [panX, setPanX] = useState(initialPanX);
  const [panY, setPanY] = useState(initialPanY);

  useCanvasPanZoom({
    canvasRef,
    isEditMode,
    zoom,
    panX,
    panY,
    onZoomChange: setZoom,
    onPanChange: (x, y) => {
      setPanX(x);
      setPanY(y);
    },
  });

  return (
    <canvas
      ref={canvasRef}
      data-testid="test-canvas"
      width={400}
      height={300}
      style={{ width: 400, height: 300 }}
    />
  );
}

function getCanvas(): HTMLCanvasElement {
  return document.querySelector('canvas[data-testid="test-canvas"]')!;
}

function createMouseEvent(
  type: string,
  props: Partial<MouseEventInit> = {},
): MouseEvent {
  return new MouseEvent(type, { bubbles: true, cancelable: true, ...props });
}

function createTouch(x: number, y: number): Touch {
  return new MockTouch({ identifier: 0, target: getCanvas(), clientX: x, clientY: y }) as unknown as Touch;
}

function createTouch1(x: number, y: number): Touch {
  return new MockTouch({ identifier: 1, target: getCanvas(), clientX: x, clientY: y }) as unknown as Touch;
}

function createTouchEvent(
  type: string,
  touches: Touch[],
  changedTouches?: Touch[],
): TouchEvent {
  return new TouchEvent(type, {
    bubbles: true,
    cancelable: true,
    touches,
    changedTouches: changedTouches ?? touches,
  });
}

describe("useCanvasPanZoom", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not attach listeners when isEditMode is false", () => {
    const addSpy = vi.spyOn(HTMLCanvasElement.prototype, "addEventListener");
    render(<PanZoomHost isEditMode={false} />);
    expect(addSpy).not.toHaveBeenCalled();
    addSpy.mockRestore();
  });

  it("attaches listeners when isEditMode is true", () => {
    const addSpy = vi.spyOn(HTMLCanvasElement.prototype, "addEventListener");
    render(<PanZoomHost isEditMode={true} />);
    expect(addSpy).toHaveBeenCalled();
    addSpy.mockRestore();
  });

  it("removes listeners when isEditMode changes to false", () => {
    const removeSpy = vi.spyOn(HTMLCanvasElement.prototype, "removeEventListener");
    const { rerender } = render(<PanZoomHost isEditMode={true} />);
    rerender(<PanZoomHost isEditMode={false} />);
    expect(removeSpy).toHaveBeenCalled();
    removeSpy.mockRestore();
  });

  it("calls onZoomChange on mouse wheel scroll up", () => {
    const onZoomChange = vi.fn();
    const Host = () => {
      const canvasRef = useRef<HTMLCanvasElement>(null);
      useCanvasPanZoom({
        canvasRef,
        isEditMode: true,
        zoom: 1,
        panX: 0,
        panY: 0,
        onZoomChange,
        onPanChange: vi.fn(),
      });
      return <canvas ref={canvasRef} data-testid="test-canvas" width={400} height={300} style={{ width: 400, height: 300 }} />;
    };
    render(<Host />);
    const canvas = getCanvas();
    const wheelEvent = new WheelEvent("wheel", {
      deltaY: -100,
      bubbles: true,
      cancelable: true,
    });
    act(() => {
      canvas.dispatchEvent(wheelEvent);
    });
    expect(onZoomChange).toHaveBeenCalledWith(expect.any(Number));
    const newZoom = onZoomChange.mock.calls[0][0];
    expect(newZoom).toBeGreaterThan(1);
  });

  it("calls onZoomChange on mouse wheel scroll down to decrease zoom", () => {
    const onZoomChange = vi.fn();
    const Host = () => {
      const canvasRef = useRef<HTMLCanvasElement>(null);
      useCanvasPanZoom({
        canvasRef,
        isEditMode: true,
        zoom: 2,
        panX: 0,
        panY: 0,
        onZoomChange,
        onPanChange: vi.fn(),
      });
      return <canvas ref={canvasRef} data-testid="test-canvas" width={400} height={300} style={{ width: 400, height: 300 }} />;
    };
    render(<Host />);
    const canvas = getCanvas();
    const wheelEvent = new WheelEvent("wheel", {
      deltaY: 100,
      bubbles: true,
      cancelable: true,
    });
    act(() => {
      canvas.dispatchEvent(wheelEvent);
    });
    expect(onZoomChange).toHaveBeenCalledWith(expect.any(Number));
    const newZoom = onZoomChange.mock.calls[0][0];
    expect(newZoom).toBeLessThan(2);
  });

  it("clamps zoom to max 3", () => {
    const onZoomChange = vi.fn();
    const Host = () => {
      const canvasRef = useRef<HTMLCanvasElement>(null);
      useCanvasPanZoom({
        canvasRef,
        isEditMode: true,
        zoom: 3,
        panX: 0,
        panY: 0,
        onZoomChange,
        onPanChange: vi.fn(),
      });
      return <canvas ref={canvasRef} data-testid="test-canvas" width={400} height={300} style={{ width: 400, height: 300 }} />;
    };
    render(<Host />);
    const canvas = getCanvas();
    act(() => {
      canvas.dispatchEvent(new WheelEvent("wheel", { deltaY: -100, bubbles: true, cancelable: true }));
    });
    expect(onZoomChange).not.toHaveBeenCalled();
  });

  it("clamps zoom to min 1", () => {
    const onZoomChange = vi.fn();
    const Host = () => {
      const canvasRef = useRef<HTMLCanvasElement>(null);
      useCanvasPanZoom({
        canvasRef,
        isEditMode: true,
        zoom: 1,
        panX: 0,
        panY: 0,
        onZoomChange,
        onPanChange: vi.fn(),
      });
      return <canvas ref={canvasRef} data-testid="test-canvas" width={400} height={300} style={{ width: 400, height: 300 }} />;
    };
    render(<Host />);
    const canvas = getCanvas();
    act(() => {
      canvas.dispatchEvent(new WheelEvent("wheel", { deltaY: 100, bubbles: true, cancelable: true }));
    });
    expect(onZoomChange).not.toHaveBeenCalled();
  });

  it("calls onPanChange on mouse drag", () => {
    const onPanChange = vi.fn();
    const Host = () => {
      const canvasRef = useRef<HTMLCanvasElement>(null);
      useCanvasPanZoom({
        canvasRef,
        isEditMode: true,
        zoom: 2,
        panX: 0,
        panY: 0,
        onZoomChange: vi.fn(),
        onPanChange,
      });
      return <canvas ref={canvasRef} data-testid="test-canvas" width={400} height={300} style={{ width: 400, height: 300 }} />;
    };
    render(<Host />);
    const canvas = getCanvas();

    act(() => {
      canvas.dispatchEvent(createMouseEvent("mousedown", { clientX: 200, clientY: 150, button: 0 }));
    });
    act(() => {
      window.dispatchEvent(createMouseEvent("mousemove", { clientX: 180, clientY: 140 }));
    });
    act(() => {
      window.dispatchEvent(createMouseEvent("mouseup"));
    });

    expect(onPanChange).toHaveBeenCalled();
  });

  it("calls onPanChange on single-finger touch drag", () => {
    const onPanChange = vi.fn();
    const Host = () => {
      const canvasRef = useRef<HTMLCanvasElement>(null);
      useCanvasPanZoom({
        canvasRef,
        isEditMode: true,
        zoom: 2,
        panX: 0,
        panY: 0,
        onZoomChange: vi.fn(),
        onPanChange,
      });
      return <canvas ref={canvasRef} data-testid="test-canvas" width={400} height={300} style={{ width: 400, height: 300 }} />;
    };
    render(<Host />);
    const canvas = getCanvas();

    act(() => {
      canvas.dispatchEvent(createTouchEvent("touchstart", [createTouch(200, 150)]));
    });
    act(() => {
      canvas.dispatchEvent(
        createTouchEvent("touchmove", [createTouch(180, 140)]),
      );
    });

    expect(onPanChange).toHaveBeenCalled();
  });

  it("calls onZoomChange on pinch gesture", () => {
    const onZoomChange = vi.fn();
    const Host = () => {
      const canvasRef = useRef<HTMLCanvasElement>(null);
      useCanvasPanZoom({
        canvasRef,
        isEditMode: true,
        zoom: 1,
        panX: 0,
        panY: 0,
        onZoomChange,
        onPanChange: vi.fn(),
      });
      return <canvas ref={canvasRef} data-testid="test-canvas" width={400} height={300} style={{ width: 400, height: 300 }} />;
    };
    render(<Host />);
    const canvas = getCanvas();

    act(() => {
      canvas.dispatchEvent(
        createTouchEvent("touchstart", [createTouch(100, 150), createTouch1(300, 150)]),
      );
    });
    act(() => {
      canvas.dispatchEvent(
        createTouchEvent("touchmove", [createTouch(80, 150), createTouch1(320, 150)]),
      );
    });

    expect(onZoomChange).toHaveBeenCalled();
    const newZoom = onZoomChange.mock.calls[0][0];
    expect(newZoom).toBeGreaterThan(1);
  });

  it("resets pan when zoom returns to 1 via wheel", () => {
    const onPanChange = vi.fn();
    const Host = () => {
      const canvasRef = useRef<HTMLCanvasElement>(null);
      useCanvasPanZoom({
        canvasRef,
        isEditMode: true,
        zoom: 1.05,
        panX: 0.5,
        panY: 0.3,
        onZoomChange: vi.fn(),
        onPanChange,
      });
      return <canvas ref={canvasRef} data-testid="test-canvas" width={400} height={300} style={{ width: 400, height: 300 }} />;
    };
    render(<Host />);
    const canvas = getCanvas();

    act(() => {
      canvas.dispatchEvent(new WheelEvent("wheel", { deltaY: 100, bubbles: true, cancelable: true }));
    });

    expect(onPanChange).toHaveBeenCalledWith(0, 0);
  });

  it("ignores right-click mouse down", () => {
    const onPanChange = vi.fn();
    const Host = () => {
      const canvasRef = useRef<HTMLCanvasElement>(null);
      useCanvasPanZoom({
        canvasRef,
        isEditMode: true,
        zoom: 2,
        panX: 0,
        panY: 0,
        onZoomChange: vi.fn(),
        onPanChange,
      });
      return <canvas ref={canvasRef} data-testid="test-canvas" width={400} height={300} style={{ width: 400, height: 300 }} />;
    };
    render(<Host />);
    const canvas = getCanvas();

    act(() => {
      canvas.dispatchEvent(createMouseEvent("mousedown", { clientX: 200, clientY: 150, button: 2 }));
    });
    act(() => {
      window.dispatchEvent(createMouseEvent("mousemove", { clientX: 180, clientY: 140 }));
    });

    expect(onPanChange).not.toHaveBeenCalled();
  });

  it("transitions from pinch to single-finger drag on touch end", () => {
    const onPanChange = vi.fn();
    const Host = () => {
      const canvasRef = useRef<HTMLCanvasElement>(null);
      useCanvasPanZoom({
        canvasRef,
        isEditMode: true,
        zoom: 2,
        panX: 0,
        panY: 0,
        onZoomChange: vi.fn(),
        onPanChange,
      });
      return <canvas ref={canvasRef} data-testid="test-canvas" width={400} height={300} style={{ width: 400, height: 300 }} />;
    };
    render(<Host />);
    const canvas = getCanvas();

    const touch0 = createTouch(100, 150);
    const touch1 = createTouch1(300, 150);

    act(() => {
      canvas.dispatchEvent(
        createTouchEvent("touchstart", [touch0, touch1]),
      );
    });

    act(() => {
      canvas.dispatchEvent(
        createTouchEvent(
          "touchend",
          [touch0],
          [touch1],
        ),
      );
    });

    const movedTouch = createTouch(80, 130);
    act(() => {
      canvas.dispatchEvent(
        createTouchEvent("touchmove", [movedTouch]),
      );
    });

    expect(onPanChange).toHaveBeenCalled();
  });
});
