import { useState } from "react";
import { t } from "@/locales/i18n";
import { UploadProgressOverlay } from "@/components/ui/upload-progress-overlay";
import PaintingPreviewSlot from "./painting-preview-slot";
import PaintingSizeHelperOverlay from "./painting-size-helper-overlay";
import { buildPreviewEffectFilter } from "./preview-effect-filter";
import type {
  SelectedImageItem,
  SelectedImageMetadata,
} from "./image-uploader";
import type { ImageDisplayProportion } from "./image-proportion-calculator";
import { getTargetAspectRatio } from "./image-proportion-calculator";
import { getPaintingSizeScale, ALL_PAINTING_SIZE_INDICES, type PaintingSizeIndex } from "./painting-size";
import type { CropAdjust } from "./use-crop-adjust";

const MAX_PAINTING_SIZE_SCALE = getPaintingSizeScale(ALL_PAINTING_SIZE_INDICES[ALL_PAINTING_SIZE_INDICES.length - 1]);

interface TriptychSidePanelProps {
  slotIndex: number;
  image: SelectedImageItem;
  previewUrl: string | null;
  useCloudPreview: boolean;
  previewFrameAspectRatio: number;
  onSelectSlot: (index: number) => void;
}

function TriptychSidePanel({
  slotIndex,
  image,
  previewUrl,
  useCloudPreview,
  previewFrameAspectRatio,
  onSelectSlot,
}: TriptychSidePanelProps) {
  const [confirmedCloudUrl, setConfirmedCloudUrl] = useState<string | null>(
    null,
  );
  const effectivePreviewUrl = previewUrl ?? image.previewUrl;
  const isEffectImageLoading =
    useCloudPreview &&
    effectivePreviewUrl !== null &&
    effectivePreviewUrl !== confirmedCloudUrl;

  return (
    <button
      type="button"
      onClick={() => onSelectSlot(slotIndex)}
      data-testid={`triptych-side-panel-${slotIndex}`}
      aria-label={t("uploader.selectImageSlot", { index: String(slotIndex + 1) })}
      className="group/side-panel relative flex h-full max-h-full shrink-0 items-center justify-center"
    >
      <div
        className="relative h-full w-auto max-w-full overflow-hidden rounded-none border-0 transition-opacity duration-200 ease-out motion-reduce:transition-none opacity-95 hover:opacity-100"
        style={{ aspectRatio: String(previewFrameAspectRatio) }}
      >
        <img
          src={effectivePreviewUrl}
          alt={t("uploader.selectImageSlot", { index: String(slotIndex + 1) })}
          className="h-full w-full object-cover object-center"
          style={{ filter: buildPreviewEffectFilter(image, useCloudPreview) }}
          draggable={false}
          onLoad={() => setConfirmedCloudUrl(effectivePreviewUrl)}
          onError={() => setConfirmedCloudUrl(effectivePreviewUrl)}
        />
        <UploadProgressOverlay
          isVisible={useCloudPreview && isEffectImageLoading}
          progress={0}
          isIndeterminate
          label={t("uploader.applyingEffect")}
        />
      </div>
    </button>
  );
}

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
  slots?: Array<SelectedImageItem | null>;
  onSelectSlot?: (index: number) => void;
  getSlotPreviewUrl?: (image: SelectedImageItem) => string;
  isDesktopTriptych?: boolean;
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
  slots,
  onSelectSlot,
  getSlotPreviewUrl,
  isDesktopTriptych = false,
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

  const showDesktopTriptych =
    isDesktopTriptych &&
    Array.isArray(slots) &&
    slots.length > 0 &&
    typeof onSelectSlot === "function";

  // The triptych packs one size-step tighter than the maximum: the panel box
  // references the second-largest size so neighboring panels touch at that
  // border instead of the outermost one.
  const triptychReferenceScale = getPaintingSizeScale(
    ALL_PAINTING_SIZE_INDICES[ALL_PAINTING_SIZE_INDICES.length - 3],
  );
  const selectedScaleRelative =
    getPaintingSizeScale(selectedPaintingSize) / triptychReferenceScale;

  if (showDesktopTriptych) {
    return (
      <div
        className="painting-preview-slider flex w-full min-w-0 flex-1 items-center justify-center bg-transparent overflow-hidden"
        style={{ "--painting-size-scale": MAX_PAINTING_SIZE_SCALE } as React.CSSProperties}
        data-testid="uploader-preview-slider"
        data-triptych-layout="desktop"
      >
        {slots!.map((slot, index) => {
          const isActive = index === activeImageIndex;
          const panelAspectRatio = isActive
            ? previewFrameAspectRatio
            : slot
              ? getTargetAspectRatio(slot.displayImageProportion)
              : paintingAspectRatio;
          const content = isActive ? (
            previewSlot
          ) : slot ? (
            <TriptychSidePanel
              slotIndex={index}
              image={slot}
              previewUrl={
                getSlotPreviewUrl ? getSlotPreviewUrl(slot) : null
              }
              useCloudPreview={!!slot.uploadedAsset}
              previewFrameAspectRatio={panelAspectRatio}
              onSelectSlot={onSelectSlot!}
            />
          ) : null;

          return (
            <div
              key={index}
              className="relative h-full shrink-0 overflow-hidden"
              style={{ aspectRatio: String(panelAspectRatio) }}
            >
              {ALL_PAINTING_SIZE_INDICES.map((sizeIdx) => {
                const scale = getPaintingSizeScale(sizeIdx);
                const relativeScale = scale / triptychReferenceScale;
                const isSelected = sizeIdx === selectedPaintingSize;

                return (
                  <div
                    key={sizeIdx}
                    className="pointer-events-none absolute inset-0 m-auto"
                    style={{
                      width: `${relativeScale * 100}%`,
                      height: `${relativeScale * 100}%`,
                      border: isSelected
                        ? "2px solid rgba(0, 0, 0, 0.5)"
                        : "1.5px dashed rgba(0, 0, 0, 0.2)",
                    }}
                  />
                );
              })}
              <div
                className="absolute inset-0 m-auto flex items-center justify-center"
                style={{
                  width: `${selectedScaleRelative * 100}%`,
                  height: `${selectedScaleRelative * 100}%`,
                }}
              >
                {content}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

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
