import PaintingPreviewSlot from "./painting-preview-slot";
import SideSlotPreview from "./side-slot-preview";
import type {
  SelectedImageItem,
  SelectedImageMetadata,
} from "./image-uploader";
import type { ImageDisplayProportion } from "./image-proportion-calculator";

interface UploaderPreviewSliderProps {
  activeImage: SelectedImageItem | null;
  activeImageIndex: number | null;
  selectedImageMetadata: SelectedImageMetadata | null;
  bestProportion: ImageDisplayProportion | null;
  userSelectedProportion: ImageDisplayProportion;
  previewFrameAspectRatio: number;
  hasMultipleImages: boolean;
  canMovePrevious: boolean;
  canMoveNext: boolean;
  leftSlotIndex: number | null;
  rightSlotIndex: number | null;
  leftSlotImage: SelectedImageItem | null;
  rightSlotImage: SelectedImageItem | null;
  onSelectSlot: (index: number) => void;
  onMovePrevious: () => void;
  onMoveNext: () => void;
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
  activeImage,
  activeImageIndex,
  selectedImageMetadata,
  bestProportion,
  userSelectedProportion,
  previewFrameAspectRatio,
  hasMultipleImages,
  canMovePrevious,
  canMoveNext,
  leftSlotIndex,
  rightSlotIndex,
  leftSlotImage,
  rightSlotImage,
  onSelectSlot,
  onMovePrevious,
  onMoveNext,
  onRemoveActiveImage,
  onTouchStart,
  onTouchEnd,
  onMetadataResolved,
}: UploaderPreviewSliderProps) {
  return (
    <div
      className="flex-1 flex justify-center items-center bg-transparent rounded-lg min-h-0 overflow-visible"
      data-testid="uploader-preview-slider"
    >
      <SideSlotPreview
        position="left"
        slotIndex={leftSlotIndex}
        image={leftSlotImage}
        previewFrameAspectRatio={previewFrameAspectRatio}
        onSelectSlot={onSelectSlot}
      />

      <PaintingPreviewSlot
        selectedImage={activeImage}
        activeSlotIndex={activeImageIndex}
        selectedImageMetadata={selectedImageMetadata}
        bestProportion={bestProportion}
        userSelectedProportion={userSelectedProportion}
        previewFrameAspectRatio={previewFrameAspectRatio}
        hasMultipleImages={hasMultipleImages}
        canMovePrevious={canMovePrevious}
        canMoveNext={canMoveNext}
        onMovePrevious={onMovePrevious}
        onMoveNext={onMoveNext}
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
        onSelectSlot={onSelectSlot}
      />
    </div>
  );
}
