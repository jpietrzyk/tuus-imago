import { useCallback, useEffect, useRef } from "react";

interface UseSliderSwipeNavigationParams {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  canSwipeLeft?: boolean;
  canSwipeRight?: boolean;
  swipeThreshold?: number;
  animationDurationMs?: number;
  /**
   * Layer that receives the drag translate/scale/opacity. Defaults to the
   * measured frame so the hook still works standalone (tests, simple hosts);
   * the slider passes an inner content layer instead, which keeps the frame
   * itself stationary as the clip window.
   */
  contentRef?: React.RefObject<HTMLDivElement | null>;
  /**
   * Neighbour preview layers parked one frame-width past each edge. While the
   * user drags they slide towards the frame, so the adjacent slot visibly
   * comes into the scene instead of only the current picture moving.
   */
  incomingPrevRef?: React.RefObject<HTMLDivElement | null>;
  incomingNextRef?: React.RefObject<HTMLDivElement | null>;
}

type SwipeAxis = "horizontal" | "vertical" | null;

const AXIS_LOCK_PX = 8;
const EDGE_RESISTANCE = 0.35;
const ENTER_OFFSET_RATIO = 0.4;
const OPACITY_FADE = 0.25;

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
 * Drives the single-preview slider gesture. The active content follows the
 * finger while the user drags horizontally and the neighbouring preview slides
 * in from the matching edge, then either snaps back or swaps to the
 * neighbouring filled slot.
 *
 * All movement is written straight to the DOM so dragging never re-renders the
 * (large) uploader tree.
 */
export const useSliderSwipeNavigation = ({
  onSwipeLeft,
  onSwipeRight,
  canSwipeLeft = true,
  canSwipeRight = true,
  swipeThreshold = 48,
  animationDurationMs = 200,
  contentRef,
  incomingPrevRef,
  incomingNextRef,
}: UseSliderSwipeNavigationParams) => {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const internalContentRef = useRef<HTMLDivElement | null>(null);
  const internalIncomingPrevRef = useRef<HTMLDivElement | null>(null);
  const internalIncomingNextRef = useRef<HTMLDivElement | null>(null);
  const startXRef = useRef<number | null>(null);
  const startYRef = useRef<number | null>(null);
  const axisRef = useRef<SwipeAxis>(null);
  const frameWidthRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const settleTimeoutRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const resolvedContentRef = contentRef ?? internalContentRef;
  const resolvedIncomingPrevRef = incomingPrevRef ?? internalIncomingPrevRef;
  const resolvedIncomingNextRef = incomingNextRef ?? internalIncomingNextRef;

  const getContentElement = useCallback(
    () => resolvedContentRef.current ?? frameRef.current,
    [resolvedContentRef],
  );

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
    const el = getContentElement();
    if (el) {
      el.style.removeProperty("transform");
      el.style.removeProperty("transition");
      el.style.removeProperty("opacity");
    }
    const prev = resolvedIncomingPrevRef.current;
    if (prev) {
      prev.style.transition = "none";
      prev.style.transform = "translateX(-100%)";
    }
    const next = resolvedIncomingNextRef.current;
    if (next) {
      next.style.transition = "none";
      next.style.transform = "translateX(100%)";
    }
  }, [getContentElement, resolvedIncomingNextRef, resolvedIncomingPrevRef]);

  const getEffectiveDuration = useCallback(
    () => (prefersReducedMotion() ? 0 : animationDurationMs),
    [animationDurationMs],
  );

  const applyContent = useCallback(
    (offsetX: number, transition: boolean, opacity: number) => {
      const el = getContentElement();
      if (!el) return;

      const duration = getEffectiveDuration();
      el.style.transition = transition
        ? `transform ${duration}ms cubic-bezier(0.22, 0.61, 0.36, 1), opacity ${duration}ms ease-out`
        : "none";

      const width = frameWidthRef.current || 1;
      const progress = Math.min(1, Math.abs(offsetX) / width);
      // With neighbour previews the content tiles against the incoming panel,
      // so it must keep its full size or a seam shows at the shared edge.
      const hasIncomingPreview = Boolean(
        resolvedIncomingPrevRef.current || resolvedIncomingNextRef.current,
      );
      const scale = hasIncomingPreview ? 1 : 1 - progress * 0.04;
      el.style.transform =
        offsetX === 0 && scale === 1
          ? ""
          : `translateX(${offsetX}px) scale(${scale})`;
      el.style.opacity = String(opacity);
    },
    [
      getContentElement,
      getEffectiveDuration,
      resolvedIncomingNextRef,
      resolvedIncomingPrevRef,
    ],
  );

  // The incoming neighbours tile against the moving content: at rest they sit
  // exactly one frame-width outside each edge and slide to 0 as the content
  // travels a full width, so the pair reads as one continuous filmstrip.
  const applyIncoming = useCallback(
    (offsetX: number, transition: boolean) => {
      const width = frameWidthRef.current || 1;
      const duration = getEffectiveDuration();
      const transitionValue = transition
        ? `transform ${duration}ms cubic-bezier(0.22, 0.61, 0.36, 1)`
        : "none";

      const prev = resolvedIncomingPrevRef.current;
      if (prev) {
        prev.style.transition = transitionValue;
        prev.style.transform = `translateX(${Math.min(0, offsetX - width)}px)`;
      }

      const next = resolvedIncomingNextRef.current;
      if (next) {
        next.style.transition = transitionValue;
        next.style.transform = `translateX(${Math.max(0, offsetX + width)}px)`;
      }
    },
    [getEffectiveDuration, resolvedIncomingNextRef, resolvedIncomingPrevRef],
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
      applyContent(offset, false, 1 - progress * OPACITY_FADE);
      applyIncoming(offset, false);
    },
    [applyContent, applyIncoming, canSwipeLeft, canSwipeRight],
  );

  const settleBack = useCallback(() => {
    isAnimatingRef.current = true;
    clearTimers();
    applyContent(0, true, 1);
    applyIncoming(0, true);
    settleTimeoutRef.current = window.setTimeout(() => {
      clearFrameStyles();
      isAnimatingRef.current = false;
      settleTimeoutRef.current = null;
    }, getEffectiveDuration());
  }, [
    applyContent,
    applyIncoming,
    clearFrameStyles,
    clearTimers,
    getEffectiveDuration,
  ]);

  const animateNavigation = useCallback(
    (direction: 1 | -1, navigate: () => void) => {
      const width =
        frameWidthRef.current ||
        frameRef.current?.getBoundingClientRect().width ||
        320;

      isAnimatingRef.current = true;
      clearTimers();
      applyContent(direction * width, true, 0);
      applyIncoming(direction * width, true);

      settleTimeoutRef.current = window.setTimeout(() => {
        settleTimeoutRef.current = null;
        navigate();

        const hasIncomingLayer = Boolean(
          resolvedIncomingPrevRef.current || resolvedIncomingNextRef.current,
        );

        if (hasIncomingLayer) {
          // The neighbour preview already slid to the frame centre, so after
          // the active slot swaps the same picture is in place. Snap the
          // layers back without a transition to avoid a second slide-in.
          rafRef.current = window.requestAnimationFrame(() => {
            rafRef.current = window.requestAnimationFrame(() => {
              rafRef.current = null;
              clearFrameStyles();
              isAnimatingRef.current = false;
            });
          });
          return;
        }

        // No neighbour preview: park the incoming image just off the opposite
        // edge without a transition, then let it slide into place.
        applyContent(-direction * width * ENTER_OFFSET_RATIO, false, 0);
        rafRef.current = window.requestAnimationFrame(() => {
          rafRef.current = window.requestAnimationFrame(() => {
            rafRef.current = null;
            applyContent(0, true, 1);
            settleTimeoutRef.current = window.setTimeout(() => {
              clearFrameStyles();
              isAnimatingRef.current = false;
              settleTimeoutRef.current = null;
            }, getEffectiveDuration());
          });
        });
      }, getEffectiveDuration());
    },
    [
      applyContent,
      applyIncoming,
      clearFrameStyles,
      clearTimers,
      getEffectiveDuration,
      resolvedIncomingNextRef,
      resolvedIncomingPrevRef,
    ],
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
    contentRef: resolvedContentRef,
    incomingPrevRef: resolvedIncomingPrevRef,
    incomingNextRef: resolvedIncomingNextRef,
  };
};
