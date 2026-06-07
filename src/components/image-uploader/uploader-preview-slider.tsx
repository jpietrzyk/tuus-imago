import PaintingPreviewSlot from "./painting-preview-slot";
import PaintingSizeHelperOverlay from "./painting-size-helper-overlay";
import type {
  SelectedImageItem,
  SelectedImageMetadata,
} from "./image-uploader";
import type { ImageDisplayProportion } from "./image-proportion-calculator";
import { getPaintingSizeScale, ALL_PAINTING_SIZE_INDICES, type PaintingSizeIndex } from "./painting-size";
import type { CropAdjust } from "./use-crop-adjust";

const MAX_PAINTING_SIZE_SCALE = getPaintingSizeScale(ALL_PAINTING_SIZE_INDICES[ALL_PAINTING_SIZE_INDICES.length - 1]);

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
  selectedPaintingSize?: PaintingSizeIndex;
  paintingAspectRatio?: number;
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
  swipeDisabled = false,
  isEditMode = false,
  previewCropAdjust,
  onCropAdjustChange,
  onTouchStart,
  onTouchEnd,
  onMetadataResolved,
  onSelectEmptySlot,
  onClearSlot,
  selectedPaintingSize = 2,
  paintingAspectRatio = 1.5,
}: UploaderPreviewSliderProps) {
  const previewSlot = (
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
  );

  return (
    <div
      className="painting-preview-slider flex w-full min-w-0 flex-1 items-center justify-center bg-transparent overflow-hidden"
      style={{ "--painting-size-scale": MAX_PAINTING_SIZE_SCALE } as React.CSSProperties}
      data-testid="uploader-preview-slider"
    >
      <PaintingSizeHelperOverlay
        selectedSize={selectedPaintingSize}
        paintingAspectRatio={paintingAspectRatio}
        showBorders
      >
        {previewSlot}
      </PaintingSizeHelperOverlay>
    </div>
  );
}
