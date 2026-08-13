import { useEffect, useRef, useState } from "react";
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
import { calculateMaxCenteredCrop, getTargetAspectRatio } from "./image-proportion-calculator";
import { getPaintingSizeScale, getPaintingSizeIndices, ALL_PAINTING_SIZE_INDICES, type PaintingShape, type PaintingSizeIndex } from "./painting-size";
import { adjustCropForZoomPan, type CropAdjust } from "./use-crop-adjust";
import { resolveTriptychSlotCrop } from "./triptych-window-crop";

const MAX_PAINTING_SIZE_SCALE = getPaintingSizeScale(ALL_PAINTING_SIZE_INDICES[ALL_PAINTING_SIZE_INDICES.length - 1]);
const TRIPTYCH_PANEL_COUNT = 3;

interface TriptychSidePanelProps {
  slotIndex: number;
  image: SelectedImageItem;
  previewUrl: string | null;
  useCloudPreview: boolean;
  previewFrameAspectRatio: number;
  onSelectSlot: (index: number) => void;
  isLinked: boolean;
}

/**
 * Compute the inline sizing/positioning for a triptych side-panel <img> so it
 * mirrors the active slot's zoom/pan crop.
 *
 * The image is sized larger than the (overflow-hidden) frame and positioned so
 * the adjusted crop region exactly fills the frame; the surrounding source
 * pixels overflow and are clipped by the frame. Because the <img> is always at
 * least as large as the frame, panning shifts the source within the fixed clip
 * window and never exposes an empty gap — unlike translating an `object-cover`
 * element, which drags its own clip box along and leaves the frame blank (the
 * previous behaviour that made the left/right panels vanish while dragging).
 *
 * Cloud previews already encode the crop/transform server-side, so the source
 * simply fills the frame centered. Rotation/flip are applied as a transform on
 * the sized image (cloud previews encode them too, so they are skipped there).
 */
const buildSidePanelCropStyle = (
  image: SelectedImageItem,
  useCloudPreview: boolean,
  fallbackDimensions?: { width: number; height: number } | null,
): {
  width: string;
  height: string;
  top: string;
  left: string;
  transform?: string;
} => {
  if (useCloudPreview) {
    return { width: "100%", height: "100%", top: "0%", left: "0%" };
  }

  let width = "100%";
  let height = "100%";
  let top = "0%";
  let left = "0%";

  const metadata = image.metadata
    ?? (fallbackDimensions
      ? { width: fallbackDimensions.width, height: fallbackDimensions.height }
      : null);

  if (metadata && metadata.width > 0 && metadata.height > 0) {
    // Seamless wide-panorama triptych: the crop is a contiguous portrait
    // window into the shared panorama, so adjacent panels always meet
    // edge-to-edge while the shared zoom/pan scrolls the band as one image.
    const windowIndex = image.triptychWindowIndex;
    const adjusted =
      windowIndex !== undefined
        ? resolveTriptychSlotCrop({
            sourceWidth: metadata.width,
            sourceHeight: metadata.height,
            displayImageProportion: image.displayImageProportion,
            windowIndex,
            cropAdjust: image.previewCropAdjust,
          })
        : (() => {
            const baseCrop = calculateMaxCenteredCrop({
              sourceWidth: metadata.width,
              sourceHeight: metadata.height,
              proportion: image.displayImageProportion,
            });
            const cropAdjust = image.previewCropAdjust;
            return cropAdjust
              ? adjustCropForZoomPan(
                  baseCrop,
                  cropAdjust.zoom,
                  cropAdjust.panX,
                  cropAdjust.panY,
                )
              : baseCrop;
          })();

    // Size the <img> so the adjusted crop fills the frame and the rest of the
    // source overflows it; offset so the crop's top-left aligns with the
    // frame's. Percentages are relative to the frame box.
    width = `${(metadata.width / adjusted.cropWidth) * 100}%`;
    height = `${(metadata.height / adjusted.cropHeight) * 100}%`;
    left = `${-(adjusted.cropX / adjusted.cropWidth) * 100}%`;
    top = `${-(adjusted.cropY / adjusted.cropHeight) * 100}%`;
  }

  const transformParts: string[] = [];
  const transform = image.previewTransform;
  if (transform) {
    if (transform.rotation) {
      transformParts.push(`rotate(${transform.rotation}deg)`);
    }
    if (transform.flipHorizontal || transform.flipVertical) {
      transformParts.push(
        `scale(${transform.flipHorizontal ? -1 : 1}, ${transform.flipVertical ? -1 : 1})`,
      );
    }
  }

  return {
    width,
    height,
    top,
    left,
    transform: transformParts.length > 0 ? transformParts.join(" ") : undefined,
  };
};

function TriptychSidePanel({
  slotIndex,
  image,
  previewUrl,
  useCloudPreview,
  previewFrameAspectRatio,
  onSelectSlot,
  isLinked,
}: TriptychSidePanelProps) {
  const [confirmedCloudUrl, setConfirmedCloudUrl] = useState<string | null>(
    null,
  );
  const [imgDimensions, setImgDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const effectivePreviewUrl = previewUrl ?? image.previewUrl;
  const isEffectImageLoading =
    useCloudPreview &&
    effectivePreviewUrl !== null &&
    effectivePreviewUrl !== confirmedCloudUrl;

  const cropStyle = buildSidePanelCropStyle(image, useCloudPreview, imgDimensions);

  const previewStyle: React.CSSProperties = {
    filter: buildPreviewEffectFilter(image, useCloudPreview),
    width: cropStyle.width,
    height: cropStyle.height,
    top: cropStyle.top,
    left: cropStyle.left,
    transform: cropStyle.transform,
  };

  return (
    <button
      type="button"
      onClick={() => onSelectSlot(slotIndex)}
      data-testid={`triptych-side-panel-${slotIndex}`}
      aria-label={t("uploader.selectImageSlot", { index: String(slotIndex + 1) })}
      className="group/side-panel relative flex h-full max-h-full shrink-0 items-center justify-center"
      data-triptych-linked={isLinked ? "true" : undefined}
    >
      <div
        className="relative h-full w-auto max-w-full overflow-hidden rounded-none border-0 transition-opacity duration-200 ease-out motion-reduce:transition-none opacity-95 hover:opacity-100"
        style={{ aspectRatio: String(previewFrameAspectRatio) }}
      >
        <img
          src={effectivePreviewUrl}
          alt={t("uploader.selectImageSlot", { index: String(slotIndex + 1) })}
          className="absolute object-cover will-change-transform transition-transform duration-100 ease-out motion-reduce:transition-none"
          style={previewStyle}
          draggable={false}
          onLoad={(e) => {
            setConfirmedCloudUrl(effectivePreviewUrl);
            const img = e.currentTarget;
            if (img.naturalWidth > 0 && img.naturalHeight > 0) {
              setImgDimensions({
                width: img.naturalWidth,
                height: img.naturalHeight,
              });
            }
          }}
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
  paintingShape?: PaintingShape;
  slots?: Array<SelectedImageItem | null>;
  onSelectSlot?: (index: number) => void;
  getSlotPreviewUrl?: (image: SelectedImageItem) => string;
  isDesktopTriptych?: boolean;
  isTriptychLinked?: boolean;
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
  paintingShape = "square",
  slots,
  onSelectSlot,
  getSlotPreviewUrl,
  isDesktopTriptych = false,
  isTriptychLinked = true,
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

  // All triptych panels share the same portrait aspect ratio (each slot is a
  // vertical third of a horizontal source).
  const triptychAspect = previewFrameAspectRatio;
  const triptychContainerRef = useRef<HTMLDivElement>(null);
  const [triptychFit, setTriptychFit] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!showDesktopTriptych) return;
    const el = triptychContainerRef.current;
    if (!el) return;

    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      // The reference box represents the LARGEST painting size. Three such
      // portrait panels side-by-side must fit the container in both dimensions;
      // at the largest size the panels touch each other exactly.
      const referenceHeight = Math.min(
        height,
        width / (TRIPTYCH_PANEL_COUNT * triptychAspect),
      );
      setTriptychFit({
        width: referenceHeight * triptychAspect,
        height: referenceHeight,
      });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [showDesktopTriptych, triptychAspect]);

  // Every size is expressed relative to the largest size so the selected panel
  // never overflows its reference box (≤ 100%); the largest size fills it.
  const selectedScaleRelative =
    getPaintingSizeScale(selectedPaintingSize) / MAX_PAINTING_SIZE_SCALE;

  if (showDesktopTriptych) {
    const hasFit = triptychFit.width > 0 && triptychFit.height > 0;
    return (
      <div
        ref={triptychContainerRef}
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
              isLinked={isTriptychLinked}
            />
          ) : null;

          return (
            <div
              key={index}
              className="relative h-full shrink-0"
              style={
                hasFit
                  ? { width: triptychFit.width, height: triptychFit.height }
                  : { aspectRatio: String(panelAspectRatio) }
              }
            >
              {getPaintingSizeIndices(paintingShape).map((sizeIdx) => {
                const scale = getPaintingSizeScale(sizeIdx);
                const relativeScale = scale / MAX_PAINTING_SIZE_SCALE;
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
                data-testid="triptych-panel-content"
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
        shape={paintingShape}
        showBorders
      >
        {previewSlot}
      </PaintingSizeHelperOverlay>
    </div>
  );
}
