import {
  forwardRef,
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
  useImperativeHandle,
} from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { X } from "lucide-react";
import { t } from "@/locales/i18n";
import { uploadImageToCloudinary } from "@/lib/cloudinary-upload";
import {
  getTransformedPreviewUrl,
  type AiAdjustments,
} from "@/lib/image-transformations";
import UploaderDropArea from "./uploader-drop-area";
import UploaderPreviewSlider from "./uploader-preview-slider";
import UploaderPreviewToolsPanel from "./uploader-preview-tools-panel";
import { useImageSliderNavigation } from "./use-image-slider-navigation";
import { usePreviewSliderSlots } from "./use-preview-slider-slots";
import { useSliderSwipeNavigation } from "./use-slider-swipe-navigation";
import {
  calculateAllProportions,
  getOptimalDisplayProportion,
  getTargetAspectRatio,
  type ImageDisplayProportion,
} from "./image-proportion-calculator";
import { splitImageIntoVerticalThirdFiles } from "./split-image-into-thirds";

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
  onOrderableSlotsChange?: (slots: OrderableSlotSummary[]) => void;
  onUploadProgress?: (progress: {
    currentSlotIndex: number;
    slotIndex: number;
    currentStep: number;
    totalSlots: number;
    currentSlotKey: UploadSlotKey;
    slotProgress: number;
  }) => void;
  isUploadOverlayVisible?: boolean;
  uploadProgress?: number;
  uploadProgressLabel?: string;
  uploadingSlotIndex?: number | null;
  className?: string;
  skipCropStep?: boolean;
  defaultShowIcons?: boolean;
  externalResetTrigger?: number;
  showDebugData?: boolean;
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
  autoSelectOptimalPending?: boolean;
  previewEffects: {
    brightness: number;
    contrast: number;
    removeBackground?: boolean;
    enhance?: boolean;
  };
  uploadedAsset?: {
    publicId: string;
    secureUrl: string;
    sourceFingerprint: string;
  };
}

export type UploadSlotKey = "left" | "center" | "right";

export interface OrderableSlotSummary {
  slotIndex: number;
  slotKey: UploadSlotKey;
  aspectRatio: string | null;
  displayImageProportion: ImageDisplayProportion;
}

export interface UploadedSlotResult {
  slotIndex: number;
  slotKey: UploadSlotKey;
  transformations: ImageTransformations;
  aiAdjustments?: AiAdjustments;
  transformedUrl?: string;
  publicId?: string;
  secureUrl?: string;
  error?: string;
}

export interface BatchUploadSummary {
  results: UploadedSlotResult[];
  successCount: number;
  failureCount: number;
  totalCount: number;
}

export interface ImageUploaderHandle {
  uploadFilledSlots: () => Promise<BatchUploadSummary>;
}

const SLOT_KEYS: UploadSlotKey[] = ["left", "center", "right"];

function getUploadTransformations(
  image: SelectedImageItem,
): ImageTransformations {
  return {
    rotation: 0,
    flipHorizontal: false,
    flipVertical: false,
    brightness: image.previewEffects.brightness,
    contrast: image.previewEffects.contrast,
    grayscale: 0,
    blur: 0,
  };
}

function getAiAdjustments(image: SelectedImageItem): AiAdjustments | null {
  if (!image.previewEffects.removeBackground && !image.previewEffects.enhance) {
    return null;
  }

  return {
    enhance: !!image.previewEffects.enhance,
    removeBackground: !!image.previewEffects.removeBackground,
    upscale: false,
    restore: false,
  };
}

function getFileSourceFingerprint(file: File): string {
  return [
    file.name,
    String(file.size),
    String(file.lastModified),
    file.type,
  ].join("::");
}

function getReusableUploadedAsset(image: SelectedImageItem) {
  if (!image.uploadedAsset) {
    return null;
  }

  return image.uploadedAsset.sourceFingerprint ===
    getFileSourceFingerprint(image.file)
    ? image.uploadedAsset
    : null;
}

function getTransformedImagePreviewUrl(image: SelectedImageItem): string {
  const reusableUploadedAsset = getReusableUploadedAsset(image);

  if (!reusableUploadedAsset) {
    return image.previewUrl;
  }

  return getTransformedPreviewUrl(
    reusableUploadedAsset.secureUrl,
    null,
    undefined,
    getAiAdjustments(image),
  );
}

export const ImageUploader = forwardRef<
  ImageUploaderHandle,
  ImageUploaderProps
>(function ImageUploader(
  {
    onUploadError,
    onImageMetadataChange,
    onSelectionStateChange,
    onOrderableSlotsChange,
    onUploadProgress,
    isUploadOverlayVisible = false,
    uploadProgress = 0,
    uploadProgressLabel,
    uploadingSlotIndex = null,
    className,
    defaultShowIcons = false,
    externalResetTrigger,
    showDebugData = true,
  }: ImageUploaderProps,
  ref,
) {
  const [selectedImages, setSelectedImages] = useState<
    Array<SelectedImageItem | null>
  >(createEmptySelectionSlots);
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const [busyBackgroundUploadSlots, setBusyBackgroundUploadSlots] = useState<
    Set<number>
  >(() => new Set());
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
  const backgroundUploadPromisesRef = useRef(new Map<number, Promise<void>>());

  const selectedImageCount = selectedImages.filter(Boolean).length;
  const shouldShowUploaderDebugData = SHOW_UPLOADER_DEBUG && showDebugData;

  const activeImage =
    typeof activeImageIndex === "number"
      ? (selectedImages[activeImageIndex] ?? null)
      : null;
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
        previewEffects: {
          brightness: 0,
          contrast: 0,
          removeBackground: false,
          enhance: false,
        },
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

  const updateActiveImageEffect = useCallback(
    (effectName: "brightness" | "contrast", value: number) => {
      updateActiveImage((image) => ({
        ...image,
        previewEffects: {
          ...image.previewEffects,
          [effectName]: value,
        },
      }));
    },
    [updateActiveImage],
  );

  const setSlotRemoveBackground = useCallback(
    (slotIndex: number, enabled: boolean) => {
      setSelectedImages((prevImages) => {
        const image = prevImages[slotIndex];

        if (!image) {
          return prevImages;
        }

        if ((image.previewEffects.removeBackground ?? false) === enabled) {
          return prevImages;
        }

        const nextImages = [...prevImages];
        nextImages[slotIndex] = {
          ...image,
          previewEffects: {
            ...image.previewEffects,
            removeBackground: enabled,
          },
        };

        return nextImages;
      });
    },
    [],
  );

  const uploadSlotIfNeeded = useCallback(async (slotIndex: number) => {
    const currentImage = selectedImagesRef.current[slotIndex];
    if (!currentImage || getReusableUploadedAsset(currentImage)) {
      return;
    }

    const existingUpload = backgroundUploadPromisesRef.current.get(slotIndex);
    if (existingUpload) {
      return existingUpload;
    }

    const uploadPromise = (async () => {
      setBusyBackgroundUploadSlots((prevBusySlots) => {
        if (prevBusySlots.has(slotIndex)) {
          return prevBusySlots;
        }

        const nextBusySlots = new Set(prevBusySlots);
        nextBusySlots.add(slotIndex);
        return nextBusySlots;
      });

      try {
        const slotKey = SLOT_KEYS[slotIndex] ?? "center";
        const transformations = getUploadTransformations(currentImage);
        const aiAdjustments = getAiAdjustments(currentImage);
        const uploaded = await uploadImageToCloudinary({
          file: currentImage.file,
          transformations,
          aiAdjustments,
          context: `slot=${slotKey}`,
        });

        setSelectedImages((prevImages) => {
          const image = prevImages[slotIndex];
          if (!image || image.file !== currentImage.file) {
            return prevImages;
          }

          const nextImages = [...prevImages];
          nextImages[slotIndex] = {
            ...image,
            uploadedAsset: {
              publicId: uploaded.asset.public_id,
              secureUrl: uploaded.asset.secure_url,
              sourceFingerprint: getFileSourceFingerprint(image.file),
            },
          };
          return nextImages;
        });
      } finally {
        backgroundUploadPromisesRef.current.delete(slotIndex);
        setBusyBackgroundUploadSlots((prevBusySlots) => {
          if (!prevBusySlots.has(slotIndex)) {
            return prevBusySlots;
          }

          const nextBusySlots = new Set(prevBusySlots);
          nextBusySlots.delete(slotIndex);
          return nextBusySlots;
        });
      }
    })();

    backgroundUploadPromisesRef.current.set(slotIndex, uploadPromise);
    return uploadPromise;
  }, []);

  const toggleActiveImageRemoveBackground = useCallback(
    (enabled: boolean) => {
      const slotIndex = activeImageIndexRef.current;
      if (typeof slotIndex !== "number") {
        return;
      }

      setSlotRemoveBackground(slotIndex, enabled);

      if (!enabled) {
        return;
      }

      void uploadSlotIfNeeded(slotIndex).catch((error) => {
        setSlotRemoveBackground(slotIndex, false);
        onUploadError?.(
          error instanceof Error ? error.message : t("upload.uploadFailed"),
        );
      });
    },
    [onUploadError, setSlotRemoveBackground, uploadSlotIfNeeded],
  );

  const setSlotEnhance = useCallback((slotIndex: number, enabled: boolean) => {
    setSelectedImages((prevImages) => {
      const image = prevImages[slotIndex];

      if (!image) {
        return prevImages;
      }

      if ((image.previewEffects.enhance ?? false) === enabled) {
        return prevImages;
      }

      const nextImages = [...prevImages];
      nextImages[slotIndex] = {
        ...image,
        previewEffects: {
          ...image.previewEffects,
          enhance: enabled,
        },
      };

      return nextImages;
    });
  }, []);

  const toggleActiveImageEnhance = useCallback(
    (enabled: boolean) => {
      const slotIndex = activeImageIndexRef.current;
      if (typeof slotIndex !== "number") {
        return;
      }

      setSlotEnhance(slotIndex, enabled);

      if (!enabled) {
        return;
      }

      void uploadSlotIfNeeded(slotIndex).catch((error) => {
        setSlotEnhance(slotIndex, false);
        onUploadError?.(
          error instanceof Error ? error.message : t("upload.uploadFailed"),
        );
      });
    },
    [onUploadError, setSlotEnhance, uploadSlotIfNeeded],
  );

  const resetActiveImageEffects = useCallback(() => {
    updateActiveImage((image) => ({
      ...image,
      previewEffects: {
        brightness: 0,
        contrast: 0,
        removeBackground: false,
        enhance: false,
      },
    }));
  }, [updateActiveImage]);

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

      // Preserve center-slot focus after clearing the center image so side
      // slots stay anchored and visible in split workflows.
      let nextActiveIndex = activeImageIndexRef.current;

      if (nextActiveIndex === index || nextActiveIndex === null) {
        if (index === CENTER_SLOT_INDEX) {
          nextActiveIndex = CENTER_SLOT_INDEX;
        } else {
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

  const handleSplitActiveImage = useCallback(async () => {
    if (!activeImage) {
      return;
    }

    try {
      const splitFiles = await splitImageIntoVerticalThirdFiles({
        previewUrl: activeImage.previewUrl,
        sourceFile: activeImage.file,
      });

      setSelectedImages((prevImages) => {
        if (prevImages.some(Boolean)) {
          revokePreviewUrls(prevImages);
        }

        return splitFiles.map((file) => ({
          ...buildSelectedImageItem(file),
          previewEffects: {
            ...activeImage.previewEffects,
          },
        }));
      });

      setActiveImageIndex(CENTER_SLOT_INDEX);
      activeImageIndexRef.current = CENTER_SLOT_INDEX;
      onImageMetadataChange?.(null);
    } catch {
      onUploadError?.(t("upload.error"));
    }
  }, [
    activeImage,
    buildSelectedImageItem,
    onImageMetadataChange,
    onUploadError,
    revokePreviewUrls,
  ]);

  const uploadFilledSlots =
    useCallback(async (): Promise<BatchUploadSummary> => {
      const filledSlots = selectedImagesRef.current.flatMap(
        (image, slotIndex) => (image ? [{ image, slotIndex }] : []),
      );

      if (filledSlots.length === 0) {
        return {
          results: [],
          successCount: 0,
          failureCount: 0,
          totalCount: 0,
        };
      }

      const batchId =
        globalThis.crypto?.randomUUID?.() ?? `batch-${Date.now().toString(36)}`;
      const results: UploadedSlotResult[] = [];

      for (let i = 0; i < filledSlots.length; i++) {
        const { image, slotIndex } = filledSlots[i];
        const slotKey = SLOT_KEYS[slotIndex] ?? "center";
        const transformations = getUploadTransformations(image);
        const aiAdjustments = getAiAdjustments(image);
        const reusableUploadedAsset = getReusableUploadedAsset(image);

        if (reusableUploadedAsset) {
          results.push({
            slotIndex,
            slotKey,
            transformations,
            aiAdjustments: aiAdjustments ?? undefined,
            transformedUrl: getTransformedPreviewUrl(
              reusableUploadedAsset.secureUrl,
              transformations,
              undefined,
              aiAdjustments,
            ),
            publicId: reusableUploadedAsset.publicId,
            secureUrl: reusableUploadedAsset.secureUrl,
          });
          continue;
        }

        // Emit progress
        onUploadProgress?.({
          currentSlotIndex: i,
          slotIndex,
          currentStep: i + 1,
          totalSlots: filledSlots.length,
          currentSlotKey: slotKey,
          slotProgress: 0,
        });

        try {
          const uploaded = await uploadImageToCloudinary({
            file: image.file,
            transformations,
            aiAdjustments,
            context: `slot=${slotKey}|batch_id=${batchId}`,
            onUploadProgress: (slotProgressFraction) => {
              onUploadProgress?.({
                currentSlotIndex: i,
                slotIndex,
                currentStep: i + 1,
                totalSlots: filledSlots.length,
                currentSlotKey: slotKey,
                slotProgress: slotProgressFraction,
              });
            },
          });

          results.push({
            slotIndex,
            slotKey,
            transformations,
            aiAdjustments: aiAdjustments ?? undefined,
            transformedUrl: uploaded.transformedUrl,
            publicId: uploaded.asset.public_id,
            secureUrl: uploaded.asset.secure_url,
          });

          setSelectedImages((prevImages) => {
            const existingImage = prevImages[slotIndex];
            if (!existingImage || existingImage.file !== image.file) {
              return prevImages;
            }

            const nextImages = [...prevImages];
            nextImages[slotIndex] = {
              ...existingImage,
              uploadedAsset: {
                publicId: uploaded.asset.public_id,
                secureUrl: uploaded.asset.secure_url,
                sourceFingerprint: getFileSourceFingerprint(image.file),
              },
            };
            return nextImages;
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : t("upload.uploadFailed");

          results.push({
            slotIndex,
            slotKey,
            transformations,
            error: message,
          });
        }
      }

      const failureCount = results.filter((result) => !!result.error).length;
      const successCount = results.length - failureCount;

      if (failureCount > 0 && successCount === 0) {
        onUploadError?.(results[0]?.error ?? t("upload.uploadFailed"));
      }

      return {
        results,
        successCount,
        failureCount,
        totalCount: results.length,
      };
    }, [onUploadError, onUploadProgress]);

  useImperativeHandle(
    ref,
    () => ({
      uploadFilledSlots,
    }),
    [uploadFilledSlots],
  );

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
    onOrderableSlotsChange?.(
      selectedImages.flatMap((image, slotIndex) => {
        if (!image) {
          return [];
        }

        return [
          {
            slotIndex,
            slotKey: SLOT_KEYS[slotIndex] ?? "center",
            aspectRatio: image.metadata?.aspectRatio ?? null,
            displayImageProportion: image.displayImageProportion,
          },
        ];
      }),
    );
  }, [onOrderableSlotsChange, selectedImages]);

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

  if (selectedImageCount === 0) {
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
        <h2 className="sr-only">{t("uploader.adjustImage")}</h2>
        <div className="grid min-h-9 grid-cols-[1fr_auto_1fr] items-center gap-2">
          <span aria-hidden="true" />
          <button
            type="button"
            onClick={handleRemoveActiveImage}
            disabled={!activeImage}
            aria-label={t("uploader.removeImageSlot", {
              index:
                typeof activeImageIndex === "number"
                  ? String(activeImageIndex + 1)
                  : "",
            })}
            data-testid="uploader-remove-active-image"
            className="z-10 inline-flex items-center justify-center gap-1.5 justify-self-center rounded-full border border-border/70 bg-background/95 px-3 py-1.5 text-xs font-semibold tracking-[0.01em] text-foreground shadow-md backdrop-blur-sm transition-all duration-200 hover:border-border hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t("uploader.clearSlot")}</span>
          </button>
          <span aria-hidden="true" />
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col space-y-5 overflow-hidden pb-5">
        <UploaderPreviewSlider
          activeImage={activeImage}
          activeImagePreviewUrl={
            activeImage ? getTransformedImagePreviewUrl(activeImage) : null
          }
          activeImageIndex={activeImageIndex}
          selectedImageMetadata={selectedImageMetadata}
          bestProportion={bestDisplayImageProportion}
          userSelectedProportion={displayImageProportion}
          previewFrameAspectRatio={previewFrameAspectRatio}
          isUploadOverlayVisible={isUploadOverlayVisible}
          uploadProgress={uploadProgress}
          uploadProgressLabel={uploadProgressLabel}
          uploadingSlotIndex={uploadingSlotIndex}
          canMovePrevious={canMovePrevious}
          canMoveNext={canMoveNext}
          leftSlotIndex={leftSlotIndex}
          rightSlotIndex={rightSlotIndex}
          leftSlotImage={leftSlotImage}
          leftSlotPreviewUrl={
            leftSlotImage ? getTransformedImagePreviewUrl(leftSlotImage) : null
          }
          rightSlotImage={rightSlotImage}
          rightSlotPreviewUrl={
            rightSlotImage
              ? getTransformedImagePreviewUrl(rightSlotImage)
              : null
          }
          onSelectSlot={handlePreviewSlotSelect}
          onTouchStart={handleSliderTouchStart}
          onTouchEnd={handleSliderTouchEnd}
          onMetadataResolved={handleMetadataResolved}
        />

        <UploaderPreviewToolsPanel
          slots={selectedImages}
          activeSlotIndex={activeImageIndex}
          onSelectSlot={handlePreviewSlotSelect}
          onSplitImage={() => void handleSplitActiveImage()}
          canSplitImage={!!activeImage}
          shouldConfirmSplit={selectedImageCount > 1}
          onSelectProportion={(proportion) => {
            updateActiveImage((image) => ({
              ...image,
              displayImageProportion:
                proportion === "rectangle" ? "square" : proportion,
            }));
          }}
          onUpdateEffect={updateActiveImageEffect}
          onToggleRemoveBackground={toggleActiveImageRemoveBackground}
          onToggleEnhance={toggleActiveImageEnhance}
          onResetEffects={resetActiveImageEffects}
          activeImageEffects={activeImage?.previewEffects ?? null}
          canUpdateEffects={!!activeImage}
          isRemoveBackgroundBusy={
            typeof activeImageIndex === "number" &&
            busyBackgroundUploadSlots.has(activeImageIndex)
          }
          isEnhanceBusy={
            typeof activeImageIndex === "number" &&
            busyBackgroundUploadSlots.has(activeImageIndex)
          }
          coveragePercent={coveragePercent}
          selectedProportion={
            displayImageProportion === "square"
              ? "rectangle"
              : displayImageProportion
          }
          showCoverageDetails={shouldShowUploaderDebugData}
        />

        {shouldShowUploaderDebugData && selectedImageMetadata && (
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
});

ImageUploader.displayName = "ImageUploader";
