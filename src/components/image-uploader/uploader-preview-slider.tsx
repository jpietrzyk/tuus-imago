import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { t } from "@/locales/i18n";
import { UploadProgressOverlay } from "@/components/ui/upload-progress-overlay";
import PaintingPreviewSlot from "./painting-preview-slot";
import PaintingSizeHelperOverlay from "./painting-size-helper-overlay";
import IconRemove from "@/components/icons/icon-remove.svg?react";
import {
  computeSidePanelCrop,
  loadCachedImageElement,
} from "./side-panel-crop";
import { drawCroppedImageToCanvas } from "./preview-canvas-utils";
import type {
  SelectedImageItem,
  SelectedImageMetadata,
} from "./image-uploader";
import type { ImageDisplayProportion } from "./image-proportion-calculator";
import { getTargetAspectRatio } from "./image-proportion-calculator";
import {
  getPaintingSizeScale,
  getPaintingSizeIndices,
  ALL_PAINTING_SIZE_INDICES,
  type PaintingShape,
  type PaintingSizeIndex,
} from "./painting-size";
import type { CropAdjust } from "./use-crop-adjust";

const MAX_PAINTING_SIZE_SCALE = getPaintingSizeScale(
  ALL_PAINTING_SIZE_INDICES[ALL_PAINTING_SIZE_INDICES.length - 1],
);

// Vertical position of the painting preview contents: the slider caps its
// content height by reserving this much space at the bottom (so background
// image elements there stay visible) and top-aligns the contents, which
// scales the previews down slightly at the largest painting size.
export const PREVIEW_SLIDER_BOTTOM_RESERVE_PX = 0;

interface TriptychSidePanelProps {
  slotIndex: number;
  image: SelectedImageItem;
  previewUrl: string | null;
  useCloudPreview: boolean;
  previewFrameAspectRatio: number;
  onSelectSlot: (index: number) => void;
  isLinked: boolean;
  isTrashVisible: boolean;
  onOtherInteraction: () => void;
}

const SIDE_PANEL_MAX_DRAW_RETRIES = 10;

function TriptychSidePanel({
  slotIndex,
  image,
  previewUrl,
  useCloudPreview,
  previewFrameAspectRatio,
  onSelectSlot,
  isLinked,
  isTrashVisible,
  onOtherInteraction,
}: TriptychSidePanelProps) {
  const [confirmedCloudUrl, setConfirmedCloudUrl] = useState<string | null>(
    null,
  );
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageElRef = useRef<HTMLImageElement | null>(null);
  const cachedDimsRef = useRef<{ w: number; h: number } | null>(null);
  const retryStateRef = useRef<{ frame: number | null; failures: number }>({
    frame: null,
    failures: 0,
  });
  const [decoded, setDecoded] = useState<{
    url: string;
    dims: { width: number; height: number };
  } | null>(null);
  const effectivePreviewUrl = previewUrl ?? image.previewUrl;
  const isEffectImageLoading =
    useCloudPreview &&
    effectivePreviewUrl !== null &&
    effectivePreviewUrl !== confirmedCloudUrl;

  // Local previews decode the source ONCE per URL (shared with the sibling
  // panels) and render through a canvas at frame resolution — the same path
  // as the active slot. Sizing a multi-megapixel <img> beyond the frame and
  // relying on the browser to rasterize the visible window proved unreliable
  // at panorama sizes: panels painted partially or not at all while the
  // canvas-drawn center slot stayed correct.
  useEffect(() => {
    let active = true;
    imageElRef.current = null;
    loadCachedImageElement(effectivePreviewUrl)
      .then((img) => {
        if (!active) return;
        imageElRef.current = img;
        setDecoded({
          url: effectivePreviewUrl,
          dims: { width: img.naturalWidth, height: img.naturalHeight },
        });
      })
      .catch(() => {
        // Preview load errors are ignored, matching the previous <img>
        // onError behaviour.
      });
    return () => {
      active = false;
    };
  }, [effectivePreviewUrl]);

  const sourceDims =
    image.metadata ??
    (decoded?.url === effectivePreviewUrl ? decoded.dims : null);
  const crop = computeSidePanelCrop(image, sourceDims);

  const drawSidePanel = () => {
    const canvas = canvasRef.current;
    const img = imageElRef.current;
    if (!canvas || !img || !crop) {
      return;
    }

    const painted = drawCroppedImageToCanvas({
      canvas,
      image: img,
      crop,
      effects: {
        brightness: image.previewEffects.brightness,
        contrast: image.previewEffects.contrast,
      },
      transform: image.previewTransform ?? null,
      cachedDimensions: cachedDimsRef.current ?? undefined,
    });

    if (painted === false) {
      const retry = retryStateRef.current;
      retry.failures += 1;
      if (
        retry.failures === 1 ||
        retry.failures > SIDE_PANEL_MAX_DRAW_RETRIES
      ) {
        console.error(
          `[triptych-side-panel ${slotIndex}] draw failed (attempt ${retry.failures}): buffer ${canvas.width}x${canvas.height}, crop ${Math.round(crop.cropX)},${Math.round(crop.cropY)} ${Math.round(crop.cropWidth)}x${Math.round(crop.cropHeight)}`,
        );
      }
      if (
        retry.failures <= SIDE_PANEL_MAX_DRAW_RETRIES &&
        retry.frame === null
      ) {
        retry.frame = window.requestAnimationFrame(() => {
          retry.frame = null;
          drawSidePanel();
        });
      }
    } else {
      retryStateRef.current.failures = 0;
    }
  };

  const drawRef = useRef(drawSidePanel);
  useEffect(() => {
    drawRef.current = drawSidePanel;
    drawSidePanel();
  });

  // Redraw when the frame resizes; repaint after a GPU context loss.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    // The retry state object is stable for the panel's lifetime; capture it
    // so the cleanup does not read the ref at unmount time.
    const retryState = retryStateRef.current;

    const updateCachedDims = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width >= 32 && rect.height >= 32) {
        cachedDimsRef.current = {
          w: Math.max(1, Math.round(rect.width)),
          h: Math.max(1, Math.round(rect.height)),
        };
      }
    };

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      console.error(
        `[triptych-side-panel ${slotIndex}] 2D context lost — will redraw on restore`,
      );
    };
    const handleContextRestored = () => {
      retryState.failures = 0;
      drawRef.current();
    };

    updateCachedDims();

    let resizeFrame: number | null = null;
    const scheduleDraw = () => {
      updateCachedDims();
      if (resizeFrame !== null) {
        window.cancelAnimationFrame(resizeFrame);
      }
      resizeFrame = window.requestAnimationFrame(() => {
        resizeFrame = null;
        drawRef.current();
      });
    };

    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(scheduleDraw)
        : null;
    observer?.observe(canvas);
    canvas.addEventListener("contextlost", handleContextLost);
    canvas.addEventListener("contextrestored", handleContextRestored);

    return () => {
      if (resizeFrame !== null) {
        window.cancelAnimationFrame(resizeFrame);
      }
      if (retryState.frame !== null) {
        window.cancelAnimationFrame(retryState.frame);
      }
      observer?.disconnect();
      canvas.removeEventListener("contextlost", handleContextLost);
      canvas.removeEventListener("contextrestored", handleContextRestored);
    };
  }, [slotIndex]);

  return (
    <button
      type="button"
      onClick={() => onSelectSlot(slotIndex)}
      onTouchStart={() => onOtherInteraction()}
      data-testid={`triptych-side-panel-${slotIndex}`}
      aria-label={t("uploader.selectImageSlot", {
        index: String(slotIndex + 1),
      })}
      className="group/side-panel relative flex h-full max-h-full shrink-0 items-center justify-center"
      data-triptych-linked={isLinked ? "true" : undefined}
    >
      <div
        className="relative h-full w-auto max-w-full overflow-hidden rounded-none border-0 transition-opacity duration-200 ease-out motion-reduce:transition-none opacity-95 hover:opacity-100"
        style={{ aspectRatio: String(previewFrameAspectRatio) }}
      >
        {useCloudPreview ? (
          <img
            src={effectivePreviewUrl}
            alt={t("uploader.selectImageSlot", {
              index: String(slotIndex + 1),
            })}
            className="absolute object-cover will-change-transform transition-transform duration-100 ease-out motion-reduce:transition-none"
            style={{ width: "100%", height: "100%", top: "0%", left: "0%" }}
            draggable={false}
            onLoad={() => {
              setConfirmedCloudUrl(effectivePreviewUrl);
            }}
            onError={() => setConfirmedCloudUrl(effectivePreviewUrl)}
          />
        ) : (
          <canvas
            ref={canvasRef}
            aria-label={t("uploader.selectImageSlot", {
              index: String(slotIndex + 1),
            })}
            data-testid={`triptych-side-panel-canvas-${slotIndex}`}
            className="absolute inset-0 h-full w-full"
          />
        )}
        <UploadProgressOverlay
          isVisible={useCloudPreview && isEffectImageLoading}
          progress={0}
          isIndeterminate
          label={t("uploader.applyingEffect")}
        />
        {isTrashVisible && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOtherInteraction();
            }}
            aria-label={t("uploader.clearSlot")}
            data-testid={`triptych-side-panel-trash-${slotIndex}`}
            className="absolute top-2 right-2 z-10 flex items-center justify-center rounded-full border border-border/70 bg-background/95 p-1.5 text-foreground shadow-md backdrop-blur-sm transition-all duration-200 hover:border-border hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
          >
            <IconRemove className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
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
  const [touchedSlotIndex, setTouchedSlotIndex] = useState<number | null>(null);
  const trashTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearTrashTimeout = useCallback(() => {
    if (trashTimeoutRef.current) {
      clearTimeout(trashTimeoutRef.current);
      trashTimeoutRef.current = null;
    }
  }, []);

  const setTrashTimeout = useCallback(() => {
    clearTrashTimeout();
    trashTimeoutRef.current = setTimeout(() => {
      setTouchedSlotIndex(null);
    }, 3000);
  }, [clearTrashTimeout]);

  const handleTouchStart = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      onTouchStart(event);
      setTouchedSlotIndex(activeImageIndex);
      setTrashTimeout();
    },
    [activeImageIndex, onTouchStart, setTrashTimeout],
  );

  const handleTouchEnd = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      onTouchEnd(event);
      setTrashTimeout();
    },
    [onTouchEnd, setTrashTimeout],
  );

  const handleOtherInteraction = useCallback(() => {
    clearTrashTimeout();
    setTouchedSlotIndex(null);
  }, [clearTrashTimeout]);

  useEffect(() => {
    return () => {
      clearTrashTimeout();
    };
  }, [clearTrashTimeout]);
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
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMetadataResolved={onMetadataResolved}
      onSelectEmptySlot={onSelectEmptySlot}
      onClearSlot={onClearSlot}
      isTrashVisible={touchedSlotIndex === activeImageIndex}
      onOtherInteraction={handleOtherInteraction}
    />
  );

  const showDesktopTriptych =
    isDesktopTriptych &&
    Array.isArray(slots) &&
    slots.length > 0 &&
    typeof onSelectSlot === "function";

  // Each triptych panel has its own aspect: the active slot follows the
  // shared frame, side slots follow their own display proportion (equal while
  // the triptych is linked; may differ per slot once unlinked).
  const panelAspects = useMemo(
    () =>
      (slots ?? []).map((slot, index) =>
        index === activeImageIndex
          ? previewFrameAspectRatio
          : slot
            ? getTargetAspectRatio(slot.displayImageProportion)
            : paintingAspectRatio,
      ),
    [slots, activeImageIndex, previewFrameAspectRatio, paintingAspectRatio],
  );
  const panelAspectsRef = useRef(panelAspects);
  useEffect(() => {
    panelAspectsRef.current = panelAspects;
  }, [panelAspects]);
  const panelAspectsSignature = panelAspects.join(",");

  const triptychContainerRef = useRef<HTMLDivElement>(null);
  const [triptychFit, setTriptychFit] = useState<{
    widths: number[];
    height: number;
  }>({
    widths: [],
    height: 0,
  });

  useEffect(() => {
    if (!showDesktopTriptych) return;
    const el = triptychContainerRef.current;
    if (!el) return;

    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      const aspects = panelAspectsRef.current;
      if (aspects.length === 0) return;
      // The reference box represents the LARGEST painting size. The panels
      // side-by-side (each at its own aspect) must fit the container in both
      // dimensions; at the largest size they touch each other exactly. The
      // bottom reserve caps the row height so the previews scale down and
      // keep the bottom part of the background image visible.
      const availableHeight = height - PREVIEW_SLIDER_BOTTOM_RESERVE_PX;
      if (availableHeight <= 0) return;
      const totalAspect = aspects.reduce((sum, aspect) => sum + aspect, 0);
      const referenceHeight = Math.min(availableHeight, width / totalAspect);
      setTriptychFit({
        widths: aspects.map((aspect) => referenceHeight * aspect),
        height: referenceHeight,
      });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [showDesktopTriptych, panelAspectsSignature]);

  // Every size is expressed relative to the largest size so the selected panel
  // never overflows its reference box (≤ 100%); the largest size fills it.
  const selectedScaleRelative =
    getPaintingSizeScale(selectedPaintingSize) / MAX_PAINTING_SIZE_SCALE;

  if (showDesktopTriptych) {
    const hasFit =
      triptychFit.height > 0 && triptychFit.widths.length === slots!.length;
    return (
      <div
        ref={triptychContainerRef}
        className="painting-preview-slider flex w-full min-w-0 flex-1 items-start justify-center bg-transparent overflow-hidden"
        style={
          {
            "--painting-size-scale": MAX_PAINTING_SIZE_SCALE,
          } as React.CSSProperties
        }
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
              previewUrl={getSlotPreviewUrl ? getSlotPreviewUrl(slot) : null}
              useCloudPreview={!!slot.uploadedAsset}
              previewFrameAspectRatio={panelAspectRatio}
              onSelectSlot={onSelectSlot!}
              isLinked={isTriptychLinked}
              isTrashVisible={touchedSlotIndex === index}
              onOtherInteraction={handleOtherInteraction}
            />
          ) : null;

          return (
            <div
              key={index}
              className="relative h-full shrink-0"
              style={
                hasFit
                  ? {
                      width: triptychFit.widths[index],
                      height: triptychFit.height,
                    }
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
      style={
        {
          "--painting-size-scale": MAX_PAINTING_SIZE_SCALE,
        } as React.CSSProperties
      }
      data-testid="uploader-preview-slider"
    >
      <PaintingSizeHelperOverlay
        selectedSize={selectedPaintingSize}
        paintingAspectRatio={paintingAspectRatio}
        shape={paintingShape}
        bottomReservePx={PREVIEW_SLIDER_BOTTOM_RESERVE_PX}
        showBorders
      >
        {previewSlot}
      </PaintingSizeHelperOverlay>
    </div>
  );
}
