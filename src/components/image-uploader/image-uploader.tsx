import {
  forwardRef,
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
  useImperativeHandle,
} from "react";
import { Card, CardContent } from "@/components/ui/card";
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
  calculateMaxCenteredCrop,
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
  initialSlots?: UploadedSlotResult[];
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
    grayscale: number;
    removeBackground?: boolean;
    enhance?: boolean;
    upscale?: boolean;
    restore?: boolean;
  };
  previewTransform?: {
    rotation: number;
    flipHorizontal: boolean;
    flipVertical: boolean;
  };
  previewCropAdjust?: {
    zoom: number;
    panX: number;
    panY: number;
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
  removeActiveImage: () => void;
  hasActiveImage: () => boolean;
}

const SLOT_KEYS: UploadSlotKey[] = ["left", "center", "right"];

function getUploadTransformations(
  image: SelectedImageItem,
): ImageTransformations & { custom_coordinates?: string } {
  const result: ImageTransformations & { custom_coordinates?: string } = {
    rotation: image.previewTransform?.rotation ?? 0,
    flipHorizontal: image.previewTransform?.flipHorizontal ?? false,
    flipVertical: image.previewTransform?.flipVertical ?? false,
    brightness: image.previewEffects.brightness,
    contrast: image.previewEffects.contrast,
    grayscale: image.previewEffects.grayscale ?? 0,
    blur: 0,
  };

  if (
    image.previewCropAdjust &&
    image.previewCropAdjust.zoom > 1 &&
    image.metadata
  ) {
    const baseCrop = calculateMaxCenteredCrop({
      sourceWidth: image.metadata.width,
      sourceHeight: image.metadata.height,
      proportion: image.displayImageProportion,
    });
    const zoomScale = 1 / image.previewCropAdjust.zoom;
    const adjustedWidth = baseCrop.cropWidth * zoomScale;
    const adjustedHeight = baseCrop.cropHeight * zoomScale;
    const maxPanOffsetX = (baseCrop.cropWidth - adjustedWidth) / 2;
    const maxPanOffsetY = (baseCrop.cropHeight - adjustedHeight) / 2;
    const centerX = baseCrop.cropX + baseCrop.cropWidth / 2;
    const centerY = baseCrop.cropY + baseCrop.cropHeight / 2;
    const offsetX = image.previewCropAdjust.panX * maxPanOffsetX;
    const offsetY = image.previewCropAdjust.panY * maxPanOffsetY;
    let cropX = centerX - adjustedWidth / 2 + offsetX;
    let cropY = centerY - adjustedHeight / 2 + offsetY;
    const maxX = image.metadata.width - adjustedWidth;
    const maxY = image.metadata.height - adjustedHeight;
    cropX = Math.max(0, Math.min(cropX, maxX));
    cropY = Math.max(0, Math.min(cropY, maxY));
    result.custom_coordinates = `${Math.round(cropX)},${Math.round(cropY)},${Math.round(adjustedWidth)},${Math.round(adjustedHeight)}`;
  }

  return result;
}

function getAiAdjustments(image: SelectedImageItem): AiAdjustments | null {
  if (
    !image.previewEffects.removeBackground &&
    !image.previewEffects.enhance &&
    !image.previewEffects.upscale &&
    !image.previewEffects.restore
  ) {
    return null;
  }

  return {
    enhance: !!image.previewEffects.enhance,
    removeBackground: !!image.previewEffects.removeBackground,
    upscale: !!image.previewEffects.upscale,
    restore: !!image.previewEffects.restore,
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

  // Empty fingerprint marks a restored slot — always reusable
  if (image.uploadedAsset.sourceFingerprint === "") {
    return image.uploadedAsset;
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

  if (reusableUploadedAsset.sourceFingerprint === "") {
    return image.previewUrl;
  }

  const transformations = getUploadTransformations(image);

  return getTransformedPreviewUrl(
    reusableUploadedAsset.secureUrl,
    {
      rotation: transformations.rotation,
      flipHorizontal: transformations.flipHorizontal,
      flipVertical: transformations.flipVertical,
      brightness: transformations.brightness,
      contrast: transformations.contrast,
      grayscale: transformations.grayscale,
      blur: transformations.blur,
    },
    transformations.custom_coordinates,
    getAiAdjustments(image),
  );
}

const RESTORED_DUMMY_FILE = new File([], "restored.jpg", {
  type: "image/jpeg",
});

function buildRestoredSelectedImages(
  slots: UploadedSlotResult[],
): Array<SelectedImageItem | null> {
  const images = createEmptySelectionSlots();
  for (const slot of slots) {
    if (!slot.secureUrl || !slot.transformedUrl) continue;
    if (slot.slotIndex < 0 || slot.slotIndex >= MAX_SELECTED_IMAGES) continue;
    images[slot.slotIndex] = {
      file: RESTORED_DUMMY_FILE,
      previewUrl: slot.transformedUrl,
      metadata: null,
      displayImageProportion: "horizontal",
      previewEffects: {
          brightness: slot.transformations?.brightness ?? 0,
          contrast: slot.transformations?.contrast ?? 0,
          grayscale: slot.transformations?.grayscale ?? 0,
          removeBackground: slot.aiAdjustments?.removeBackground ?? false,
          enhance: slot.aiAdjustments?.enhance ?? false,
          upscale: slot.aiAdjustments?.upscale ?? false,
          restore: slot.aiAdjustments?.restore ?? false,
        },
        previewTransform: {
          rotation: slot.transformations?.rotation ?? 0,
          flipHorizontal: slot.transformations?.flipHorizontal ?? false,
          flipVertical: slot.transformations?.flipVertical ?? false,
        },
      uploadedAsset: {
        publicId: slot.publicId ?? "",
        secureUrl: slot.secureUrl,
        sourceFingerprint: "", // empty = always reusable (restored slot)
      },
    };
  }
  return images;
}

/**
 * Derives the active image index from a restored/built image array.
 * Returns the first non-null slot index, or null if no slots are filled.
 */
function getInitialActiveIndexFromImages(
  images: Array<SelectedImageItem | null>,
): number | null {
  const filledIndex = images.findIndex((image) => image !== null);
  return filledIndex >= 0 ? filledIndex : null;
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
    initialSlots,
  }: ImageUploaderProps,
  ref,
) {
  const [selectedImages, setSelectedImages] = useState<
    Array<SelectedImageItem | null>
  >(() =>
    initialSlots?.length
      ? buildRestoredSelectedImages(initialSlots)
      : createEmptySelectionSlots(),
  );
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(
    () => {
      const images = initialSlots?.length
        ? buildRestoredSelectedImages(initialSlots)
        : createEmptySelectionSlots();
      return getInitialActiveIndexFromImages(images);
    },
  );
  const [busyBackgroundUploadSlots, setBusyBackgroundUploadSlots] = useState<
    Set<number>
  >(() => new Set());
  const [showIcons, setShowIcons] = useState(defaultShowIcons);
  const [isEffectsEditMode, setIsEffectsEditMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const pendingSelectionSlotRef = useRef<number | null>(null);
  const lastExternalResetTriggerRef = useRef<number | undefined>(
    externalResetTrigger,
  );
  const computeInitialActiveIndex = () => {
    const images = initialSlots?.length
      ? buildRestoredSelectedImages(initialSlots)
      : createEmptySelectionSlots();
    return getInitialActiveIndexFromImages(images);
  };
  const activeImageIndexRef = useRef<number | null>(
    computeInitialActiveIndex(),
  );
  const selectedImagesRef = useRef<Array<SelectedImageItem | null>>(
    initialSlots?.length
      ? buildRestoredSelectedImages(initialSlots)
      : createEmptySelectionSlots(),
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
          grayscale: 0,
          removeBackground: false,
          enhance: false,
          upscale: false,
          restore: false,
        },
        previewTransform: {
          rotation: 0,
          flipHorizontal: false,
          flipVertical: false,
        },
      };
    },
    [],
  );

  const resolveOptimalProportionForFile = useCallback(
    (previewUrl: string): Promise<ImageDisplayProportion> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          resolve(
            getOptimalDisplayProportion(img.naturalWidth, img.naturalHeight),
          );
        };
        img.onerror = () => {
          resolve("horizontal");
        };
        img.src = previewUrl;
      });
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

      const nextImage = buildSelectedImageItem(file, true);

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

      resolveOptimalProportionForFile(nextImage.previewUrl).then((optimalProportion) => {
        setSelectedImages((prevImages) => {
          const current = prevImages[insertionIndex];
          if (
            !current ||
            current.file !== file ||
            !current.autoSelectOptimalPending ||
            current.displayImageProportion !== "horizontal"
          ) {
            return prevImages;
          }

          const nextImages = [...prevImages];
          nextImages[insertionIndex] = {
            ...current,
            displayImageProportion: optimalProportion,
          };
          return nextImages;
        });
      });
    },
    [buildSelectedImageItem, resolveOptimalProportionForFile],
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
    (effectName: "brightness" | "contrast" | "grayscale", value: number) => {
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
          customCoordinates: transformations.custom_coordinates,
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

  const setSlotUpscale = useCallback((slotIndex: number, enabled: boolean) => {
    setSelectedImages((prevImages) => {
      const image = prevImages[slotIndex];

      if (!image) {
        return prevImages;
      }

      if ((image.previewEffects.upscale ?? false) === enabled) {
        return prevImages;
      }

      const nextImages = [...prevImages];
      nextImages[slotIndex] = {
        ...image,
        previewEffects: {
          ...image.previewEffects,
          upscale: enabled,
        },
      };

      return nextImages;
    });
  }, []);

  const toggleActiveImageUpscale = useCallback(
    (enabled: boolean) => {
      const slotIndex = activeImageIndexRef.current;
      if (typeof slotIndex !== "number") {
        return;
      }

      setSlotUpscale(slotIndex, enabled);

      if (!enabled) {
        return;
      }

      void uploadSlotIfNeeded(slotIndex).catch((error) => {
        setSlotUpscale(slotIndex, false);
        onUploadError?.(
          error instanceof Error ? error.message : t("upload.uploadFailed"),
        );
      });
    },
    [onUploadError, setSlotUpscale, uploadSlotIfNeeded],
  );

  const setSlotRestore = useCallback((slotIndex: number, enabled: boolean) => {
    setSelectedImages((prevImages) => {
      const image = prevImages[slotIndex];

      if (!image) {
        return prevImages;
      }

      if ((image.previewEffects.restore ?? false) === enabled) {
        return prevImages;
      }

      const nextImages = [...prevImages];
      nextImages[slotIndex] = {
        ...image,
        previewEffects: {
          ...image.previewEffects,
          restore: enabled,
        },
      };

      return nextImages;
    });
  }, []);

  const toggleActiveImageRestore = useCallback(
    (enabled: boolean) => {
      const slotIndex = activeImageIndexRef.current;
      if (typeof slotIndex !== "number") {
        return;
      }

      setSlotRestore(slotIndex, enabled);

      if (!enabled) {
        return;
      }

      void uploadSlotIfNeeded(slotIndex).catch((error) => {
        setSlotRestore(slotIndex, false);
        onUploadError?.(
          error instanceof Error ? error.message : t("upload.uploadFailed"),
        );
      });
    },
    [onUploadError, setSlotRestore, uploadSlotIfNeeded],
  );

  const updateActiveImageRotation = useCallback(
    (degrees: number) => {
      updateActiveImage((image) => ({
        ...image,
        previewTransform: {
          ...(image.previewTransform ?? {
            rotation: 0,
            flipHorizontal: false,
            flipVertical: false,
          }),
          rotation: degrees,
        },
      }));
    },
    [updateActiveImage],
  );

  const toggleActiveImageFlipHorizontal = useCallback(
    (enabled: boolean) => {
      updateActiveImage((image) => ({
        ...image,
        previewTransform: {
          ...(image.previewTransform ?? {
            rotation: 0,
            flipHorizontal: false,
            flipVertical: false,
          }),
          flipHorizontal: enabled,
        },
      }));
    },
    [updateActiveImage],
  );

  const toggleActiveImageFlipVertical = useCallback(
    (enabled: boolean) => {
      updateActiveImage((image) => ({
        ...image,
        previewTransform: {
          ...(image.previewTransform ?? {
            rotation: 0,
            flipHorizontal: false,
            flipVertical: false,
          }),
          flipVertical: enabled,
        },
      }));
    },
    [updateActiveImage],
  );

  const updateActiveImageCropAdjust = useCallback(
    (adjust: { zoom: number; panX: number; panY: number } | undefined) => {
      updateActiveImage((image) => ({
        ...image,
        previewCropAdjust: adjust,
      }));
    },
    [updateActiveImage],
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
          ...buildSelectedImageItem(file, false),
          displayImageProportion: "vertical" as ImageDisplayProportion,
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
      // Wait for any pending background uploads (from toggle enhance/removeBackground) to complete
      const pendingPromises = Array.from(
        backgroundUploadPromisesRef.current.values(),
      );
      if (pendingPromises.length > 0) {
        await Promise.allSettled(pendingPromises);
      }

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
              transformations.custom_coordinates,
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
            customCoordinates: transformations.custom_coordinates,
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
      removeActiveImage: handleRemoveActiveImage,
      hasActiveImage: () => !!activeImageIndexRef.current && typeof activeImageIndexRef.current === "number",
    }),
    [uploadFilledSlots, handleRemoveActiveImage],
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
      <CardContent className="relative flex-1 flex flex-col gap-3 sm:gap-8 overflow-hidden pb-2 lg:pb-1">
        <h2 className="sr-only">{t("uploader.adjustImage")}</h2>
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
          isEffectUploading={
            typeof activeImageIndex === "number" &&
            busyBackgroundUploadSlots.has(activeImageIndex)
          }
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
          swipeDisabled={isEffectsEditMode}
          isEditMode={isEffectsEditMode}
          previewCropAdjust={activeImage?.previewCropAdjust}
          onCropAdjustChange={updateActiveImageCropAdjust}
          onSelectSlot={handlePreviewSlotSelect}
          onTouchStart={handleSliderTouchStart}
          onTouchEnd={handleSliderTouchEnd}
          onMetadataResolved={handleMetadataResolved}
          onSelectEmptySlot={
            typeof activeImageIndex === "number"
              ? () => handlePreviewSlotSelect(activeImageIndex)
              : undefined
          }
          onClearSlot={activeImage ? handleRemoveActiveImage : undefined}
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
              previewCropAdjust: undefined,
            }));
          }}
          onUpdateEffect={updateActiveImageEffect}
          onToggleRemoveBackground={toggleActiveImageRemoveBackground}
          onToggleEnhance={toggleActiveImageEnhance}
          onToggleUpscale={toggleActiveImageUpscale}
          onToggleRestore={toggleActiveImageRestore}
          onUpdateRotation={updateActiveImageRotation}
          onToggleFlipHorizontal={toggleActiveImageFlipHorizontal}
          onToggleFlipVertical={toggleActiveImageFlipVertical}
          activeImageEffects={activeImage?.previewEffects ?? null}
          activeImageTransform={
            activeImage?.previewTransform ?? null
          }
          canUpdateEffects={!!activeImage}
          isRemoveBackgroundBusy={
            typeof activeImageIndex === "number" &&
            busyBackgroundUploadSlots.has(activeImageIndex)
          }
          isEnhanceBusy={
            typeof activeImageIndex === "number" &&
            busyBackgroundUploadSlots.has(activeImageIndex)
          }
          isUpscaleBusy={
            typeof activeImageIndex === "number" &&
            busyBackgroundUploadSlots.has(activeImageIndex)
          }
          isRestoreBusy={
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
          onEditModeChange={setIsEffectsEditMode}
          activeImageCropAdjust={activeImage?.previewCropAdjust}
          onUpdateCropAdjust={updateActiveImageCropAdjust}
          isZoomAvailable={!!selectedImageMetadata}
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
