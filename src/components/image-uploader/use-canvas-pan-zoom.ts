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
}

export function useCanvasPanZoom({
  canvasRef,
  isEditMode,
  zoom,
  panX,
  panY,
  onZoomChange,
  onPanChange,
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

  zoomRef.current = zoom;
  panXRef.current = panX;
  panYRef.current = panY;
  onZoomChangeRef.current = onZoomChange;
  onPanChangeRef.current = onPanChange;

  // Only update panAtDragStartRef when NOT actively dragging.
  // During drag, this ref must stay fixed at the drag-start values
  // so the position calculation (startPan + accumulatedDelta) stays correct.
  useEffect(() => {
    if (!isDraggingRef.current) {
      panAtDragStartRef.current = { panX, panY };
    }
  }, [panX, panY]);

  const clampPan = useCallback(
    (newPanX: number, newPanY: number, currentZoom: number): { panX: number; panY: number } => {
      if (currentZoom <= 1) {
        return { panX: 0, panY: 0 };
      }

      const clampedPanX = Math.max(-1, Math.min(1, newPanX));
      const clampedPanY = Math.max(-1, Math.min(1, newPanY));
      return { panX: clampedPanX, panY: clampedPanY };
    },
    [],
  );

  const clampPanRef = useRef(clampPan);
  clampPanRef.current = clampPan;

  // Main effect only depends on canvasRef and isEditMode.
  // All dynamic values are read from refs inside handlers,
  // so event listeners are NEVER torn down during drag.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isEditMode) {
      return;
    }

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

      const clamped = clampPanRef.current(newPanX, newPanY, zoomRef.current);
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
        onZoomChangeRef.current(newZoom);
        if (newZoom <= 1) {
          onPanChangeRef.current(0, 0);
        }
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

        const clamped = clampPanRef.current(newPanX, newPanY, zoomRef.current);
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
          onZoomChangeRef.current(newZoom);
          if (newZoom <= 1) {
            onPanChangeRef.current(0, 0);
          }
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
  ]);
}
