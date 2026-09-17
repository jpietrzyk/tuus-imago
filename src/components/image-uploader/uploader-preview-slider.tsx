import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { t } from "@/locales/i18n";
import { UploadProgressOverlay } from "@/components/ui/upload-progress-overlay";
import PaintingPreviewSlot from "./painting-preview-slot";
import PaintingSizeHelperOverlay from "./painting-size-helper-overlay";
import UploaderSlotSwitcher from "./uploader-slot-switcher";
import SlotPreviewCanvas from "./slot-preview-canvas";
import { useEstimatedProgress } from "./use-estimated-progress";
import {
  UploaderSwipeNavHint,
  type SwipeNavHintProps,
} from "./uploader-swipe-nav-hint";
import IconRemove from "@/components/icons/icon-remove.svg?react";
import IconClose from "@/components/icons/icon-close.svg?react";
import { useRecentlyChanged } from "./use-recently-changed";
import { PREVIEW_SLIDER_BOTTOM_RESERVE_PX } from "./preview-slider-layout";
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

function LowResolutionBadge() {
  return (
    <span
      data-testid="low-resolution-badge"
      className="pointer-events-none absolute left-1/2 top-2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full border border-amber-300 bg-amber-50/95 px-2.5 py-1 text-[10px] font-semibold text-amber-800 shadow-sm"
    >
      {t("uploader.unprintableBadge")}
    </span>
  );
}

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
  const effectivePreviewUrl = previewUrl ?? image.previewUrl;
  const isEffectImageLoading =
    useCloudPreview &&
    effectivePreviewUrl !== null &&
    effectivePreviewUrl !== confirmedCloudUrl;
  const effectProgress = useEstimatedProgress(isEffectImageLoading);

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
        className="painting-plate relative h-full w-auto max-w-full overflow-hidden rounded-none border-0 transition-opacity duration-200 ease-out motion-reduce:transition-none opacity-95 hover:opacity-100"
        style={{ aspectRatio: String(previewFrameAspectRatio) }}
      >
        <SlotPreviewCanvas
          image={image}
          previewUrl={effectivePreviewUrl}
          useCloudPreview={useCloudPreview}
          className={
            useCloudPreview
              ? "absolute h-full w-full object-cover"
              : "absolute inset-0 h-full w-full"
          }
          testId={`triptych-side-panel-canvas-${slotIndex}`}
          ariaLabel={t("uploader.selectImageSlot", {
            index: String(slotIndex + 1),
          })}
          debugLabel={`triptych-side-panel ${slotIndex}`}
          onCloudLoad={() => setConfirmedCloudUrl(effectivePreviewUrl)}
          onCloudError={() => setConfirmedCloudUrl(effectivePreviewUrl)}
        />
        <UploadProgressOverlay
          isVisible={isEffectImageLoading}
          progress={effectProgress}
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
  cropMaxZoom?: number;
  swipeFrameRef?: React.RefObject<HTMLDivElement | null>;
  swipeContentRef?: React.RefObject<HTMLDivElement | null>;
  swipeIncomingPrevRef?: React.RefObject<HTMLDivElement | null>;
  swipeIncomingNextRef?: React.RefObject<HTMLDivElement | null>;
  onTouchStart: (event: React.TouchEvent<HTMLDivElement>) => void;
  onTouchMove?: (event: React.TouchEvent<HTMLDivElement>) => void;
  onTouchEnd: (event: React.TouchEvent<HTMLDivElement>) => void;
  onTouchCancel?: () => void;
  onMetadataResolved: (args: {
    metadata: SelectedImageMetadata;
    nextDisplayImageProportion: ImageDisplayProportion;
    shouldAutoSelectOptimalProportion: boolean;
  }) => void;
  onPreviewLoadError?: (url: string) => void;
  onSelectEmptySlot?: () => void;
  onClearSlot?: () => void;
  selectedPaintingSize?: PaintingSizeIndex;
  paintingAspectRatio?: number;
  paintingShape?: PaintingShape;
  isPreviewUnprintable?: boolean;
  slots?: Array<SelectedImageItem | null>;
  onSelectSlot?: (index: number) => void;
  getSlotPreviewUrl?: (image: SelectedImageItem) => string;
  isDesktopTriptych?: boolean;
  isTriptychLinked?: boolean;
  swipeNav?: SwipeNavHintProps | null;
  showSlotThumbs?: boolean;
  showMaxZoomHint?: boolean;
  onDismissMaxZoomHint?: () => void;
  onMaxZoomReached?: () => void;
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
  cropMaxZoom,
  swipeFrameRef,
  swipeContentRef,
  swipeIncomingPrevRef,
  swipeIncomingNextRef,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onTouchCancel,
  onMetadataResolved,
  onPreviewLoadError,
  onSelectEmptySlot,
  onClearSlot,
  selectedPaintingSize = 2,
  paintingAspectRatio = 1.5,
  paintingShape = "square",
  isPreviewUnprintable = false,
  slots,
  onSelectSlot,
  getSlotPreviewUrl,
  isDesktopTriptych = false,
  isTriptychLinked = true,
  swipeNav = null,
  showSlotThumbs = false,
  showMaxZoomHint = false,
  onDismissMaxZoomHint,
  onMaxZoomReached,
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
  const effectiveSwipeDisabled = swipeDisabled || isDesktopTriptych;

  // Nearest filled neighbours, mirroring the swipe navigation (which skips
  // empty slots). Used both for the resting edge peeks and for the incoming
  // previews that slide into the frame while the user drags.
  const neighbourImages = useMemo(() => {
    if (typeof activeImageIndex !== "number" || !Array.isArray(slots)) {
      return {
        prev: null as SelectedImageItem | null,
        next: null as SelectedImageItem | null,
      };
    }

    const prev =
      slots
        .slice(0, activeImageIndex)
        .reverse()
        .find((slot): slot is SelectedImageItem => Boolean(slot)) ?? null;
    const next =
      slots
        .slice(activeImageIndex + 1)
        .find((slot): slot is SelectedImageItem => Boolean(slot)) ?? null;

    return { prev, next };
  }, [activeImageIndex, slots]);

  const resolveSlotPreviewUrl = (image: SelectedImageItem) =>
    getSlotPreviewUrl ? getSlotPreviewUrl(image) : image.previewUrl;

  const handleTouchMove = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      onTouchMove?.(event);
    },
    [onTouchMove],
  );

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
      swipeDisabled={effectiveSwipeDisabled}
      isEditMode={isEditMode}
      previewCropAdjust={previewCropAdjust}
      onCropAdjustChange={onCropAdjustChange}
      cropMaxZoom={cropMaxZoom}
      onMaxZoomReached={onMaxZoomReached}
      swipeFrameRef={swipeFrameRef}
      swipeContentRef={swipeContentRef}
      swipeIncomingPrevRef={swipeIncomingPrevRef}
      swipeIncomingNextRef={swipeIncomingNextRef}
      prevSlotPreviewUrl={
        neighbourImages.prev ? resolveSlotPreviewUrl(neighbourImages.prev) : null
      }
      nextSlotPreviewUrl={
        neighbourImages.next ? resolveSlotPreviewUrl(neighbourImages.next) : null
      }
      prevSlotImage={neighbourImages.prev}
      nextSlotImage={neighbourImages.next}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={onTouchCancel}
      onMetadataResolved={onMetadataResolved}
      onPreviewLoadError={onPreviewLoadError}
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
  const isSizeHintActive = useRecentlyChanged(selectedPaintingSize);

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
              className="group/panel relative h-full shrink-0"
              style={
                hasFit
                  ? {
                      width: triptychFit.widths[index],
                      height: triptychFit.height,
                    }
                  : { aspectRatio: String(panelAspectRatio) }
              }
            >
              {isActive && isPreviewUnprintable && <LowResolutionBadge />}
              <div
                data-testid="painting-size-guides"
                className="pointer-events-none absolute inset-0 opacity-20 transition-opacity duration-500 ease-out motion-reduce:transition-none hover-capable:group-hover/panel:opacity-70"
                style={isSizeHintActive ? { opacity: 1 } : undefined}
              >
                {getPaintingSizeIndices(paintingShape).map((sizeIdx) => {
                  const scale = getPaintingSizeScale(sizeIdx);
                  const relativeScale = scale / MAX_PAINTING_SIZE_SCALE;
                  const isSelected = sizeIdx === selectedPaintingSize;

                  return (
                    <div
                      key={sizeIdx}
                      className="absolute inset-0 m-auto"
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
              </div>
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

  // Peeks mirror the swipe navigation, which skips empty slots, so scan
  // outward for the nearest filled neighbour instead of only the adjacent slot.
  const leftPeekImage = showSlotThumbs ? neighbourImages.prev : null;
  const rightPeekImage = showSlotThumbs ? neighbourImages.next : null;

  const showSlotThumbStrip =
    showSlotThumbs &&
    Array.isArray(slots) &&
    slots.length > 0 &&
    typeof onSelectSlot === "function";

  return (
    <div
      className="painting-preview-slider relative flex w-full min-w-0 flex-1 items-center justify-center bg-transparent overflow-hidden"
      style={
        {
          "--painting-size-scale": MAX_PAINTING_SIZE_SCALE,
        } as React.CSSProperties
      }
      data-testid="uploader-preview-slider"
    >
      {leftPeekImage && (
        <div
          aria-hidden="true"
          data-testid="uploader-slot-peek-left"
          className="pointer-events-none absolute inset-y-0 left-0 z-0 w-[8%] max-w-16 overflow-hidden"
        >
          <SlotPreviewCanvas
            image={leftPeekImage}
            previewUrl={resolveSlotPreviewUrl(leftPeekImage)}
            useCloudPreview={!!leftPeekImage.uploadedAsset}
            className="h-full w-full object-cover object-right opacity-60 [mask-image:linear-gradient(to_right,black,transparent)]"
            debugLabel="slot-peek-left"
          />
        </div>
      )}
      {rightPeekImage && (
        <div
          aria-hidden="true"
          data-testid="uploader-slot-peek-right"
          className="pointer-events-none absolute inset-y-0 right-0 z-0 w-[8%] max-w-16 overflow-hidden"
        >
          <SlotPreviewCanvas
            image={rightPeekImage}
            previewUrl={resolveSlotPreviewUrl(rightPeekImage)}
            useCloudPreview={!!rightPeekImage.uploadedAsset}
            className="h-full w-full object-cover object-left opacity-60 [mask-image:linear-gradient(to_left,black,transparent)]"
            debugLabel="slot-peek-right"
          />
        </div>
      )}
      <PaintingSizeHelperOverlay
        selectedSize={selectedPaintingSize}
        paintingAspectRatio={paintingAspectRatio}
        shape={paintingShape}
        bottomReservePx={PREVIEW_SLIDER_BOTTOM_RESERVE_PX}
        showBorders
      >
        {previewSlot}
      </PaintingSizeHelperOverlay>
      {isPreviewUnprintable && <LowResolutionBadge />}
      {swipeNav && <UploaderSwipeNavHint {...swipeNav} />}
      {showSlotThumbStrip && (
        <div className="absolute bottom-1 left-1/2 z-20 -translate-x-1/2">
          <UploaderSlotSwitcher
            testIdPrefix="uploader-slot-thumb"
            slots={slots!}
            activeSlotIndex={activeImageIndex}
            onSelectSlot={onSelectSlot!}
            getSlotPreviewUrl={getSlotPreviewUrl}
          />
        </div>
      )}
      {showMaxZoomHint && (
        <div
          aria-live="polite"
          data-testid="max-zoom-hint"
          className="absolute bottom-3 left-1/2 z-30 w-[calc(100%-1.5rem)] max-w-sm -translate-x-1/2"
        >
          <button
            type="button"
            onClick={onDismissMaxZoomHint}
            className="flex w-full items-center gap-2 rounded-lg border border-primary/40 bg-background/95 px-3 py-2 text-left text-xs font-medium text-foreground shadow-lg backdrop-blur-sm transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
          >
            <span className="flex-1">{t("uploader.maxZoomHint")}</span>
            <IconClose
              className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
          </button>
        </div>
      )}
    </div>
  );
}
