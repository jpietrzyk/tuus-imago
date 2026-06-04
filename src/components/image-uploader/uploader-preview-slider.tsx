import PaintingPreviewSlot from "./painting-preview-slot";
import PaintingSizeHelperOverlay from "./painting-size-helper-overlay";
import type {
  SelectedImageItem,
  SelectedImageMetadata,
} from "./image-uploader";
import type { ImageDisplayProportion } from "./image-proportion-calculator";
import { getPaintingSizeScale, type PaintingSizeIndex } from "./painting-size";
import type { CropAdjust } from "./use-crop-adjust";

const MAX_PAINTING_SIZE_SCALE = getPaintingSizeScale(3);

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
  paintingSizeScale?: number;
  showPaintingSizeHelper?: boolean;
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
  canMovePrevious: _canMovePrevious,
  canMoveNext: _canMoveNext,
  leftSlotIndex: _leftSlotIndex,
  rightSlotIndex: _rightSlotIndex,
  leftSlotImage: _leftSlotImage,
  leftSlotPreviewUrl: _leftSlotPreviewUrl,
  rightSlotImage: _rightSlotImage,
  rightSlotPreviewUrl: _rightSlotPreviewUrl,
  onSelectSlot: _onSelectSlot,
  swipeDisabled = false,
  isEditMode = false,
  previewCropAdjust,
  onCropAdjustChange,
  onTouchStart,
  onTouchEnd,
  onMetadataResolved,
  onSelectEmptySlot,
  onClearSlot,
  paintingSizeScale = 1,
  showPaintingSizeHelper = false,
  selectedPaintingSize = 2,
  paintingAspectRatio = 1.5,
}: UploaderPreviewSliderProps) {
  const effectiveScale = showPaintingSizeHelper
    ? MAX_PAINTING_SIZE_SCALE
    : paintingSizeScale;

  return (
    <div
      className="painting-preview-slider flex w-full min-w-0 flex-1 items-center justify-center bg-transparent overflow-hidden"
      style={{ "--painting-size-scale": effectiveScale } as React.CSSProperties}
      data-testid="uploader-preview-slider"
    >
      <PaintingSizeHelperOverlay
        selectedSize={selectedPaintingSize}
        paintingAspectRatio={paintingAspectRatio}
        showBorders={showPaintingSizeHelper}
      >
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
      </PaintingSizeHelperOverlay>
    </div>
  );
}
