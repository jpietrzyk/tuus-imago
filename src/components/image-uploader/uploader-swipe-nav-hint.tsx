import { ChevronLeft, ChevronRight, Hand } from "lucide-react";
import { t } from "@/locales/i18n";

export interface SwipeNavHintProps {
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  showHint: boolean;
}

export function UploaderSwipeNavHint({
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
  showHint,
}: SwipeNavHintProps) {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-10"
      data-testid="uploader-swipe-nav-hint"
    >
      {hasPrevious && (
        <button
          type="button"
          onClick={onPrevious}
          aria-label={t("uploader.previousImage")}
          data-testid="uploader-swipe-nav-previous"
          className="pointer-events-auto absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border/70 bg-background/85 text-foreground shadow-md backdrop-blur-sm transition-transform duration-150 hover:bg-background active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
      )}
      {hasNext && (
        <button
          type="button"
          onClick={onNext}
          aria-label={t("uploader.nextImage")}
          data-testid="uploader-swipe-nav-next"
          className="pointer-events-auto absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border/70 bg-background/85 text-foreground shadow-md backdrop-blur-sm transition-transform duration-150 hover:bg-background active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      )}
      {showHint && (
        <div
          role="status"
          aria-live="polite"
          className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-border/70 bg-background/85 px-3.5 py-1.5 text-xs font-medium text-foreground shadow-md backdrop-blur-sm"
          data-testid="uploader-swipe-hint-pill"
        >
          <Hand
            className="h-4 w-4 animate-[swipe-nudge_1.6s_ease-in-out_infinite] motion-reduce:animate-none"
            aria-hidden="true"
          />
          {t("uploader.swipeHint")}
        </div>
      )}
    </div>
  );
}

export default UploaderSwipeNavHint;
