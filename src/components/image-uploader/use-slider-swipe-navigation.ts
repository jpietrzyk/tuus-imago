import { useCallback, useEffect, useRef } from "react";

interface UseSliderSwipeNavigationParams {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  canSwipeLeft?: boolean;
  canSwipeRight?: boolean;
  swipeThreshold?: number;
  animationDurationMs?: number;
}

type SwipeAxis = "horizontal" | "vertical" | null;

const AXIS_LOCK_PX = 8;
const EDGE_RESISTANCE = 0.35;
const ENTER_OFFSET_RATIO = 0.4;
const OPACITY_FADE = 0.45;

const prefersReducedMotion = (() => {
  let query: MediaQueryList | null = null;
  return () => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return false;
    }
    if (query === null) {
      query = window.matchMedia("(prefers-reduced-motion: reduce)");
    }
    return query.matches;
  };
})();

/**
 * Drives the single-preview slider gesture. The active frame follows the
 * finger while the user drags horizontally, then either snaps back or slides
 * out and swaps to the neighbouring filled slot.
 *
 * All movement is written straight to the frame element so dragging never
 * re-renders the (large) uploader tree.
 */
export const useSliderSwipeNavigation = ({
  onSwipeLeft,
  onSwipeRight,
  canSwipeLeft = true,
  canSwipeRight = true,
  swipeThreshold = 48,
  animationDurationMs = 200,
}: UseSliderSwipeNavigationParams) => {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const startXRef = useRef<number | null>(null);
  const startYRef = useRef<number | null>(null);
  const axisRef = useRef<SwipeAxis>(null);
  const frameWidthRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const settleTimeoutRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (settleTimeoutRef.current !== null) {
      window.clearTimeout(settleTimeoutRef.current);
      settleTimeoutRef.current = null;
    }
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const clearFrameStyles = useCallback(() => {
    const el = frameRef.current;
    if (!el) return;
    el.style.removeProperty("transform");
    el.style.removeProperty("transition");
    el.style.removeProperty("opacity");
  }, []);

  const getEffectiveDuration = useCallback(
    () => (prefersReducedMotion() ? 0 : animationDurationMs),
    [animationDurationMs],
  );

  const applyFrame = useCallback(
    (offsetX: number, transition: boolean, opacity: number) => {
      const el = frameRef.current;
      if (!el) return;

      const duration = getEffectiveDuration();
      el.style.transition = transition
        ? `transform ${duration}ms cubic-bezier(0.22, 0.61, 0.36, 1), opacity ${duration}ms ease-out`
        : "none";

      const width = frameWidthRef.current || 1;
      const progress = Math.min(1, Math.abs(offsetX) / width);
      const scale = 1 - progress * 0.04;
      el.style.transform =
        offsetX === 0 && scale === 1
          ? ""
          : `translateX(${offsetX}px) scale(${scale})`;
      el.style.opacity = String(opacity);
    },
    [getEffectiveDuration],
  );

  useEffect(() => clearTimers, [clearTimers]);

  const onTouchStart = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      if (isAnimatingRef.current) return;
      if (!canSwipeLeft && !canSwipeRight) return;

      const touch = event.touches[0];
      if (!touch) return;

      clearTimers();
      startXRef.current = touch.clientX;
      startYRef.current =
        typeof touch.clientY === "number" ? touch.clientY : null;
      axisRef.current = null;
      frameWidthRef.current =
        frameRef.current?.getBoundingClientRect().width ?? 0;
    },
    [canSwipeLeft, canSwipeRight, clearTimers],
  );

  const onTouchMove = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      if (isAnimatingRef.current) return;

      const startX = startXRef.current;
      const startY = startYRef.current;
      const touch = event.touches[0];
      if (startX === null || !touch) return;

      const deltaX = touch.clientX - startX;
      const deltaY =
        startY === null ? 0 : (touch.clientY ?? startY) - startY;

      if (axisRef.current === null) {
        if (
          Math.abs(deltaX) < AXIS_LOCK_PX &&
          Math.abs(deltaY) < AXIS_LOCK_PX
        ) {
          return;
        }
        axisRef.current =
          Math.abs(deltaX) > Math.abs(deltaY) ? "horizontal" : "vertical";
      }

      if (axisRef.current === "vertical") return;

      let offset = deltaX;
      if ((offset < 0 && !canSwipeLeft) || (offset > 0 && !canSwipeRight)) {
        offset *= EDGE_RESISTANCE;
      }

      const width = frameWidthRef.current || 1;
      const progress = Math.min(1, Math.abs(offset) / width);
      applyFrame(offset, false, 1 - progress * OPACITY_FADE);
    },
    [applyFrame, canSwipeLeft, canSwipeRight],
  );

  const settleBack = useCallback(() => {
    isAnimatingRef.current = true;
    clearTimers();
    applyFrame(0, true, 1);
    settleTimeoutRef.current = window.setTimeout(() => {
      clearFrameStyles();
      isAnimatingRef.current = false;
      settleTimeoutRef.current = null;
    }, getEffectiveDuration());
  }, [applyFrame, clearFrameStyles, clearTimers, getEffectiveDuration]);

  const animateNavigation = useCallback(
    (direction: 1 | -1, navigate: () => void) => {
      const width =
        frameWidthRef.current ||
        frameRef.current?.getBoundingClientRect().width ||
        320;

      isAnimatingRef.current = true;
      clearTimers();
      applyFrame(direction * width, true, 0);

      settleTimeoutRef.current = window.setTimeout(() => {
        settleTimeoutRef.current = null;
        navigate();

        // Park the incoming image just off the opposite edge without a
        // transition, then let it slide into place.
        applyFrame(-direction * width * ENTER_OFFSET_RATIO, false, 0);
        rafRef.current = window.requestAnimationFrame(() => {
          rafRef.current = window.requestAnimationFrame(() => {
            rafRef.current = null;
            applyFrame(0, true, 1);
            settleTimeoutRef.current = window.setTimeout(() => {
              clearFrameStyles();
              isAnimatingRef.current = false;
              settleTimeoutRef.current = null;
            }, getEffectiveDuration());
          });
        });
      }, getEffectiveDuration());
    },
    [applyFrame, clearFrameStyles, clearTimers, getEffectiveDuration],
  );

  const onTouchEnd = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      const startX = startXRef.current;
      const startY = startYRef.current;
      const axis = axisRef.current;
      startXRef.current = null;
      startYRef.current = null;
      axisRef.current = null;

      if (isAnimatingRef.current) return;

      const touch = event.changedTouches[0];
      if (startX === null || !touch) return;

      const deltaX = touch.clientX - startX;
      const deltaY =
        startY === null ? 0 : (touch.clientY ?? startY) - startY;
      const resolvedAxis =
        axis ?? (Math.abs(deltaX) >= Math.abs(deltaY) ? "horizontal" : "vertical");

      if (resolvedAxis !== "horizontal") return;

      const width = frameWidthRef.current || 1;
      const threshold = Math.min(
        swipeThreshold,
        Math.max(24, width * 0.22),
      );

      if (deltaX <= -threshold && canSwipeLeft) {
        animateNavigation(-1, onSwipeLeft);
        return;
      }

      if (deltaX >= threshold && canSwipeRight) {
        animateNavigation(1, onSwipeRight);
        return;
      }

      settleBack();
    },
    [
      animateNavigation,
      canSwipeLeft,
      canSwipeRight,
      onSwipeLeft,
      onSwipeRight,
      settleBack,
      swipeThreshold,
    ],
  );

  const onTouchCancel = useCallback(() => {
    startXRef.current = null;
    startYRef.current = null;
    axisRef.current = null;
    clearTimers();
    isAnimatingRef.current = false;
    clearFrameStyles();
  }, [clearFrameStyles, clearTimers]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onTouchCancel,
    frameRef,
  };
};
