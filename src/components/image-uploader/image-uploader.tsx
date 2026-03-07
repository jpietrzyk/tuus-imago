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
  className?: string;
  skipCropStep?: boolean;
  defaultShowIcons?: boolean;
}

const MAX_SELECTED_IMAGES = 3;

interface SelectedImageItem {
  file: File;
  previewUrl: string;
  metadata: SelectedImageMetadata | null;
  displayImageProportion: ImageDisplayProportion;
}

export function ImageUploader({
  onUploadError,
  onImageMetadataChange,
  className,
  defaultShowIcons = false,
}: ImageUploaderProps) {
  const [selectedImages, setSelectedImages] = useState<SelectedImageItem[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showIcons, setShowIcons] = useState(defaultShowIcons);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const pendingSelectionSlotRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const selectedImagesRef = useRef<SelectedImageItem[]>([]);

  const activeImage = selectedImages[activeImageIndex] ?? null;
  const selectedFile = activeImage?.file ?? null;
  const previewUrl = activeImage?.previewUrl ?? null;
  const selectedImageMetadata = activeImage?.metadata ?? null;
  const displayImageProportion =
    activeImage?.displayImageProportion ?? "horizontal";

  const revokePreviewUrls = useCallback((images: SelectedImageItem[]) => {
    images.forEach((image) => {
      URL.revokeObjectURL(image.previewUrl);
    });
  }, []);

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
      const nextImage = buildSelectedImageItem(file);

      setSelectedImages((prevImages) => {
        const nextImages = [...prevImages];
        const insertionIndex =
          typeof preferredIndex === "number"
            ? Math.max(0, Math.min(preferredIndex, MAX_SELECTED_IMAGES - 1))
            : Math.min(prevImages.length, MAX_SELECTED_IMAGES - 1);

        if (insertionIndex < nextImages.length) {
          URL.revokeObjectURL(nextImages[insertionIndex].previewUrl);
          nextImages[insertionIndex] = nextImage;
        } else if (nextImages.length < MAX_SELECTED_IMAGES) {
          nextImages.push(nextImage);
        }

        return nextImages.slice(0, MAX_SELECTED_IMAGES);
      });

      const nextActiveIndex =
        typeof preferredIndex === "number"
          ? Math.max(0, Math.min(preferredIndex, MAX_SELECTED_IMAGES - 1))
          : Math.min(selectedImages.length, MAX_SELECTED_IMAGES - 1);

      setActiveImageIndex(nextActiveIndex);
    },
    [buildSelectedImageItem, selectedImages.length],
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
        selectedImages.length >= MAX_SELECTED_IMAGES
      ) {
        onUploadError?.(t("uploader.maxImagesError"));
        return;
      }

      addOrReplaceSelection(file, preferredIndex);
    },
    [addOrReplaceSelection, onUploadError, selectedImages.length],
  );

  const updateActiveImage = useCallback(
    (updater: (image: SelectedImageItem) => SelectedImageItem) => {
      setSelectedImages((prevImages) => {
        if (activeImageIndex < 0 || activeImageIndex >= prevImages.length) {
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
      if (index < selectedImages.length) {
        setActiveImageIndex(index);
        onImageMetadataChange?.(selectedImages[index]?.metadata ?? null);
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
      if (prevImages.length > 0) {
        revokePreviewUrls(prevImages);
      }

      return [];
    });
    setActiveImageIndex(0);
    updateSelectedImageMetadata(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
  }, [revokePreviewUrls, updateSelectedImageMetadata]);

  const canMovePrevious = activeImageIndex > 0;
  const canMoveNext = activeImageIndex < selectedImages.length - 1;

  const moveToPreviousImage = useCallback(() => {
    if (!canMovePrevious) {
      return;
    }

    const nextIndex = activeImageIndex - 1;
    setActiveImageIndex(nextIndex);
    onImageMetadataChange?.(selectedImages[nextIndex]?.metadata ?? null);
  }, [
    activeImageIndex,
    canMovePrevious,
    onImageMetadataChange,
    selectedImages,
  ]);

  const moveToNextImage = useCallback(() => {
    if (!canMoveNext) {
      return;
    }

    const nextIndex = activeImageIndex + 1;
    setActiveImageIndex(nextIndex);
    onImageMetadataChange?.(selectedImages[nextIndex]?.metadata ?? null);
  }, [activeImageIndex, canMoveNext, onImageMetadataChange, selectedImages]);

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

  const leftSlotIndex = activeImageIndex > 0 ? activeImageIndex - 1 : null;
  const rightSlotIndex =
    activeImageIndex < MAX_SELECTED_IMAGES - 1 ? activeImageIndex + 1 : null;
  const leftSlotImage =
    typeof leftSlotIndex === "number" ? selectedImages[leftSlotIndex] : null;
  const rightSlotImage =
    typeof rightSlotIndex === "number" ? selectedImages[rightSlotIndex] : null;

  useEffect(() => {
    selectedImagesRef.current = selectedImages;
  }, [selectedImages]);

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

      updateSelectedImageMetadata({
        width: sourceWidth,
        height: sourceHeight,
        aspectRatio: formatAspectRatio(sourceWidth, sourceHeight),
      });

      const crop = calculateMaxCenteredCrop({
        sourceWidth,
        sourceHeight,
        proportion: displayImageProportion,
      });

      canvas.width = crop.outputWidth;
      canvas.height = crop.outputHeight;

      if (
        typeof HTMLImageElement !== "undefined" &&
        !(image instanceof HTMLImageElement)
      ) {
        return;
      }

      context.clearRect(0, 0, crop.outputWidth, crop.outputHeight);
      context.drawImage(
        image,
        crop.cropX,
        crop.cropY,
        crop.cropWidth,
        crop.cropHeight,
        0,
        0,
        crop.outputWidth,
        crop.outputHeight,
      );
    };

    image.src = previewUrl;
  }, [previewUrl, displayImageProportion, updateSelectedImageMetadata]);

  useEffect(() => {
    return () => {
      if (selectedImagesRef.current.length > 0) {
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
    <Card className="w-full max-w-2xl mx-auto h-full bg-transparent! flex flex-col">
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
          className="flex-1 flex justify-center items-center bg-transparent rounded-lg p-4 min-h-0"
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
            className="h-full w-16 shrink-0 overflow-hidden rounded-md border border-dashed border-border/40 bg-muted/20 disabled:cursor-default disabled:opacity-80"
          >
            {leftSlotImage ? (
              <div
                data-testid="uploader-slider-side-left-preview-frame"
                className="flex h-full w-auto max-w-none items-center justify-end overflow-hidden"
                style={{
                  aspectRatio: String(previewFrameAspectRatio),
                }}
              >
                <img
                  src={leftSlotImage.previewUrl}
                  alt={t("uploader.selectImageSlot", {
                    index: String(leftSlotIndex + 1),
                  })}
                  className="h-full w-full object-cover"
                  draggable={false}
                />
              </div>
            ) : null}
          </button>

          <div className="relative mx-3 flex-1 h-full min-w-0 flex items-center justify-center">
            <div
              className="relative h-full w-auto max-w-full max-h-full overflow-hidden rounded-lg border border-border/40 flex items-center justify-center"
              data-testid="selected-image-preview-frame"
              style={{ aspectRatio: String(previewFrameAspectRatio) }}
              onTouchStart={handleSliderTouchStart}
              onTouchEnd={handleSliderTouchEnd}
            >
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

              <canvas
                ref={previewCanvasRef}
                role="img"
                aria-label="Preview"
                data-testid="selected-image-preview-canvas"
                className="max-w-full max-h-full w-auto h-auto"
                style={{
                  userSelect: "none",
                  WebkitUserSelect: "none",
                }}
              />

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
            className="h-full w-16 shrink-0 overflow-hidden rounded-md border border-dashed border-border/40 bg-muted/20 disabled:cursor-default disabled:opacity-80"
          >
            {rightSlotImage ? (
              <div
                data-testid="uploader-slider-side-right-preview-frame"
                className="flex h-full w-auto max-w-none items-center justify-start overflow-hidden"
                style={{
                  aspectRatio: String(previewFrameAspectRatio),
                }}
              >
                <img
                  src={rightSlotImage.previewUrl}
                  alt={
                    typeof rightSlotIndex === "number"
                      ? t("uploader.selectImageSlot", {
                          index: String(rightSlotIndex + 1),
                        })
                      : ""
                  }
                  className="h-full w-full object-cover"
                  draggable={false}
                />
              </div>
            ) : null}
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
