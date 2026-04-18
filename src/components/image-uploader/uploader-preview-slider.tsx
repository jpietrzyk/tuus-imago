import PaintingPreviewSlot from "./painting-preview-slot";
import SideSlotPreview from "./side-slot-preview";
import type {
  SelectedImageItem,
  SelectedImageMetadata,
} from "./image-uploader";
import type { ImageDisplayProportion } from "./image-proportion-calculator";
import type { CropAdjust } from "./use-crop-adjust";

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
  isEffectUploading?: boolean;
  canMovePrevious: boolean;
  canMoveNext: boolean;
  leftSlotIndex: number | null;
  rightSlotIndex: number | null;
  leftSlotImage: SelectedImageItem | null;
  leftSlotPreviewUrl?: string | null;
  rightSlotImage: SelectedImageItem | null;
  rightSlotPreviewUrl?: string | null;
  onSelectSlot: (index: number) => void;
  swipeDisabled?: boolean;
  isEditMode?: boolean;
  previewCropAdjust?: CropAdjust;
  onCropAdjustChange?: (adjust: CropAdjust | undefined) => void;
  onTouchStart: (event: React.TouchEvent<HTMLDivElement>) => void;
  onTouchEnd: (event: React.TouchEvent<HTMLDivElement>) => void;
  onMetadataResolved: (args: {
    metadata: SelectedImageMetadata;
    nextDisplayImageProportion: ImageDisplayProportion;
    shouldAutoSelectOptimalProportion: boolean;
  }) => void;
  onSelectEmptySlot?: () => void;
  onClearSlot?: () => void;
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
  isEffectUploading = false,
  canMovePrevious,
  canMoveNext,
  leftSlotIndex,
  rightSlotIndex,
  leftSlotImage,
  leftSlotPreviewUrl,
  rightSlotImage,
  rightSlotPreviewUrl,
  onSelectSlot,
  swipeDisabled = false,
  isEditMode = false,
  previewCropAdjust,
  onCropAdjustChange,
  onTouchStart,
  onTouchEnd,
  onMetadataResolved,
  onSelectEmptySlot,
  onClearSlot,
}: UploaderPreviewSliderProps) {
  return (
    <div
      className="flex w-full min-w-0 flex-1 items-center justify-center gap-3 md:gap-4 lg:gap-5 rounded-xl bg-transparent overflow-hidden max-h-[25vh] md:max-h-[42vh] lg:max-h-[45vh] xl:max-h-[50vh]"
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
        disabled={isEditMode}
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
        isEffectUploading={isEffectUploading}
        swipeDisabled={swipeDisabled}
        isEditMode={isEditMode}
        previewCropAdjust={previewCropAdjust}
        onCropAdjustChange={onCropAdjustChange}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onMetadataResolved={onMetadataResolved}
        onSelectEmptySlot={onSelectEmptySlot}
        onClearSlot={onClearSlot}
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
        disabled={isEditMode}
        onSelectSlot={onSelectSlot}
      />
    </div>
  );
}
