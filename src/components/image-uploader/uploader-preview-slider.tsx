import PaintingPreviewSlot from "./painting-preview-slot";
import SideSlotPreview from "./side-slot-preview";
import type {
  SelectedImageItem,
  SelectedImageMetadata,
} from "./image-uploader";
import type { ImageDisplayProportion } from "./image-proportion-calculator";

interface UploaderPreviewSliderProps {
  activeImage: SelectedImageItem | null;
  activeImagePreviewUrl?: string | null;
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
  leftSlotPreviewUrl?: string | null;
  rightSlotImage: SelectedImageItem | null;
  rightSlotPreviewUrl?: string | null;
  onSelectSlot: (index: number) => void;
  onTouchStart: (event: React.TouchEvent<HTMLDivElement>) => void;
  onTouchEnd: (event: React.TouchEvent<HTMLDivElement>) => void;
  onMetadataResolved: (args: {
    metadata: SelectedImageMetadata;
    nextDisplayImageProportion: ImageDisplayProportion;
    shouldAutoSelectOptimalProportion: boolean;
  }) => void;
  onSelectEmptySlot?: () => void;
}

export default function UploaderPreviewSlider({
  activeImage,
  activeImagePreviewUrl,
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
  leftSlotPreviewUrl,
  rightSlotImage,
  rightSlotPreviewUrl,
  onSelectSlot,
  onTouchStart,
  onTouchEnd,
  onMetadataResolved,
  onSelectEmptySlot,
}: UploaderPreviewSliderProps) {
  return (
    <div
      className="flex w-full min-w-0 flex-1 items-center justify-center gap-3 md:gap-4 lg:gap-5 rounded-xl bg-transparent overflow-hidden"
      data-testid="uploader-preview-slider"
    >
      <SideSlotPreview
        position="left"
        slotIndex={leftSlotIndex}
        image={leftSlotImage}
        previewUrl={leftSlotPreviewUrl ?? leftSlotImage?.previewUrl ?? null}
        useCloudPreview={!!leftSlotImage?.uploadedAsset}
        isNavigable={canMovePrevious}
        isUploadOverlayVisible={isUploadOverlayVisible}
        uploadProgress={uploadProgress}
        uploadProgressLabel={uploadProgressLabel}
        uploadingSlotIndex={uploadingSlotIndex}
        onSelectSlot={onSelectSlot}
      />

      <PaintingPreviewSlot
        selectedImage={activeImage}
        previewUrl={activeImagePreviewUrl ?? activeImage?.previewUrl ?? null}
        useCloudPreview={!!activeImage?.uploadedAsset}
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
        onSelectEmptySlot={onSelectEmptySlot}
      />

      <SideSlotPreview
        position="right"
        slotIndex={rightSlotIndex}
        image={rightSlotImage}
        previewUrl={rightSlotPreviewUrl ?? rightSlotImage?.previewUrl ?? null}
        useCloudPreview={!!rightSlotImage?.uploadedAsset}
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
