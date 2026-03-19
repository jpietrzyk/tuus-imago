import { t } from "@/locales/i18n";
import PaintingPreviewSlot from "./painting-preview-slot";
import SideSlotPreview from "./side-slot-preview";
import type {
  SelectedImageItem,
  SelectedImageMetadata,
} from "./image-uploader";
import type { ImageDisplayProportion } from "./image-proportion-calculator";

interface UploaderPreviewSliderProps {
  slots: Array<SelectedImageItem | null>;
  activeImage: SelectedImageItem | null;
  activeImageIndex: number | null;
  selectedImageMetadata: SelectedImageMetadata | null;
  bestProportion: ImageDisplayProportion | null;
  userSelectedProportion: ImageDisplayProportion;
  previewFrameAspectRatio: number;
  canMovePrevious: boolean;
  canMoveNext: boolean;
  leftSlotIndex: number | null;
  rightSlotIndex: number | null;
  leftSlotImage: SelectedImageItem | null;
  rightSlotImage: SelectedImageItem | null;
  onSelectSlot: (index: number) => void;
  onRemoveActiveImage: () => void;
  onTouchStart: (event: React.TouchEvent<HTMLDivElement>) => void;
  onTouchEnd: (event: React.TouchEvent<HTMLDivElement>) => void;
  onMetadataResolved: (args: {
    metadata: SelectedImageMetadata;
    nextDisplayImageProportion: ImageDisplayProportion;
    shouldAutoSelectOptimalProportion: boolean;
  }) => void;
}

export default function UploaderPreviewSlider({
  slots,
  activeImage,
  activeImageIndex,
  selectedImageMetadata,
  bestProportion,
  userSelectedProportion,
  previewFrameAspectRatio,
  canMovePrevious,
  canMoveNext,
  leftSlotIndex,
  rightSlotIndex,
  leftSlotImage,
  rightSlotImage,
  onSelectSlot,
  onRemoveActiveImage,
  onTouchStart,
  onTouchEnd,
  onMetadataResolved,
}: UploaderPreviewSliderProps) {
  return (
    <div className="flex w-full min-w-0 flex-1 flex-col items-center justify-center gap-5 min-h-0">
      <div
        className="flex w-full min-w-0 flex-1 items-center justify-center rounded-xl bg-transparent overflow-hidden"
        data-testid="uploader-preview-slider"
      >
        <SideSlotPreview
          position="left"
          slotIndex={leftSlotIndex}
          image={leftSlotImage}
          previewFrameAspectRatio={previewFrameAspectRatio}
          selectedProportion={userSelectedProportion}
          isNavigable={canMovePrevious}
          onSelectSlot={onSelectSlot}
        />

        <PaintingPreviewSlot
          selectedImage={activeImage}
          activeSlotIndex={activeImageIndex}
          selectedImageMetadata={selectedImageMetadata}
          bestProportion={bestProportion}
          userSelectedProportion={userSelectedProportion}
          previewFrameAspectRatio={previewFrameAspectRatio}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onRemoveImage={onRemoveActiveImage}
          onMetadataResolved={onMetadataResolved}
        />

        <SideSlotPreview
          position="right"
          slotIndex={rightSlotIndex}
          image={rightSlotImage}
          previewFrameAspectRatio={previewFrameAspectRatio}
          selectedProportion={userSelectedProportion}
          isNavigable={canMoveNext}
          onSelectSlot={onSelectSlot}
        />
      </div>

      <div
        className="inline-flex items-center justify-center gap-2 rounded-full border border-border/70 bg-muted/55 px-3 py-1.5 shadow-sm backdrop-blur-sm"
        aria-label="Preview slot navigation"
        data-testid="uploader-slot-dots"
      >
        {slots.map((slot, index) => {
          const isActive = activeImageIndex === index;

          return (
            <button
              key={index}
              type="button"
              onClick={() => onSelectSlot(index)}
              aria-pressed={isActive}
              aria-label={
                slot
                  ? t("uploader.selectImageSlot", {
                      index: String(index + 1),
                    })
                  : t("uploader.addImageSlot", {
                      index: String(index + 1),
                    })
              }
              data-testid={`uploader-slot-dot-${index}`}
              className={`group inline-flex h-5 w-5 items-center justify-center rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                isActive
                  ? "scale-110"
                  : "scale-100 hover:scale-105 active:scale-95"
              }`}
            >
              <span
                className={`block rounded-full transition-all duration-200 ${
                  slot
                    ? isActive
                      ? "h-3 w-3 bg-primary shadow-[0_0_0_5px_rgba(15,23,42,0.12)]"
                      : "h-2.5 w-2.5 bg-foreground/65 group-hover:bg-foreground/80"
                    : isActive
                      ? "h-3 w-3 border border-dashed border-primary bg-primary/20"
                      : "h-2.5 w-2.5 border border-dashed border-muted-foreground/70 bg-background/40"
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
