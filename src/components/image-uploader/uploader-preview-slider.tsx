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
  isUploadOverlayVisible?: boolean;
  uploadProgress?: number;
  uploadProgressLabel?: string;
  uploadingSlotIndex?: number | null;
  canMovePrevious: boolean;
  canMoveNext: boolean;
  leftSlotIndex: number | null;
  rightSlotIndex: number | null;
  leftSlotImage: SelectedImageItem | null;
  rightSlotImage: SelectedImageItem | null;
  onSelectSlot: (index: number) => void;
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
  isUploadOverlayVisible = false,
  uploadProgress = 0,
  uploadProgressLabel,
  uploadingSlotIndex = null,
  canMovePrevious,
  canMoveNext,
  leftSlotIndex,
  rightSlotIndex,
  leftSlotImage,
  rightSlotImage,
  onSelectSlot,
  onTouchStart,
  onTouchEnd,
  onMetadataResolved,
}: UploaderPreviewSliderProps) {
  return (
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
        isUploadOverlayVisible={isUploadOverlayVisible}
        uploadProgress={uploadProgress}
        uploadProgressLabel={uploadProgressLabel}
        uploadingSlotIndex={uploadingSlotIndex}
        onSelectSlot={onSelectSlot}
      />

      <PaintingPreviewSlot
        selectedImage={activeImage}
        activeSlotIndex={activeImageIndex}
        selectedImageMetadata={selectedImageMetadata}
        bestProportion={bestProportion}
        userSelectedProportion={userSelectedProportion}
        previewFrameAspectRatio={previewFrameAspectRatio}
        isUploadOverlayVisible={isUploadOverlayVisible}
        uploadProgress={uploadProgress}
        uploadProgressLabel={uploadProgressLabel}
        uploadingSlotIndex={uploadingSlotIndex}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onMetadataResolved={onMetadataResolved}
      />

      <SideSlotPreview
        position="right"
        slotIndex={rightSlotIndex}
        image={rightSlotImage}
        previewFrameAspectRatio={previewFrameAspectRatio}
        selectedProportion={userSelectedProportion}
        isNavigable={canMoveNext}
        isUploadOverlayVisible={isUploadOverlayVisible}
        uploadProgress={uploadProgress}
        uploadProgressLabel={uploadProgressLabel}
        uploadingSlotIndex={uploadingSlotIndex}
        onSelectSlot={onSelectSlot}
      />
    </div>
  );
}
