import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";
import { t } from "@/locales/i18n";
import UploaderDropArea from "./uploader-drop-area";
import UploaderTools from "./uploader-tools";
import UploaderPreviewSlider from "./uploader-preview-slider";
import { useImageSliderNavigation } from "./use-image-slider-navigation";
import { usePreviewSliderSlots } from "./use-preview-slider-slots";
import { useSliderSwipeNavigation } from "./use-slider-swipe-navigation";
import {
  calculateAllProportions,
  getOptimalDisplayProportion,
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
  externalResetTrigger?: number;
}

const MAX_SELECTED_IMAGES = 3;
const CENTER_SLOT_INDEX = Math.floor(MAX_SELECTED_IMAGES / 2);
const SHOW_UPLOADER_DEBUG = import.meta.env.VITE_SHOW_UPLOADER_DEBUG === "true";

const createEmptySelectionSlots = (): Array<SelectedImageItem | null> =>
  Array.from({ length: MAX_SELECTED_IMAGES }, () => null);

export interface SelectedImageItem {
  file: File;
  previewUrl: string;
  metadata: SelectedImageMetadata | null;
  displayImageProportion: ImageDisplayProportion;
  autoSelectOptimalPending: boolean;
}

export function ImageUploader({
  onUploadError,
  onImageMetadataChange,
  onSelectionStateChange,
  className,
  defaultShowIcons = false,
  externalResetTrigger,
}: ImageUploaderProps) {
  const [selectedImages, setSelectedImages] = useState<
    Array<SelectedImageItem | null>
  >(createEmptySelectionSlots);
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const [showIcons, setShowIcons] = useState(defaultShowIcons);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const pendingSelectionSlotRef = useRef<number | null>(null);
  const lastExternalResetTriggerRef = useRef<number | undefined>(
    externalResetTrigger,
  );
  const activeImageIndexRef = useRef<number | null>(null);
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
    (file: File, autoSelectOptimalPending = true): SelectedImageItem => {
      const previewUrl = URL.createObjectURL(file);
      return {
        file,
        previewUrl,
        metadata: null,
        displayImageProportion: "horizontal",
        autoSelectOptimalPending,
      };
    },
    [],
  );

  const addOrReplaceSelection = useCallback(
    (file: File, preferredIndex?: number) => {
      const currentImages = selectedImagesRef.current;
      const hasExistingSelection = currentImages.some(Boolean);
      const clickedEmptySlot =
        typeof preferredIndex === "number" && !currentImages[preferredIndex];
      const insertionIndex =
        typeof preferredIndex === "number"
          ? Math.max(0, Math.min(preferredIndex, MAX_SELECTED_IMAGES - 1))
          : !hasExistingSelection
            ? CENTER_SLOT_INDEX
            : currentImages.findIndex((image) => image === null);

      if (insertionIndex < 0) {
        return;
      }

      const shouldAutoSelectOptimalWhenActive = !(
        hasExistingSelection && clickedEmptySlot
      );
      const nextImage = buildSelectedImageItem(
        file,
        shouldAutoSelectOptimalWhenActive,
      );

      setSelectedImages((prevImages) => {
        const nextImages = [...prevImages];

        if (nextImages[insertionIndex]) {
          URL.revokeObjectURL(nextImages[insertionIndex].previewUrl);
        }

        nextImages[insertionIndex] = nextImage;

        return nextImages;
      });

      setActiveImageIndex((currentActiveIndex) => {
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

        const currentImage = prevImages[activeImageIndex];
        const updatedImage = updater(currentImage);

        if (updatedImage === currentImage) {
          return prevImages;
        }

        const nextImages = [...prevImages];
        nextImages[activeImageIndex] = updatedImage;
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

  const handleMetadataResolved = useCallback(
    ({
      metadata,
      nextDisplayImageProportion,
      shouldAutoSelectOptimalProportion,
    }: {
      metadata: SelectedImageMetadata;
      nextDisplayImageProportion: ImageDisplayProportion;
      shouldAutoSelectOptimalProportion: boolean;
    }) => {
      updateActiveImage((selectedImage) => {
        const currentMetadata = selectedImage.metadata;
        const metadataUnchanged =
          !!currentMetadata &&
          currentMetadata.width === metadata.width &&
          currentMetadata.height === metadata.height &&
          currentMetadata.aspectRatio === metadata.aspectRatio;

        const resolvedDisplayImageProportion = shouldAutoSelectOptimalProportion
          ? nextDisplayImageProportion
          : selectedImage.displayImageProportion;
        const proportionUnchanged =
          resolvedDisplayImageProportion ===
          selectedImage.displayImageProportion;

        if (metadataUnchanged && proportionUnchanged) {
          return selectedImage;
        }

        return {
          ...selectedImage,
          metadata: metadataUnchanged ? currentMetadata : metadata,
          displayImageProportion: resolvedDisplayImageProportion,
          autoSelectOptimalPending: false,
        };
      });
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

  const handleRemoveImageSlot = useCallback(
    (index: number) => {
      const currentImages = selectedImagesRef.current;

      if (index < 0 || index >= currentImages.length || !currentImages[index]) {
        return;
      }

      const nextImages = [...currentImages];
      const removedImage = nextImages[index];

      if (removedImage) {
        URL.revokeObjectURL(removedImage.previewUrl);
      }

      nextImages[index] = null;

      const filledIndexes = nextImages.reduce<number[]>(
        (acc, image, imageIndex) => {
          if (image) {
            acc.push(imageIndex);
          }

          return acc;
        },
        [],
      );

      if (filledIndexes.length === 0) {
        setSelectedImages(nextImages);
        setActiveImageIndex(null);
        activeImageIndexRef.current = null;
        onImageMetadataChange?.(null);
        return;
      }

      // Read active index from a ref so remove handlers always use the latest value,
      // even when a removal happens right after navigation in the same render cycle.
      let nextActiveIndex = activeImageIndexRef.current;

      if (nextActiveIndex === index || nextActiveIndex === null) {
        const previousFilledSlot = filledIndexes
          .filter((filledIndex) => filledIndex < index)
          .at(-1);
        const nextFilledSlot = filledIndexes.find(
          (filledIndex) => filledIndex > index,
        );

        nextActiveIndex =
          typeof previousFilledSlot === "number"
            ? previousFilledSlot
            : typeof nextFilledSlot === "number"
              ? nextFilledSlot
              : (filledIndexes[0] ?? null);
      }

      setSelectedImages(nextImages);
      setActiveImageIndex(nextActiveIndex);
      activeImageIndexRef.current = nextActiveIndex;
      onImageMetadataChange?.(
        typeof nextActiveIndex === "number"
          ? (nextImages[nextActiveIndex]?.metadata ?? null)
          : null,
      );
    },
    [onImageMetadataChange],
  );

  const handleRemoveActiveImage = useCallback(() => {
    const currentActiveIndex = activeImageIndexRef.current;

    if (typeof currentActiveIndex === "number") {
      handleRemoveImageSlot(currentActiveIndex);
    }
  }, [handleRemoveImageSlot]);

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

  const {
    previousFilledSlotIndex,
    nextFilledSlotIndex,
    canMovePrevious,
    canMoveNext,
  } = useImageSliderNavigation({
    selectedImages,
    activeImageIndex,
  });

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

  const {
    onTouchStart: handleSliderTouchStart,
    onTouchEnd: handleSliderTouchEnd,
  } = useSliderSwipeNavigation({
    onSwipeLeft: moveToNextImage,
    onSwipeRight: moveToPreviousImage,
  });

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

  const debugCoverageRows = useMemo(() => {
    if (!coveragePercent) {
      return [];
    }

    return [
      {
        key: "horizontal",
        label: t("uploader.debugHorizontalCoverage"),
        value: coveragePercent.horizontal,
      },
      {
        key: "vertical",
        label: t("uploader.debugVerticalCoverage"),
        value: coveragePercent.vertical,
      },
      {
        key: "rectangle",
        label: t("uploader.debugRectangleCoverage"),
        value: coveragePercent.rectangle,
      },
    ];
  }, [coveragePercent]);

  const bestDisplayImageProportion = useMemo(() => {
    if (!selectedImageMetadata) {
      return null;
    }

    return getOptimalDisplayProportion(
      selectedImageMetadata.width,
      selectedImageMetadata.height,
    );
  }, [selectedImageMetadata]);

  const previewFrameAspectRatio = useMemo(
    () => getTargetAspectRatio(displayImageProportion),
    [displayImageProportion],
  );

  const { leftSlotIndex, rightSlotIndex, leftSlotImage, rightSlotImage } =
    usePreviewSliderSlots({
      selectedImages,
      activeImageIndex,
    });

  useEffect(() => {
    selectedImagesRef.current = selectedImages;
  }, [selectedImages]);

  useEffect(() => {
    activeImageIndexRef.current = activeImageIndex;
  }, [activeImageIndex]);

  useEffect(() => {
    onSelectionStateChange?.(selectedImageCount > 0);
  }, [onSelectionStateChange, selectedImageCount]);

  useEffect(() => {
    return () => {
      if (selectedImagesRef.current.some(Boolean)) {
        revokePreviewUrls(selectedImagesRef.current);
      }
    };
  }, [revokePreviewUrls]);

  useEffect(() => {
    if (typeof externalResetTrigger !== "number") {
      return;
    }

    const lastTrigger = lastExternalResetTriggerRef.current;
    if (
      typeof lastTrigger === "number" &&
      externalResetTrigger !== lastTrigger
    ) {
      handleCancel();
    }

    lastExternalResetTriggerRef.current = externalResetTrigger;
  }, [externalResetTrigger, handleCancel]);

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
        <div className="grid min-h-9 grid-cols-[1fr_auto_1fr] items-center gap-2">
          <CardTitle className="truncate">
            {t("uploader.adjustImage")}
          </CardTitle>
          <button
            type="button"
            onClick={handleRemoveActiveImage}
            aria-label={t("uploader.removeImageSlot", {
              index:
                typeof activeImageIndex === "number"
                  ? String(activeImageIndex + 1)
                  : "",
            })}
            data-testid="uploader-remove-active-image"
            className="z-10 inline-flex items-center justify-center gap-1.5 justify-self-center rounded-full border border-border/70 bg-background/95 px-3 py-1.5 text-xs font-semibold tracking-[0.01em] text-foreground shadow-md backdrop-blur-sm transition-all duration-200 hover:border-border hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t("uploader.clearSlot")}</span>
          </button>
          <span aria-hidden="true" />
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col space-y-5 overflow-hidden pb-5">
        <UploaderPreviewSlider
          slots={selectedImages}
          activeImage={activeImage}
          activeImageIndex={activeImageIndex}
          selectedImageMetadata={selectedImageMetadata}
          bestProportion={bestDisplayImageProportion}
          userSelectedProportion={displayImageProportion}
          previewFrameAspectRatio={previewFrameAspectRatio}
          canMovePrevious={canMovePrevious}
          canMoveNext={canMoveNext}
          leftSlotIndex={leftSlotIndex}
          rightSlotIndex={rightSlotIndex}
          leftSlotImage={leftSlotImage}
          rightSlotImage={rightSlotImage}
          onSelectSlot={handlePreviewSlotSelect}
          onTouchStart={handleSliderTouchStart}
          onTouchEnd={handleSliderTouchEnd}
          onMetadataResolved={handleMetadataResolved}
        />

        <p className="w-full px-1 text-center text-xs leading-relaxed text-muted-foreground">
          {t("uploader.multiImageHint")}
        </p>

        <div className="rounded-xl border border-border/60 bg-background/75 px-3 py-3 sm:px-4">
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
            showCoverageDetails={SHOW_UPLOADER_DEBUG}
          />
        </div>

        {SHOW_UPLOADER_DEBUG && selectedImageMetadata && (
          <div
            className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-950"
            data-testid="uploader-proportion-debug"
          >
            <p className="font-semibold uppercase tracking-[0.12em] text-[11px] text-amber-700">
              {t("uploader.debugTitle")}
            </p>
            <div className="mt-2 space-y-1.5">
              <p>
                <span className="font-medium">
                  {t("uploader.debugImageSize")}:{" "}
                </span>
                {selectedImageMetadata.width} × {selectedImageMetadata.height}
              </p>
              <p>
                <span className="font-medium">
                  {t("uploader.debugImageRatio")}:{" "}
                </span>
                {selectedImageMetadata.aspectRatio}
              </p>
              <p>
                <span className="font-medium">
                  {t("uploader.debugCurrentFrame")}:{" "}
                </span>
                {displayImageProportion}
              </p>
              <p>
                <span className="font-medium">
                  {t("uploader.debugSuggestedFrame")}:{" "}
                </span>
                {bestDisplayImageProportion ?? t("uploader.debugUnknown")}
              </p>
              {debugCoverageRows.map(({ key, label, value }) => (
                <p key={key}>
                  <span className="font-medium">{label}: </span>
                  {typeof value === "number" && !Number.isNaN(value)
                    ? `${value.toFixed(2)}%`
                    : t("uploader.debugUnknown")}
                </p>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
