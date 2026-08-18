import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { Switch } from "@/components/ui/switch";
import {
  calculateMaxCenteredCropForAspectRatio,
  getTargetAspectRatio,
  type ImageDisplayProportion,
} from "@/components/image-uploader/image-proportion-calculator";
import { getVerticalThirdSliceRanges } from "@/components/image-uploader/split-image-into-thirds";

const findScrollableAncestor = (start: HTMLElement): HTMLElement | null => {
  let node = start.parentElement;
  while (node && node !== document.body) {
    const style = window.getComputedStyle(node);
    if (/(auto|scroll)/.test(`${style.overflow} ${style.overflowX} ${style.overflowY}`)) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
};

const PART_SHAPES = {
  portrait: { label: "portrait", proportion: "vertical" as ImageDisplayProportion },
  square: { label: "square", proportion: "square" as ImageDisplayProportion },
  landscape: { label: "landscape", proportion: "horizontal" as ImageDisplayProportion },
} as const;

export type TriptychPartShape = keyof typeof PART_SHAPES;

const getPartAspect = (shape: TriptychPartShape): number =>
  getTargetAspectRatio(PART_SHAPES[shape].proportion);

const PART_COUNT = 3;
const PART_LABELS = ["A", "B", "C"] as const;
const SLOT_WIDTH = 200;
const COVERAGE_OPTIONS = [1, 0.8] as const;
const SLOT_SCALE_OPTIONS = [
  { value: 1, scale: 1 / 3 },
  { value: 2, scale: 2 / 3 },
  { value: 3, scale: 1 },
  { value: 4, scale: 4 / 3 },
  { value: 5, scale: 5 / 3 },
  { value: 6, scale: 2 },
] as const;
const DEFAULT_OUTPUT_MIME = "image/jpeg";

const DEFAULT_EMPTY_STATE_TEXT = "Load an image to display it here with mask and A/B/C parts";

export interface TriptychViewerProps {
  imageSrc?: string | null;
  onImageSrcChange?: (imageSrc: string | null) => void;
  partShape?: TriptychPartShape;
  onPartShapeChange?: (partShape: TriptychPartShape) => void;
  coverage?: number;
  onCoverageChange?: (coverage: number) => void;
  slotScale?: number;
  onSlotScaleChange?: (slotScale: number) => void;
  fitToContainer?: boolean;
  onFitToContainerChange?: (fitToContainer: boolean) => void;
  onCropsChange?: (crops: string[]) => void;
  showImageLoader?: boolean;
  showControls?: boolean;
  showImageInfo?: boolean;
  imageAlt?: string;
  emptyState?: ReactNode;
  className?: string;
}

export function TriptychViewer({
  imageSrc: imageSrcProp,
  onImageSrcChange,
  partShape: partShapeProp,
  onPartShapeChange,
  coverage: coverageProp,
  onCoverageChange,
  slotScale: slotScaleProp,
  onSlotScaleChange,
  fitToContainer: fitToContainerProp,
  onFitToContainerChange,
  onCropsChange,
  showImageLoader = true,
  showControls = true,
  showImageInfo = true,
  imageAlt = "triptych",
  emptyState,
  className,
}: TriptychViewerProps) {
  const [internalImageSrc, setInternalImageSrc] = useState<string | null>(null);
  const [internalPartShape, setInternalPartShape] = useState<TriptychPartShape>("portrait");
  const [internalCoverage, setInternalCoverage] = useState<number>(1);
  const [internalSlotScale, setInternalSlotScale] = useState<number>(3);
  const [internalFitToContainer, setInternalFitToContainer] = useState(true);
  const [loadedImage, setLoadedImage] = useState<{
    src: string;
    size: { width: number; height: number };
  } | null>(null);
  const [cropsState, setCropsState] = useState<{ src: string; urls: string[] } | null>(null);
  const [maskOffset, setMaskOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const objectUrlRef = useRef<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const imageWrapperRef = useRef<HTMLDivElement | null>(null);
  const [fitViewport, setFitViewport] = useState<{ width: number; height: number } | null>(null);
  const dragStateRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startOffsetX: number;
    startOffsetY: number;
    scale: number;
  } | null>(null);
  const onCropsChangeRef = useRef(onCropsChange);
  const objectUrlMimeRef = useRef(new Map<string, string>());
  const uid = useId();

  const isImageSrcControlled = imageSrcProp !== undefined;
  const isPartShapeControlled = partShapeProp !== undefined;
  const isCoverageControlled = coverageProp !== undefined;
  const isSlotScaleControlled = slotScaleProp !== undefined;
  const isFitToContainerControlled = fitToContainerProp !== undefined;
  const imageSrc = isImageSrcControlled ? imageSrcProp : internalImageSrc;
  const partShape = isPartShapeControlled ? partShapeProp : internalPartShape;
  const coverage = isCoverageControlled ? coverageProp : internalCoverage;
  const slotScale = isSlotScaleControlled ? slotScaleProp : internalSlotScale;
  const fitToContainer = isFitToContainerControlled
    ? fitToContainerProp
    : internalFitToContainer;
  const imageSize =
    loadedImage !== null && loadedImage.src === imageSrc ? loadedImage.size : null;
  const crops = cropsState !== null && cropsState.src === imageSrc ? cropsState.urls : [];

  const [prevImageSrc, setPrevImageSrc] = useState(imageSrc);
  if (prevImageSrc !== imageSrc) {
    setPrevImageSrc(imageSrc);
    setMaskOffset({ x: 0, y: 0 });
  }

  useEffect(() => {
    onCropsChangeRef.current = onCropsChange;
  });

  const changeImageSrc = useCallback(
    (next: string | null) => {
      if (!isImageSrcControlled) setInternalImageSrc(next);
      onImageSrcChange?.(next);
    },
    [isImageSrcControlled, onImageSrcChange],
  );

  const changePartShape = useCallback(
    (next: TriptychPartShape) => {
      if (!isPartShapeControlled) setInternalPartShape(next);
      onPartShapeChange?.(next);
    },
    [isPartShapeControlled, onPartShapeChange],
  );

  const changeCoverage = useCallback(
    (next: number) => {
      if (!isCoverageControlled) setInternalCoverage(next);
      onCoverageChange?.(next);
    },
    [isCoverageControlled, onCoverageChange],
  );

  const changeSlotScale = useCallback(
    (next: number) => {
      if (!isSlotScaleControlled) setInternalSlotScale(next);
      onSlotScaleChange?.(next);
    },
    [isSlotScaleControlled, onSlotScaleChange],
  );

  const changeFitToContainer = useCallback(
    (next: boolean) => {
      if (!isFitToContainerControlled) setInternalFitToContainer(next);
      onFitToContainerChange?.(next);
    },
    [isFitToContainerControlled, onFitToContainerChange],
  );

  useEffect(() => {
    if (!fitToContainer) return;
    const wrapper = imageWrapperRef.current;
    if (!wrapper) return;
    const target = findScrollableAncestor(wrapper) ?? wrapper.parentElement;
    if (!target) return;
    const update = () => {
      const width = target.clientWidth;
      const computedMaxHeight = parseFloat(
        window.getComputedStyle(target).maxHeight,
      );
      const height =
        Number.isFinite(computedMaxHeight) && computedMaxHeight > 0
          ? computedMaxHeight
          : target.clientHeight;
      setFitViewport(width > 0 && height > 0 ? { width, height } : null);
    };
    const raf = requestAnimationFrame(update);
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(update);
    observer.observe(target);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [fitToContainer]);

  const fittedPreviewSize = useMemo(() => {
    if (!fitToContainer || fitViewport === null || imageSize === null) return null;
    const scale = Math.min(
      fitViewport.width / imageSize.width,
      fitViewport.height / imageSize.height,
      1,
    );
    return {
      width: Math.max(1, Math.round(imageSize.width * scale)),
      height: Math.max(1, Math.round(imageSize.height * scale)),
    };
  }, [fitToContainer, fitViewport, imageSize]);

  const mask = useMemo(() => {
    if (imageSize === null) return null;
    const baseCrop = calculateMaxCenteredCropForAspectRatio({
      sourceWidth: imageSize.width,
      sourceHeight: imageSize.height,
      targetAspectRatio: PART_COUNT * getPartAspect(partShape),
    });
    const widthPx = baseCrop.cropWidth * coverage;
    const heightPx = baseCrop.cropHeight * coverage;
    const baseLeftPx = (imageSize.width - widthPx) / 2;
    const baseTopPx = (imageSize.height - heightPx) / 2;
    const offsetX = Math.max(-baseLeftPx, Math.min(baseLeftPx, maskOffset.x));
    const offsetY = Math.max(-baseTopPx, Math.min(baseTopPx, maskOffset.y));
    return {
      leftPx: baseLeftPx + offsetX,
      topPx: baseTopPx + offsetY,
      widthPct: (widthPx / imageSize.width) * 100,
      heightPct: (heightPx / imageSize.height) * 100,
      leftPct: ((baseLeftPx + offsetX) / imageSize.width) * 100,
      topPct: ((baseTopPx + offsetY) / imageSize.height) * 100,
      widthPx,
      heightPx,
    };
  }, [imageSize, partShape, coverage, maskOffset]);

  useEffect(() => {
    if (mask === null || imageSrc === null) return;
    let active = true;
    const img = new Image();
    img.onload = () => {
      if (!active) return;
      const composedWidth = Math.max(1, Math.round(mask.widthPx));
      const composedHeight = Math.max(1, Math.round(mask.heightPx));
      const outputMime = objectUrlMimeRef.current.get(imageSrc) ?? DEFAULT_OUTPUT_MIME;
      const urls = getVerticalThirdSliceRanges(composedWidth).map(
        ({ sliceStartX, sliceWidth }) => {
          const sourceSliceX =
            mask.leftPx + (sliceStartX / composedWidth) * mask.widthPx;
          const sourceSliceWidth = (sliceWidth / composedWidth) * mask.widthPx;
          const canvas = document.createElement("canvas");
          canvas.width = sliceWidth;
          canvas.height = composedHeight;
          const ctx = canvas.getContext("2d");
          if (!ctx) return "";
          ctx.drawImage(
            img,
            sourceSliceX,
            mask.topPx,
            sourceSliceWidth,
            mask.heightPx,
            0,
            0,
            canvas.width,
            canvas.height
          );
          return canvas.toDataURL(outputMime);
        }
      );
      setCropsState({ src: imageSrc, urls });
      onCropsChangeRef.current?.(urls);
    };
    img.src = imageSrc;
    return () => {
      active = false;
    };
  }, [mask, imageSrc]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    objectUrlMimeRef.current.set(url, file.type);
    changeImageSrc(url);
  };

  const handleMaskPointerDown = (e: React.PointerEvent) => {
    if (!mask || !imageSize || !imgRef.current) return;
    const imgRect = imgRef.current.getBoundingClientRect();
    const scale = imageSize.width / imgRect.width;
    dragStateRef.current = {
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startOffsetX: mask.leftPx - (imageSize.width - mask.widthPx) / 2,
      startOffsetY: mask.topPx - (imageSize.height - mask.heightPx) / 2,
      scale,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleMaskPointerMove = (e: React.PointerEvent) => {
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    setMaskOffset({
      x: drag.startOffsetX + (e.clientX - drag.startClientX) * drag.scale,
      y: drag.startOffsetY + (e.clientY - drag.startClientY) * drag.scale,
    });
  };

  const handleMaskPointerEnd = (e: React.PointerEvent) => {
    if (dragStateRef.current?.pointerId !== e.pointerId) return;
    dragStateRef.current = null;
  };

  const partAspect = mask
    ? mask.widthPx / PART_COUNT / mask.heightPx
    : getPartAspect(partShape);
  const slotScaleFactor =
    SLOT_SCALE_OPTIONS.find(({ value }) => value === slotScale)?.scale ?? 1;
  const slotWidth = SLOT_WIDTH * slotScaleFactor;
  const partShapeSelectId = `${uid}-part-shape`;
  const coverageSelectId = `${uid}-coverage`;
  const slotScaleSelectId = `${uid}-slot-scale`;

  return (
    <div className={className} style={{ width: "100%" }}>
      {(showImageLoader || showControls) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px 16px",
            borderBottom: "1px solid #ccc",
          }}
        >
          {showImageLoader && (
            <label
              style={{
                padding: "6px 14px",
                background: "#e5e5e5",
                border: "1px solid #333",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Load image
              <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
            </label>
          )}
          {showControls && (
            <>
              <label htmlFor={partShapeSelectId} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px" }}>
                Part shape:
                <select
                  id={partShapeSelectId}
                  value={partShape}
                  onChange={(e) => changePartShape(e.target.value as TriptychPartShape)}
                  style={{ padding: "4px 8px", fontSize: "14px" }}
                >
                  {Object.entries(PART_SHAPES).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value.label}
                    </option>
                  ))}
                </select>
              </label>
              <label htmlFor={coverageSelectId} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px" }}>
                Coverage:
                <select
                  id={coverageSelectId}
                  value={coverage}
                  onChange={(e) => changeCoverage(Number(e.target.value))}
                  style={{ padding: "4px 8px", fontSize: "14px" }}
                >
                  {COVERAGE_OPTIONS.map((value) => (
                    <option key={value} value={value}>
                      {value * 100}%
                    </option>
                  ))}
                </select>
              </label>
              <label htmlFor={slotScaleSelectId} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px" }}>
                Slot size:
                <select
                  id={slotScaleSelectId}
                  value={slotScale}
                  onChange={(e) => changeSlotScale(Number(e.target.value))}
                  style={{ padding: "4px 8px", fontSize: "14px" }}
                >
                  {SLOT_SCALE_OPTIONS.map(({ value }) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                Fit preview:
                <Switch
                  checked={fitToContainer}
                  onCheckedChange={changeFitToContainer}
                />
              </label>
            </>
          )}
          {showImageInfo && imageSize && (
            <span style={{ fontSize: "13px", color: "#333" }}>
              {imageSize.width} x {imageSize.height} (ratio {(imageSize.width / imageSize.height).toFixed(2)})
            </span>
          )}
        </div>
      )}
      {imageSrc === null ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "300px",
            fontSize: "20px",
            color: "#666",
          }}
        >
          {emptyState ?? DEFAULT_EMPTY_STATE_TEXT}
        </div>
      ) : (
        <>
          <div ref={imageWrapperRef} style={{ position: "relative", display: "inline-block" }}>
            <img
              ref={imgRef}
              src={imageSrc}
              alt={imageAlt}
              style={
                fittedPreviewSize
                  ? {
                      display: "block",
                      width: `${fittedPreviewSize.width}px`,
                      height: `${fittedPreviewSize.height}px`,
                    }
                  : fitToContainer
                    ? { display: "block", maxWidth: "100%", height: "auto" }
                    : { display: "block", maxWidth: "none" }
              }
              onLoad={(e) => {
                setLoadedImage({
                  src: imageSrc ?? e.currentTarget.src,
                  size: {
                    width: e.currentTarget.naturalWidth,
                    height: e.currentTarget.naturalHeight,
                  },
                });
              }}
            />
            {mask && (
              <div
                style={{
                  position: "absolute",
                  top: `${mask.topPct}%`,
                  left: `${mask.leftPct}%`,
                  width: `${mask.widthPct}%`,
                  height: `${mask.heightPct}%`,
                  background: "rgba(0, 0, 255, 0.3)",
                  cursor: "grab",
                  touchAction: "none",
                }}
                onPointerDown={handleMaskPointerDown}
                onPointerMove={handleMaskPointerMove}
                onPointerUp={handleMaskPointerEnd}
                onPointerCancel={handleMaskPointerEnd}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "4px",
                    left: "4px",
                    color: "#ffffff",
                    fontSize: "11px",
                    fontWeight: "bold",
                    textShadow: "1px 1px 2px black",
                    pointerEvents: "none",
                  }}
                >
                  {Math.round(mask.widthPx)} x {Math.round(mask.heightPx)} = {(mask.widthPx / mask.heightPx).toFixed(2)}
                </div>
                {PART_LABELS.map((label, i) => (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      top: "0%",
                      left: `${(i * 100) / PART_COUNT}%`,
                      width: `${100 / PART_COUNT}%`,
                      height: "100%",
                      border: "2px dashed rgba(255, 255, 255, 0.9)",
                      boxSizing: "border-box",
                      pointerEvents: "none",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        color: "white",
                        fontSize: "72px",
                        fontWeight: "bold",
                        textShadow: "2px 2px 4px black",
                        pointerEvents: "none",
                      }}
                    >
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {mask && (
            <div style={{ display: "flex", gap: "16px", justifyContent: "center", marginTop: "24px", width: "100%" }}>
              {PART_LABELS.map((label, i) => (
                <div
                  key={label}
                  style={{
                    width: `${slotWidth}px`,
                    height: `${slotWidth / partAspect}px`,
                    background: "#e5e5e5",
                    border: "2px solid #333",
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {crops[i] ? (
                    <img
                      src={crops[i]}
                      alt={`${imageAlt} part ${label}`}
                      style={{ display: "block", width: "100%", height: "100%", objectFit: "fill" }}
                    />
                  ) : (
                    <span style={{ fontSize: "48px", fontWeight: "bold", color: "#333" }}>{label}'</span>
                  )}
                  <span
                    style={{
                      position: "absolute",
                      top: "8px",
                      left: "8px",
                      fontSize: "20px",
                      fontWeight: "bold",
                      color: "white",
                      textShadow: "1px 1px 2px black",
                    }}
                  >
                    {label}'
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
