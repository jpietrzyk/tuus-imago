import { useCallback, useRef } from "react";

interface UseSliderSwipeNavigationParams {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  swipeThreshold?: number;
}

export const useSliderSwipeNavigation = ({
  onSwipeLeft,
  onSwipeRight,
  swipeThreshold = 30,
}: UseSliderSwipeNavigationParams) => {
  const touchStartXRef = useRef<number | null>(null);

  const onTouchStart = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = event.touches[0]?.clientX ?? null;
  }, []);

  const onTouchEnd = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      const startX = touchStartXRef.current;
      const endX = event.changedTouches[0]?.clientX;

      touchStartXRef.current = null;

      if (typeof startX !== "number" || typeof endX !== "number") {
        return;
      }

      const deltaX = endX - startX;

      if (deltaX <= -swipeThreshold) {
        onSwipeLeft();
        return;
      }

      if (deltaX >= swipeThreshold) {
        onSwipeRight();
      }
    },
    [onSwipeLeft, onSwipeRight, swipeThreshold],
  );

  return {
    onTouchStart,
    onTouchEnd,
  };
};
