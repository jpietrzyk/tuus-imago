import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
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
}

const MAX_SELECTED_IMAGES = 3;
const CENTER_SLOT_INDEX = Math.floor(MAX_SELECTED_IMAGES / 2);

const createEmptySelectionSlots = (): Array<SelectedImageItem | null> =>
  Array.from({ length: MAX_SELECTED_IMAGES }, () => null);

export interface SelectedImageItem {
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
  const pendingSelectionSlotRef = useRef<number | null>(null);
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
      updateActiveImage((selectedImage) => ({
        ...selectedImage,
        metadata,
        displayImageProportion: shouldAutoSelectOptimalProportion
          ? nextDisplayImageProportion
          : selectedImage.displayImageProportion,
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
        <UploaderPreviewSlider
          activeImage={activeImage}
          activeImageIndex={activeImageIndex}
          selectedImageMetadata={selectedImageMetadata}
          bestProportion={bestDisplayImageProportion}
          userSelectedProportion={displayImageProportion}
          previewFrameAspectRatio={previewFrameAspectRatio}
          hasMultipleImages={hasMultipleImages}
          canMovePrevious={canMovePrevious}
          canMoveNext={canMoveNext}
          leftSlotIndex={leftSlotIndex}
          rightSlotIndex={rightSlotIndex}
          leftSlotImage={leftSlotImage}
          rightSlotImage={rightSlotImage}
          onSelectSlot={handlePreviewSlotSelect}
          onMovePrevious={moveToPreviousImage}
          onMoveNext={moveToNextImage}
          onRemoveActiveImage={handleRemoveActiveImage}
          onTouchStart={handleSliderTouchStart}
          onTouchEnd={handleSliderTouchEnd}
          onMetadataResolved={handleMetadataResolved}
        />

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
