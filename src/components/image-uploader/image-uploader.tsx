import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { t } from "@/locales/i18n";
import UploaderDropArea from "./uploader-drop-area";
import UploaderTools from "./uploader-tools";
import {
  calculateAllProportions,
  calculateMaxCenteredCrop,
  formatAspectRatio,
  getTargetAspectRatio,
  type ImageDisplayProportion,
} from "./image-proportion-calculator";

export interface ImageTransformations {
  rotation: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
  brightness: number;
  contrast: number;
  grayscale: number;
  blur: number;
}

export interface SelectedImageMetadata {
  width: number;
  height: number;
  aspectRatio: string;
}

interface ImageUploaderProps {
  onUploadSuccess?: (
    result: {
      public_id: string;
      secure_url: string;
      width: number;
      height: number;
      bytes: number;
      format: string;
      url: string;
      custom_coordinates?: string;
      context?: string;
    },
    transformations: ImageTransformations,
  ) => void;
  onUploadError?: (error: string) => void;
  onImageMetadataChange?: (metadata: SelectedImageMetadata | null) => void;
  onSelectionStateChange?: (hasSelection: boolean) => void;
  className?: string;
  skipCropStep?: boolean;
  defaultShowIcons?: boolean;
}

const MAX_SELECTED_IMAGES = 3;
const CENTER_SLOT_INDEX = Math.floor(MAX_SELECTED_IMAGES / 2);

const createEmptySelectionSlots = (): Array<SelectedImageItem | null> =>
  Array.from({ length: MAX_SELECTED_IMAGES }, () => null);

const getOptimalDisplayProportion = (
  sourceWidth: number,
  sourceHeight: number,
): ImageDisplayProportion => {
  const proportions = calculateAllProportions(sourceWidth, sourceHeight);
  const orderedCandidates = ["horizontal", "vertical", "square"] as const;
  type CandidateProportion = (typeof orderedCandidates)[number];

  return orderedCandidates.reduce<CandidateProportion>(
    (bestProportion, candidate) => {
      const bestCoverage = proportions[bestProportion].coveragePercent;
      const candidateCoverage = proportions[candidate].coveragePercent;

      return candidateCoverage > bestCoverage ? candidate : bestProportion;
    },
    "horizontal",
  );
};

interface SelectedImageItem {
  file: File;
  previewUrl: string;
  metadata: SelectedImageMetadata | null;
  displayImageProportion: ImageDisplayProportion;
}

export function ImageUploader({
  onUploadError,
  onImageMetadataChange,
  onSelectionStateChange,
  className,
  defaultShowIcons = false,
}: ImageUploaderProps) {
  const [selectedImages, setSelectedImages] = useState<
    Array<SelectedImageItem | null>
  >(createEmptySelectionSlots);
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const [showIcons, setShowIcons] = useState(defaultShowIcons);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const pendingSelectionSlotRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const selectedImagesRef = useRef<Array<SelectedImageItem | null>>(
    createEmptySelectionSlots(),
  );

  const selectedImageCount = selectedImages.filter(Boolean).length;

  const activeImage =
    typeof activeImageIndex === "number"
      ? (selectedImages[activeImageIndex] ?? null)
      : null;
  const selectedFile = activeImage?.file ?? null;
  const previewUrl = activeImage?.previewUrl ?? null;
  const selectedImageMetadata = activeImage?.metadata ?? null;
  const displayImageProportion =
    activeImage?.displayImageProportion ?? "horizontal";

  const revokePreviewUrls = useCallback(
    (images: Array<SelectedImageItem | null>) => {
      images.forEach((image) => {
        if (image) {
          URL.revokeObjectURL(image.previewUrl);
        }
      });
    },
    [],
  );

  const buildSelectedImageItem = useCallback(
    (file: File): SelectedImageItem => {
      const previewUrl = URL.createObjectURL(file);
      return {
        file,
        previewUrl,
        metadata: null,
        displayImageProportion: "horizontal",
      };
    },
    [],
  );

  const addOrReplaceSelection = useCallback(
    (file: File, preferredIndex?: number) => {
      const currentImages = selectedImagesRef.current;
      const hasExistingSelection = currentImages.some(Boolean);
      const insertionIndex =
        typeof preferredIndex === "number"
          ? Math.max(0, Math.min(preferredIndex, MAX_SELECTED_IMAGES - 1))
          : !hasExistingSelection
            ? CENTER_SLOT_INDEX
            : currentImages.findIndex((image) => image === null);

      if (insertionIndex < 0) {
        return;
      }

      const nextImage = buildSelectedImageItem(file);

      setSelectedImages((prevImages) => {
        const nextImages = [...prevImages];

        if (nextImages[insertionIndex]) {
          URL.revokeObjectURL(nextImages[insertionIndex].previewUrl);
        }

        nextImages[insertionIndex] = nextImage;

        return nextImages;
      });

      setActiveImageIndex((currentActiveIndex) => {
        const clickedEmptySlot =
          typeof preferredIndex === "number" && !currentImages[preferredIndex];

        if (hasExistingSelection && clickedEmptySlot) {
          return currentActiveIndex;
        }

        return insertionIndex;
      });
    },
    [buildSelectedImageItem],
  );

  const validateAndStoreFile = useCallback(
    (file: File, preferredIndex?: number) => {
      if (
        file.type !== "image/jpeg" &&
        file.type !== "image/png" &&
        file.type !== "image/webp"
      ) {
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        onUploadError?.(t("upload.error"));
        return;
      }

      if (
        typeof preferredIndex !== "number" &&
        selectedImageCount >= MAX_SELECTED_IMAGES
      ) {
        onUploadError?.(t("uploader.maxImagesError"));
        return;
      }

      addOrReplaceSelection(file, preferredIndex);
    },
    [addOrReplaceSelection, onUploadError, selectedImageCount],
  );

  const updateActiveImage = useCallback(
    (updater: (image: SelectedImageItem) => SelectedImageItem) => {
      setSelectedImages((prevImages) => {
        if (
          typeof activeImageIndex !== "number" ||
          activeImageIndex < 0 ||
          activeImageIndex >= prevImages.length ||
          !prevImages[activeImageIndex]
        ) {
          return prevImages;
        }

        const nextImages = [...prevImages];
        nextImages[activeImageIndex] = updater(prevImages[activeImageIndex]);
        return nextImages;
      });
    },
    [activeImageIndex],
  );

  useEffect(() => {
    setShowIcons(defaultShowIcons);
  }, [defaultShowIcons]);

  const updateSelectedImageMetadata = useCallback(
    (metadata: SelectedImageMetadata | null) => {
      updateActiveImage((image) => ({
        ...image,
        metadata,
      }));
      onImageMetadataChange?.(metadata);
    },
    [onImageMetadataChange, updateActiveImage],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      const preferredIndex = pendingSelectionSlotRef.current ?? undefined;

      pendingSelectionSlotRef.current = null;

      if (file) {
        validateAndStoreFile(file, preferredIndex);
      }

      e.currentTarget.value = "";
    },
    [validateAndStoreFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();

      const file = e.dataTransfer.files?.[0];
      if (file) {
        validateAndStoreFile(file);
      }
    },
    [validateAndStoreFile],
  );

  const handlePreviewSlotSelect = useCallback(
    (index: number) => {
      const selectedImage = selectedImages[index];

      if (selectedImage) {
        setActiveImageIndex(index);
        onImageMetadataChange?.(selectedImage.metadata ?? null);
        return;
      }

      if (index >= MAX_SELECTED_IMAGES) {
        return;
      }

      pendingSelectionSlotRef.current = index;
      fileInputRef.current?.click();
    },
    [onImageMetadataChange, selectedImages],
  );

  const handleCancel = useCallback(() => {
    setSelectedImages((prevImages) => {
      if (prevImages.some(Boolean)) {
        revokePreviewUrls(prevImages);
      }

      return createEmptySelectionSlots();
    });
    setActiveImageIndex(null);
    updateSelectedImageMetadata(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
  }, [revokePreviewUrls, updateSelectedImageMetadata]);

  const previousFilledSlotIndex = useMemo(() => {
    if (typeof activeImageIndex !== "number") {
      return null;
    }

    for (let index = activeImageIndex - 1; index >= 0; index -= 1) {
      if (selectedImages[index]) {
        return index;
      }
    }

    return null;
  }, [activeImageIndex, selectedImages]);

  const nextFilledSlotIndex = useMemo(() => {
    if (typeof activeImageIndex !== "number") {
      return null;
    }

    for (
      let index = activeImageIndex + 1;
      index < selectedImages.length;
      index += 1
    ) {
      if (selectedImages[index]) {
        return index;
      }
    }

    return null;
  }, [activeImageIndex, selectedImages]);

  const canMovePrevious = previousFilledSlotIndex !== null;
  const canMoveNext = nextFilledSlotIndex !== null;
  const hasMultipleImages = selectedImageCount > 1;

  const moveToPreviousImage = useCallback(() => {
    if (previousFilledSlotIndex === null) {
      return;
    }

    setActiveImageIndex(previousFilledSlotIndex);
    onImageMetadataChange?.(
      selectedImages[previousFilledSlotIndex]?.metadata ?? null,
    );
  }, [onImageMetadataChange, previousFilledSlotIndex, selectedImages]);

  const moveToNextImage = useCallback(() => {
    if (nextFilledSlotIndex === null) {
      return;
    }

    setActiveImageIndex(nextFilledSlotIndex);
    onImageMetadataChange?.(
      selectedImages[nextFilledSlotIndex]?.metadata ?? null,
    );
  }, [nextFilledSlotIndex, onImageMetadataChange, selectedImages]);

  const handleSliderTouchStart = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      touchStartXRef.current = event.touches[0]?.clientX ?? null;
    },
    [],
  );

  const handleSliderTouchEnd = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      const startX = touchStartXRef.current;
      const endX = event.changedTouches[0]?.clientX;

      touchStartXRef.current = null;

      if (typeof startX !== "number" || typeof endX !== "number") {
        return;
      }

      const deltaX = endX - startX;
      const swipeThreshold = 30;

      if (deltaX <= -swipeThreshold) {
        moveToNextImage();
        return;
      }

      if (deltaX >= swipeThreshold) {
        moveToPreviousImage();
      }
    },
    [moveToNextImage, moveToPreviousImage],
  );

  const coveragePercent = useMemo(() => {
    if (!selectedImageMetadata) {
      return undefined;
    }

    const proportions = calculateAllProportions(
      selectedImageMetadata.width,
      selectedImageMetadata.height,
    );

    return {
      horizontal: proportions.horizontal.coveragePercent,
      vertical: proportions.vertical.coveragePercent,
      rectangle: proportions.square.coveragePercent,
    };
  }, [selectedImageMetadata]);

  const previewFrameAspectRatio = useMemo(
    () => getTargetAspectRatio(displayImageProportion),
    [displayImageProportion],
  );

  const leftSlotIndex =
    typeof activeImageIndex === "number" && activeImageIndex > 0
      ? activeImageIndex - 1
      : null;
  const rightSlotIndex =
    typeof activeImageIndex === "number" &&
    activeImageIndex < MAX_SELECTED_IMAGES - 1
      ? activeImageIndex + 1
      : null;
  const leftSlotImage =
    typeof leftSlotIndex === "number" ? selectedImages[leftSlotIndex] : null;
  const rightSlotImage =
    typeof rightSlotIndex === "number" ? selectedImages[rightSlotIndex] : null;

  useEffect(() => {
    selectedImagesRef.current = selectedImages;
  }, [selectedImages]);

  useEffect(() => {
    onSelectionStateChange?.(selectedImageCount > 0);
  }, [onSelectionStateChange, selectedImageCount]);

  useEffect(() => {
    if (!previewUrl || !previewCanvasRef.current) {
      return;
    }

    const canvas = previewCanvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const image = new Image();
    image.onload = () => {
      const sourceWidth = image.naturalWidth || image.width;
      const sourceHeight = image.naturalHeight || image.height;

      if (sourceWidth <= 0 || sourceHeight <= 0) {
        return;
      }

      const metadata: SelectedImageMetadata = {
        width: sourceWidth,
        height: sourceHeight,
        aspectRatio: formatAspectRatio(sourceWidth, sourceHeight),
      };
      const currentSelectedImage =
        typeof activeImageIndex === "number"
          ? selectedImagesRef.current[activeImageIndex]
          : null;
      const currentDisplayImageProportion =
        currentSelectedImage?.displayImageProportion ?? displayImageProportion;
      const isInitialMetadataLoad = !currentSelectedImage?.metadata;
      const shouldAutoSelectOptimalProportion =
        isInitialMetadataLoad && currentDisplayImageProportion === "horizontal";
      const nextDisplayImageProportion = shouldAutoSelectOptimalProportion
        ? getOptimalDisplayProportion(sourceWidth, sourceHeight)
        : currentDisplayImageProportion;

      updateActiveImage((selectedImage) => ({
        ...selectedImage,
        metadata,
        displayImageProportion: shouldAutoSelectOptimalProportion
          ? nextDisplayImageProportion
          : selectedImage.displayImageProportion,
      }));
      onImageMetadataChange?.(metadata);

      const crop = calculateMaxCenteredCrop({
        sourceWidth,
        sourceHeight,
        proportion: nextDisplayImageProportion,
      });

      // Determine the display size of the canvas and set backing store size for crisp rendering
      const rect = canvas.getBoundingClientRect();
      const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
      const displayWidth = Math.max(1, Math.round(rect.width));
      const displayHeight = Math.max(1, Math.round(rect.height));

      // Set CSS display size to match layout, and set backing pixel size for high-DPI
      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${displayHeight}px`;
      canvas.width = Math.round(displayWidth * dpr);
      canvas.height = Math.round(displayHeight * dpr);

      if (
        typeof HTMLImageElement !== "undefined" &&
        !(image instanceof HTMLImageElement)
      ) {
        return;
      }

      // Scale the cropped source to cover the destination (object-fit: cover) and center it
      const srcW = crop.cropWidth;
      const srcH = crop.cropHeight;
      const dstW = canvas.width;
      const dstH = canvas.height;

      const scale = Math.max(dstW / srcW, dstH / srcH);
      const drawW = Math.round(srcW * scale);
      const drawH = Math.round(srcH * scale);

      const offsetX = Math.round((dstW - drawW) / 2);
      const offsetY = Math.round((dstH - drawH) / 2);

      context.clearRect(0, 0, dstW, dstH);
      // drawImage(source, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
      context.drawImage(
        image,
        crop.cropX,
        crop.cropY,
        crop.cropWidth,
        crop.cropHeight,
        offsetX,
        offsetY,
        drawW,
        drawH,
      );
    };

    image.src = previewUrl;
  }, [
    activeImageIndex,
    displayImageProportion,
    onImageMetadataChange,
    previewUrl,
    updateActiveImage,
  ]);

  useEffect(() => {
    return () => {
      if (selectedImagesRef.current.some(Boolean)) {
        revokePreviewUrls(selectedImagesRef.current);
      }
    };
  }, [revokePreviewUrls]);

  if (!selectedFile || !previewUrl) {
    return (
      <UploaderDropArea
        showIcons={showIcons}
        className={className}
        fileInputRef={fileInputRef}
        cameraInputRef={cameraInputRef}
        onFileSelect={handleFileSelect}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onShowIcons={() => setShowIcons(true)}
      />
    );
  }

  return (
    <Card className="mx-auto flex h-full w-full max-w-2xl md:max-w-4xl lg:max-w-6xl xl:max-w-7xl flex-col border-0 bg-transparent! shadow-none! ring-0!">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{t("uploader.adjustImage")}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="text-destructive hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col space-y-4 overflow-hidden">
        <div
          className="flex-1 flex justify-center items-center bg-transparent rounded-lg min-h-0 overflow-visible"
          data-testid="uploader-preview-slider"
        >
          <button
            type="button"
            onClick={() => {
              if (typeof leftSlotIndex === "number") {
                handlePreviewSlotSelect(leftSlotIndex);
              }
            }}
            disabled={leftSlotIndex === null}
            data-testid="uploader-slider-side-left"
            aria-label={t("uploader.previousImage")}
            className="h-full w-16 md:w-28 lg:w-40 xl:w-48 shrink-0 overflow-hidden rounded-none bg-transparent flex items-start justify-end disabled:cursor-default disabled:opacity-70 md:-mr-8 lg:-mr-10"
          >
            <div
              data-testid="uploader-slider-side-left-preview-frame"
              className={`flex h-full w-[280px] flex-shrink-0 md:w-[300px] lg:w-[320px] items-start justify-end overflow-hidden rounded-none border-0`}
              style={{
                aspectRatio: String(previewFrameAspectRatio),
              }}
            >
              {leftSlotImage ? (
                <img
                  src={leftSlotImage.previewUrl}
                  alt={t("uploader.selectImageSlot", {
                    index:
                      typeof leftSlotIndex === "number"
                        ? String(leftSlotIndex + 1)
                        : "",
                  })}
                  className="h-full w-full object-cover object-center"
                  draggable={false}
                />
              ) : null}
            </div>
          </button>

          <div className="relative mx-0 flex-1 h-full min-w-0 flex items-center justify-center">
            <div
              className="relative h-full w-full md:w-[85%] lg:w-[80%] xl:w-[78%] max-w-640 max-h-full overflow-hidden rounded-none border-0 flex items-center justify-center"
              data-testid="selected-image-preview-frame"
              style={{ aspectRatio: String(previewFrameAspectRatio) }}
              onTouchStart={handleSliderTouchStart}
              onTouchEnd={handleSliderTouchEnd}
            >
              {hasMultipleImages && (
                <button
                  type="button"
                  onClick={moveToPreviousImage}
                  disabled={!canMovePrevious}
                  aria-label={t("uploader.previousImage")}
                  data-testid="uploader-slider-prev"
                  className="absolute left-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-md border border-border/40 bg-background/90 text-muted-foreground disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}

              <canvas
                ref={previewCanvasRef}
                role="img"
                aria-label="Preview"
                data-testid="selected-image-preview-canvas"
                className="w-full h-full"
                style={{
                  userSelect: "none",
                  WebkitUserSelect: "none",
                }}
              />

              {hasMultipleImages && (
                <button
                  type="button"
                  onClick={moveToNextImage}
                  disabled={!canMoveNext}
                  aria-label={t("uploader.nextImage")}
                  data-testid="uploader-slider-next"
                  className="absolute right-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-md border border-border/40 bg-background/90 text-muted-foreground disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (typeof rightSlotIndex === "number") {
                handlePreviewSlotSelect(rightSlotIndex);
              }
            }}
            disabled={rightSlotIndex === null}
            data-testid="uploader-slider-side-right"
            aria-label={t("uploader.nextImage")}
            className="h-full w-16 md:w-28 lg:w-40 xl:w-48 shrink-0 overflow-hidden rounded-none bg-transparent disabled:cursor-default disabled:opacity-70 md:-ml-8 lg:-ml-10"
          >
            <div
              data-testid="uploader-slider-side-right-preview-frame"
              className={`flex h-full w-[280px] flex-shrink-0 md:w-[300px] lg:w-[320px] items-center justify-start overflow-hidden rounded-none border-0`}
              style={{
                aspectRatio: String(previewFrameAspectRatio),
              }}
            >
              {rightSlotImage ? (
                <img
                  src={rightSlotImage.previewUrl}
                  alt={
                    typeof rightSlotIndex === "number"
                      ? t("uploader.selectImageSlot", {
                          index: String(rightSlotIndex + 1),
                        })
                      : ""
                  }
                  className="h-full w-full object-cover object-center"
                  draggable={false}
                />
              ) : null}
            </div>
          </button>
        </div>

        <div className="text-center text-xs text-muted-foreground">
          {t("uploader.multiImageHint")}
        </div>

        <UploaderTools
          onSelectProportion={(proportion) => {
            updateActiveImage((image) => ({
              ...image,
              displayImageProportion:
                proportion === "rectangle" ? "square" : proportion,
            }));
          }}
          coveragePercent={coveragePercent}
          selectedProportion={
            displayImageProportion === "square"
              ? "rectangle"
              : displayImageProportion
          }
        />

        {selectedImageMetadata && (
          <div
            className="text-center text-sm text-muted-foreground"
            data-testid="image-proportions"
          >
            {selectedImageMetadata.width} × {selectedImageMetadata.height} •{" "}
            {selectedImageMetadata.aspectRatio}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
