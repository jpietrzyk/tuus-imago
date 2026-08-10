import { useEffect, useRef, useCallback } from "react";

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.05;

interface UseCanvasPanZoomParams {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isEditMode: boolean;
  zoom: number;
  panX: number;
  panY: number;
  onZoomChange: (zoom: number) => void;
  onPanChange: (panX: number, panY: number) => void;
  /** Ref to a function that triggers an immediate canvas redraw with the given crop adjust. */
  requestDrawRef?: React.MutableRefObject<(cropAdjust: { zoom: number; panX: number; panY: number }) => void>;
  /** Whether the source overflows the base crop on each axis, enabling drag-to-reveal at zoom 1. */
  canPanX?: boolean;
  canPanY?: boolean;
}

export function useCanvasPanZoom({
  canvasRef,
  isEditMode,
  zoom,
  panX,
  panY,
  onZoomChange,
  onPanChange,
  requestDrawRef,
  canPanX = false,
  canPanY = false,
}: UseCanvasPanZoomParams) {
  const isDraggingRef = useRef(false);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
  const lastPinchDistRef = useRef<number | null>(null);
  const panAtDragStartRef = useRef({ panX, panY });

  // Keep latest values in refs so event handlers never go stale
  // without requiring effect re-registration.
  const zoomRef = useRef(zoom);
  const panXRef = useRef(panX);
  const panYRef = useRef(panY);
  const onZoomChangeRef = useRef(onZoomChange);
  const onPanChangeRef = useRef(onPanChange);
  const canPanXRef = useRef(canPanX);
  const canPanYRef = useRef(canPanY);

  const clampPan = useCallback(
    (newPanX: number, newPanY: number, currentZoom: number, allowX: boolean, allowY: boolean): { panX: number; panY: number } => {
      const xEnabled = currentZoom > 1 || allowX;
      const yEnabled = currentZoom > 1 || allowY;
      return {
        panX: xEnabled ? Math.max(-1, Math.min(1, newPanX)) : 0,
        panY: yEnabled ? Math.max(-1, Math.min(1, newPanY)) : 0,
      };
    },
    [],
  );

  const clampPanRef = useRef(clampPan);

  // Sync props → refs inside useEffect to satisfy react-hooks/refs rule.
  // These run after every render, keeping refs current for event handlers.
  useEffect(() => {
    zoomRef.current = zoom;
    panXRef.current = panX;
    panYRef.current = panY;
    onZoomChangeRef.current = onZoomChange;
    onPanChangeRef.current = onPanChange;
    canPanXRef.current = canPanX;
    canPanYRef.current = canPanY;
    clampPanRef.current = clampPan;
  });

  // Only update panAtDragStartRef when NOT actively dragging.
  // During drag, this ref must stay fixed at the drag-start values
  // so the position calculation (startPan + accumulatedDelta) stays correct.
  useEffect(() => {
    if (!isDraggingRef.current) {
      panAtDragStartRef.current = { panX, panY };
    }
  }, [panX, panY]);

  // Main effect only depends on canvasRef and isEditMode.
  // All dynamic values are read from refs inside handlers,
  // so event listeners are NEVER torn down during drag/zoom.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isEditMode) {
      return;
    }

    // --- Zoom RAF throttle ---
    // Accumulate zoom changes between frames. Only commit to React state
    // once per animation frame. This prevents the full React render cascade
    // from running on every single wheel tick.
    let zoomRafId: number | null = null;
    let pendingZoomCommit: number | null = null;

    const commitZoom = () => {
      zoomRafId = null;
      if (pendingZoomCommit !== null) {
        const zoomToCommit = pendingZoomCommit;
        pendingZoomCommit = null;
        onZoomChangeRef.current(zoomToCommit);
        if (zoomToCommit <= 1) {
          // Only zero pan on axes that have no overflow room at zoom 1.
          onPanChangeRef.current(
            canPanXRef.current ? panXRef.current : 0,
            canPanYRef.current ? panYRef.current : 0,
          );
        }
      }
    };

    const scheduleZoomCommit = (newZoom: number) => {
      pendingZoomCommit = newZoom;
      if (zoomRafId === null) {
        zoomRafId = window.requestAnimationFrame(commitZoom);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      isDraggingRef.current = true;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
      panAtDragStartRef.current = { panX: panXRef.current, panY: panYRef.current };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !lastPointerRef.current) return;

      const dx = e.clientX - lastPointerRef.current.x;
      const dy = e.clientY - lastPointerRef.current.y;

      const elementWidth = canvas.clientWidth || 1;
      const elementHeight = canvas.clientHeight || 1;

      const panDeltaX = -dx / elementWidth * 2;
      const panDeltaY = -dy / elementHeight * 2;

      const newPanX = panAtDragStartRef.current.panX + panDeltaX;
      const newPanY = panAtDragStartRef.current.panY + panDeltaY;

      const clamped = clampPanRef.current(newPanX, newPanY, zoomRef.current, canPanXRef.current, canPanYRef.current);
      onPanChangeRef.current(clamped.panX, clamped.panY);
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      lastPointerRef.current = null;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const currentZoom = zoomRef.current;
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, currentZoom + delta));
      if (newZoom !== currentZoom) {
        // Optimistically update the ref so consecutive wheel events in the
        // same frame accumulate correctly instead of reading a stale value.
        zoomRef.current = newZoom;

        // Draw the canvas immediately for zero-latency visual feedback.
        // This bypasses React's render cycle entirely.
        if (requestDrawRef) {
          requestDrawRef.current({ zoom: newZoom, panX: panXRef.current, panY: panYRef.current });
        }

        // Throttle React state commit to once per animation frame.
        scheduleZoomCommit(newZoom);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();

      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        lastPointerRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
        panAtDragStartRef.current = { panX: panXRef.current, panY: panYRef.current };
      } else if (e.touches.length === 2) {
        isDraggingRef.current = false;
        lastPointerRef.current = null;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastPinchDistRef.current = Math.sqrt(dx * dx + dy * dy);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();

      if (e.touches.length === 1 && isDraggingRef.current && lastPointerRef.current) {
        const dx = e.touches[0].clientX - lastPointerRef.current.x;
        const dy = e.touches[0].clientY - lastPointerRef.current.y;

        const elementWidth = canvas.clientWidth || 1;
        const elementHeight = canvas.clientHeight || 1;

        const panDeltaX = -dx / elementWidth * 2;
        const panDeltaY = -dy / elementHeight * 2;

        const newPanX = panAtDragStartRef.current.panX + panDeltaX;
        const newPanY = panAtDragStartRef.current.panY + panDeltaY;

        const clamped = clampPanRef.current(newPanX, newPanY, zoomRef.current, canPanXRef.current, canPanYRef.current);
        onPanChangeRef.current(clamped.panX, clamped.panY);
      } else if (e.touches.length === 2 && lastPinchDistRef.current !== null) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const delta = (dist - lastPinchDistRef.current) * 0.01;
        lastPinchDistRef.current = dist;

        const currentZoom = zoomRef.current;
        const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, currentZoom + delta));
        if (newZoom !== currentZoom) {
          zoomRef.current = newZoom;

          if (requestDrawRef) {
            requestDrawRef.current({ zoom: newZoom, panX: panXRef.current, panY: panYRef.current });
          }

          scheduleZoomCommit(newZoom);
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        isDraggingRef.current = false;
        lastPointerRef.current = null;
        lastPinchDistRef.current = null;
      } else if (e.touches.length === 1) {
        lastPinchDistRef.current = null;
        isDraggingRef.current = true;
        lastPointerRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
        panAtDragStartRef.current = { panX: panXRef.current, panY: panYRef.current };
      }
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", handleTouchEnd, { passive: false });

    return () => {
      // Cancel any pending zoom commit
      if (zoomRafId !== null) {
        window.cancelAnimationFrame(zoomRafId);
        // Flush the last pending zoom so it's not lost
        if (pendingZoomCommit !== null) {
          onZoomChangeRef.current(pendingZoomCommit);
        }
      }

      canvas.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("wheel", handleWheel);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
    };
  }, [
    canvasRef,
    isEditMode,
    requestDrawRef,
  ]);
}
