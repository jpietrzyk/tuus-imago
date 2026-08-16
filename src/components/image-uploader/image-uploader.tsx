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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TriangleAlert } from "lucide-react";
import { t } from "@/locales/i18n";
import { uploadImageToCloudinary } from "@/lib/cloudinary-upload";
import {
  getTransformedPreviewUrl,
  type AiAdjustments,
} from "@/lib/image-transformations";
import UploaderDropArea from "./uploader-drop-area";
import UploaderPreviewSlider from "./uploader-preview-slider";
import UploaderPreviewToolsPanel from "./uploader-preview-tools-panel";
import type { FooterToolsBarProps } from "@/components/footer-tools-bar";
import type { SlotSwitcherBarProps } from "./uploader-slot-switcher";
import type { ImageDebugData } from "@/components/image-debug-panel";
import { useImageSliderNavigation } from "./use-image-slider-navigation";
import { useSliderSwipeNavigation } from "./use-slider-swipe-navigation";
import {
  calculateAllProportions,
  calculateMaxCenteredCrop,
  formatAspectRatio,
  getOptimalDisplayProportion,
  getTargetAspectRatio,
  type ImageDisplayProportion,
} from "./image-proportion-calculator";
import {
  type PaintingSizeIndex,
  type PaintingShape,
  DEFAULT_PAINTING_SIZE_INDEX,
  getOrientedPaintingDimensions,
  getPaintingOrientation,
  getPaintingSizeOptions,
} from "./painting-size";
import { computeSizesDpiAvailability, resolveRecommendedPaintingSize, type SizeDpiInfo } from "./size-dpi-availability";
import { splitImageIntoVerticalThirdFiles, composeFullTransformedImage } from "./split-image-into-thirds";
import { isWidePanoramaForTriptych, resolveTriptychSlotCrop } from "./triptych-window-crop";
import {
  projectTriptychPrintability,
  resolveTriptychTargetSizeIndex,
  TRIPTYCH_PROJECTED_SHAPE,
} from "./split-printability-projection";
import { IMAGE_VALIDATION_RULES } from "./image-validation-rules";
import { validateImageFile } from "./image-file-validator";
import { adjustCropForZoomPan } from "./use-crop-adjust";
import { useMediaQuery } from "@/lib/use-media-query";

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
  onUploadAttemptStart?: () => void;
  onImageMetadataChange?: (metadata: SelectedImageMetadata | null) => void;
  onSelectionStateChange?: (hasSelection: boolean) => void;
  onActiveImageSrcChange?: (src: string | null) => void;
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
  onToolsPanelPropsChange?: (props: FooterToolsBarProps | null) => void;
  onSlotSwitcherPropsChange?: (props: SlotSwitcherBarProps | null) => void;
  onDebugDataChange?: (data: ImageDebugData | null) => void;
  onReset?: () => void;
}

const MAX_SELECTED_IMAGES = IMAGE_VALIDATION_RULES.maxSelectedImages;
const CENTER_SLOT_INDEX = Math.floor(IMAGE_VALIDATION_RULES.maxSelectedImages / 2);
const SHOW_UPLOADER_DEBUG = import.meta.env.VITE_SHOW_UPLOADER_DEBUG === "true";

const createEmptySelectionSlots = (): Array<SelectedImageItem | null> =>
  Array.from({ length: MAX_SELECTED_IMAGES }, () => null);

const resolveSplitConfirmVariant = (
  hasOverwriteReason: boolean,
  willSelectedSizeBeBlocked: boolean,
): FooterToolsBarProps["splitConfirmVariant"] => {
  if (hasOverwriteReason && willSelectedSizeBeBlocked) {
    return "both";
  }
  if (willSelectedSizeBeBlocked) {
    return "printability";
  }
  if (hasOverwriteReason) {
    return "overwrite";
  }
  return "none";
};

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
  /**
   * Set on each slot of a seamless wide-panorama triptych (0 = left, 1 = center,
   * 2 = right). When present, the slot's source is the full shared panorama and
   * the visible crop is a contiguous portrait "window" computed from this index
   * plus the shared pan — so the three panels meet edge-to-edge and can be
   * dragged as one continuous image (no gaps), mirroring the square-image
   * top/bottom behaviour on the horizontal axis.
   */
  triptychWindowIndex?: number;
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

  if (image.triptychWindowIndex !== undefined && image.metadata) {
    // Seamless wide-panorama triptych: crop the shared panorama to this
    // panel's contiguous portrait window so the three uploaded canvases meet
    // edge-to-edge exactly as previewed.
    const windowCrop = resolveTriptychSlotCrop({
      sourceWidth: image.metadata.width,
      sourceHeight: image.metadata.height,
      displayImageProportion: image.displayImageProportion,
      windowIndex: image.triptychWindowIndex,
      cropAdjust: image.previewCropAdjust,
    });
    result.custom_coordinates = `${Math.round(windowCrop.cropX)},${Math.round(windowCrop.cropY)},${Math.round(windowCrop.cropWidth)},${Math.round(windowCrop.cropHeight)}`;
  } else if (image.previewCropAdjust && image.metadata) {
    const baseCrop = calculateMaxCenteredCrop({
      sourceWidth: image.metadata.width,
      sourceHeight: image.metadata.height,
      proportion: image.displayImageProportion,
    });
    const effective = adjustCropForZoomPan(
      baseCrop,
      image.previewCropAdjust.zoom,
      image.previewCropAdjust.panX,
      image.previewCropAdjust.panY,
    );
    // Send crop coordinates whenever the effective crop differs from the
    // centered base crop — this covers both zoom-in and drag-to-reveal pan
    // at zoom 1 for images that overflow the frame (e.g. triptych panels).
    const hasCropShift =
      effective !== baseCrop &&
      (Math.abs(effective.cropX - baseCrop.cropX) > 0.5 ||
        Math.abs(effective.cropY - baseCrop.cropY) > 0.5 ||
        Math.abs(effective.cropWidth - baseCrop.cropWidth) > 0.5 ||
        Math.abs(effective.cropHeight - baseCrop.cropHeight) > 0.5);
    if (hasCropShift) {
      result.custom_coordinates = `${Math.round(effective.cropX)},${Math.round(effective.cropY)},${Math.round(effective.cropWidth)},${Math.round(effective.cropHeight)}`;
    }
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
    onUploadAttemptStart,
    onImageMetadataChange,
    onSelectionStateChange,
    onActiveImageSrcChange,
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
    onToolsPanelPropsChange,
    onSlotSwitcherPropsChange,
    onDebugDataChange,
    onReset,
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
  const [effectsEditMode, setEffectsEditMode] = useState<"ai" | "settings">("settings");
  const [isZoomPanMode, setIsZoomPanMode] = useState(false);
  const [isTriptychSplit, setIsTriptychSplit] = useState(false);
  const [isTriptychLinked, setIsTriptychLinked] = useState(true);
  const isTriptychSplitRef = useRef(false);
  const isTriptychLinkedRef = useRef(true);
  /**
   * Preview URL of the image the user had loaded when entering triptych mode.
   * While the split is active, external consumers (panoramka) keep seeing this
   * source instead of the per-slot part/window URLs. The URL is exempt from
   * split-time revocation because its ownership moves to the consumer.
   */
  const triptychSourceUrlRef = useRef<string | null>(null);
  const [selectedPaintingSize, setSelectedPaintingSize] =
    useState<PaintingSizeIndex>(DEFAULT_PAINTING_SIZE_INDEX);
  const userSelectedPaintingSizeRef = useRef(false);
  const [showRemoveSlotDialog, setShowRemoveSlotDialog] = useState(false);
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

  const isLgScreen = useMediaQuery("(min-width: 1024px)");
  const isDesktopTriptych =
    isLgScreen &&
    isTriptychSplit &&
    selectedImages.length === MAX_SELECTED_IMAGES &&
    selectedImages.every(Boolean);

  const activeImage =
    typeof activeImageIndex === "number"
      ? (selectedImages[activeImageIndex] ?? null)
      : null;
  const selectedImageMetadata = activeImage?.metadata ?? null;
  const displayImageProportion =
    activeImage?.displayImageProportion ?? "horizontal";

  useEffect(() => {
    isTriptychSplitRef.current = isTriptychSplit;
  }, [isTriptychSplit]);

  useEffect(() => {
    isTriptychLinkedRef.current = isTriptychLinked;
  }, [isTriptychLinked]);

  const revokePreviewUrls = useCallback(
    (images: Array<SelectedImageItem | null>, preserveUrl?: string | null) => {
      images.forEach((image) => {
        if (image && image.previewUrl !== preserveUrl) {
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
    (file: File, preferredIndex?: number, dimensions?: { width: number; height: number }) => {
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

      // When dimensions are already known (e.g. from validation), compute the
      // optimal proportion up front and skip the separate async image decode
      // that resolveOptimalProportionForFile would otherwise trigger.
      const precomputedProportion = dimensions
        ? getOptimalDisplayProportion(dimensions.width, dimensions.height)
        : null;

      const nextImage = precomputedProportion
        ? {
            ...buildSelectedImageItem(file, false),
            displayImageProportion: precomputedProportion,
          }
        : buildSelectedImageItem(file, true);

      setSelectedImages((prevImages) => {
        const nextImages = [...prevImages];

        if (nextImages[insertionIndex]) {
          URL.revokeObjectURL(nextImages[insertionIndex].previewUrl);
        }

        nextImages[insertionIndex] = nextImage;

        return nextImages;
      });

      setIsTriptychSplit(false);
      setIsTriptychLinked(true);

      setActiveImageIndex((currentActiveIndex) => {
        if (hasExistingSelection && clickedEmptySlot) {
          return currentActiveIndex;
        }

        return insertionIndex;
      });

      if (precomputedProportion) {
        return;
      }

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
    async (file: File, preferredIndex?: number) => {
      const { violations, dimensions } = await validateImageFile(
        file,
        IMAGE_VALIDATION_RULES,
      );

      if (violations.length > 0) {
        onUploadError?.(t(violations[0].messageKey, violations[0].params));
        return;
      }

      if (
        typeof preferredIndex !== "number" &&
        selectedImageCount >= IMAGE_VALIDATION_RULES.maxSelectedImages
      ) {
        onUploadError?.(t("uploader.maxImagesError"));
        return;
      }

      addOrReplaceSelection(file, preferredIndex, dimensions ?? undefined);
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

  // --- Triptych binding helpers ---
  // When the triptych is linked, editable state (effects/transform/crop) is
  // propagated to every filled slot. When unlinked (or not a triptych), only
  // the active slot is touched. Indices are resolved from refs so the writer
  // callbacks stay stable across renders.
  const resolveBoundSlotIndices = useCallback((): number[] => {
    const activeIdx = activeImageIndexRef.current;
    if (typeof activeIdx !== "number") {
      return [];
    }

    if (!isTriptychSplitRef.current || !isTriptychLinkedRef.current) {
      return [activeIdx];
    }

    return selectedImagesRef.current
      .map((image, idx) => (image ? idx : -1))
      .filter((idx) => idx >= 0);
  }, []);

  // Sibling (non-active) updates are coalesced onto a single animation frame
  // so continuous gestures (pan/zoom drag, effect-slider drag) don't re-render
  // all three slots on every input tick. The active slot is always updated
  // synchronously for immediate feedback, matching the canvas's RAF throttle.
  const pendingSiblingMutationRef = useRef<{
    effects?: { value: SelectedImageItem["previewEffects"] };
    transform?: { value: SelectedImageItem["previewTransform"] };
    crop?: {
      value: { zoom: number; panX: number; panY: number } | undefined;
    };
  }>({});
  const siblingFlushRafRef = useRef<number | null>(null);

  const updateActiveSlot = useCallback(
    (mutate: (image: SelectedImageItem) => SelectedImageItem) => {
      const activeIdx = activeImageIndexRef.current;
      if (typeof activeIdx !== "number") {
        return;
      }
      setSelectedImages((prevImages) =>
        prevImages.map((image, idx) =>
          image && idx === activeIdx ? mutate(image) : image,
        ),
      );
    },
    [],
  );

  const flushSiblingMutations = useCallback(() => {
    siblingFlushRafRef.current = null;
    const pending = pendingSiblingMutationRef.current;
    pendingSiblingMutationRef.current = {};
    if (!pending.effects && !pending.transform && !pending.crop) {
      return;
    }

    const activeIdx = activeImageIndexRef.current;
    const siblingIndices = resolveBoundSlotIndices().filter(
      (idx) => idx !== activeIdx,
    );
    if (siblingIndices.length === 0) {
      return;
    }

    setSelectedImages((prevImages) =>
      prevImages.map((image, idx) => {
        if (!image || !siblingIndices.includes(idx)) {
          return image;
        }

        let next = image;
        if (pending.effects) {
          next = { ...next, previewEffects: { ...pending.effects.value } };
        }
        if (pending.transform) {
          next = {
            ...next,
            previewTransform: pending.transform.value
              ? { ...pending.transform.value }
              : undefined,
          };
        }
        if (pending.crop) {
          next = {
            ...next,
            previewCropAdjust: pending.crop.value
              ? { ...pending.crop.value }
              : undefined,
          };
        }
        return next;
      }),
    );
  }, [resolveBoundSlotIndices]);

  const scheduleSiblingFlush = useCallback(() => {
    const activeIdx = activeImageIndexRef.current;
    const hasSiblings = resolveBoundSlotIndices().some(
      (idx) => idx !== activeIdx,
    );
    if (!hasSiblings) {
      return;
    }

    if (siblingFlushRafRef.current === null) {
      siblingFlushRafRef.current =
        window.requestAnimationFrame(flushSiblingMutations);
    }
  }, [flushSiblingMutations, resolveBoundSlotIndices]);

  const applyEffectsToGroup = useCallback(
    (effects: SelectedImageItem["previewEffects"]) => {
      if (resolveBoundSlotIndices().length === 0) {
        return;
      }
      updateActiveSlot((image) => ({
        ...image,
        previewEffects: { ...effects },
      }));
      pendingSiblingMutationRef.current.effects = { value: effects };
      scheduleSiblingFlush();
    },
    [resolveBoundSlotIndices, scheduleSiblingFlush, updateActiveSlot],
  );

  const applyTransformToGroup = useCallback(
    (transform: SelectedImageItem["previewTransform"]) => {
      if (resolveBoundSlotIndices().length === 0) {
        return;
      }
      updateActiveSlot((image) => ({
        ...image,
        previewTransform: transform ? { ...transform } : undefined,
      }));
      pendingSiblingMutationRef.current.transform = { value: transform };
      scheduleSiblingFlush();
    },
    [resolveBoundSlotIndices, scheduleSiblingFlush, updateActiveSlot],
  );

  const applyCropAdjustToGroup = useCallback(
    (adjust: { zoom: number; panX: number; panY: number } | undefined) => {
      if (resolveBoundSlotIndices().length === 0) {
        return;
      }
      updateActiveSlot((image) => ({
        ...image,
        previewCropAdjust: adjust ? { ...adjust } : undefined,
      }));
      pendingSiblingMutationRef.current.crop = { value: adjust };
      scheduleSiblingFlush();
    },
    [resolveBoundSlotIndices, scheduleSiblingFlush, updateActiveSlot],
  );

  const syncGroupFromActive = useCallback(() => {
    const activeIdx = activeImageIndexRef.current;
    const source = typeof activeIdx === "number"
      ? selectedImagesRef.current[activeIdx]
      : null;
    if (!source) {
      return;
    }

    setSelectedImages((prevImages) =>
      prevImages.map((image, idx) => {
        if (!image || idx === activeIdx) {
          return image;
        }

        return {
          ...image,
          previewEffects: { ...source.previewEffects },
          previewTransform: source.previewTransform
            ? { ...source.previewTransform }
            : image.previewTransform,
          previewCropAdjust: source.previewCropAdjust
            ? { ...source.previewCropAdjust }
            : image.previewCropAdjust,
        };
      }),
    );
  }, []);

  const toggleTriptychLink = useCallback(() => {
    const next = !isTriptychLinkedRef.current;
    setIsTriptychLinked(next);
    // Re-linking converges the siblings to the active image's current state.
    if (next) {
      syncGroupFromActive();
    }
  }, [syncGroupFromActive]);

  // Cancel any pending sibling flush when the uploader unmounts.
  useEffect(() => {
    return () => {
      if (siblingFlushRafRef.current !== null) {
        window.cancelAnimationFrame(siblingFlushRafRef.current);
        siblingFlushRafRef.current = null;
      }
    };
  }, []);

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
      if (!activeImage) {
        return;
      }

      applyEffectsToGroup({
        ...activeImage.previewEffects,
        [effectName]: value,
      });
    },
    [activeImage, applyEffectsToGroup],
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
      const indices = resolveBoundSlotIndices();

      indices.forEach((slotIndex) =>
        setSlotRemoveBackground(slotIndex, enabled),
      );

      if (!enabled) {
        return;
      }

      indices.forEach((slotIndex) => {
        void uploadSlotIfNeeded(slotIndex).catch((error) => {
          setSlotRemoveBackground(slotIndex, false);
          onUploadError?.(
            error instanceof Error ? error.message : t("upload.uploadFailed"),
          );
        });
      });
    },
    [onUploadError, resolveBoundSlotIndices, setSlotRemoveBackground, uploadSlotIfNeeded],
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
      const indices = resolveBoundSlotIndices();

      indices.forEach((slotIndex) => setSlotEnhance(slotIndex, enabled));

      if (!enabled) {
        return;
      }

      indices.forEach((slotIndex) => {
        void uploadSlotIfNeeded(slotIndex).catch((error) => {
          setSlotEnhance(slotIndex, false);
          onUploadError?.(
            error instanceof Error ? error.message : t("upload.uploadFailed"),
          );
        });
      });
    },
    [onUploadError, resolveBoundSlotIndices, setSlotEnhance, uploadSlotIfNeeded],
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
      const indices = resolveBoundSlotIndices();

      indices.forEach((slotIndex) => setSlotUpscale(slotIndex, enabled));

      if (!enabled) {
        return;
      }

      indices.forEach((slotIndex) => {
        void uploadSlotIfNeeded(slotIndex).catch((error) => {
          setSlotUpscale(slotIndex, false);
          onUploadError?.(
            error instanceof Error ? error.message : t("upload.uploadFailed"),
          );
        });
      });
    },
    [onUploadError, resolveBoundSlotIndices, setSlotUpscale, uploadSlotIfNeeded],
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
      const indices = resolveBoundSlotIndices();

      indices.forEach((slotIndex) => setSlotRestore(slotIndex, enabled));

      if (!enabled) {
        return;
      }

      indices.forEach((slotIndex) => {
        void uploadSlotIfNeeded(slotIndex).catch((error) => {
          setSlotRestore(slotIndex, false);
          onUploadError?.(
            error instanceof Error ? error.message : t("upload.uploadFailed"),
          );
        });
      });
    },
    [onUploadError, resolveBoundSlotIndices, setSlotRestore, uploadSlotIfNeeded],
  );

  const updateActiveImageRotation = useCallback(
    (degrees: number) => {
      const base = activeImage?.previewTransform ?? {
        rotation: 0,
        flipHorizontal: false,
        flipVertical: false,
      };

      applyTransformToGroup({
        ...base,
        rotation: ((degrees % 360) + 360) % 360,
      });
    },
    [activeImage, applyTransformToGroup],
  );

  const toggleActiveImageFlipHorizontal = useCallback(
    (enabled: boolean) => {
      const base = activeImage?.previewTransform ?? {
        rotation: 0,
        flipHorizontal: false,
        flipVertical: false,
      };

      applyTransformToGroup({ ...base, flipHorizontal: enabled });
    },
    [activeImage, applyTransformToGroup],
  );

  const toggleActiveImageFlipVertical = useCallback(
    (enabled: boolean) => {
      const base = activeImage?.previewTransform ?? {
        rotation: 0,
        flipHorizontal: false,
        flipVertical: false,
      };

      applyTransformToGroup({ ...base, flipVertical: enabled });
    },
    [activeImage, applyTransformToGroup],
  );

  const updateActiveImageCropAdjust = useCallback(
    (adjust: { zoom: number; panX: number; panY: number } | undefined) => {
      applyCropAdjustToGroup(adjust);
    },
    [applyCropAdjustToGroup],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      const preferredIndex = pendingSelectionSlotRef.current ?? undefined;

      pendingSelectionSlotRef.current = null;

      if (files && files.length > 0) {
        onUploadAttemptStart?.();
        if (files.length === 1) {
          void validateAndStoreFile(files[0], preferredIndex);
        } else {
          const validFiles: File[] = [];
          for (const file of Array.from(files)) {
            if (IMAGE_VALIDATION_RULES.acceptedMimeTypes.includes(
              file.type as typeof IMAGE_VALIDATION_RULES.acceptedMimeTypes[number],
            )) {
              validFiles.push(file);
            }
          }
          const maxAllowed = IMAGE_VALIDATION_RULES.maxSelectedImages - selectedImageCount;
          const filesToProcess = validFiles.slice(0, maxAllowed);

          let currentImages = [...selectedImagesRef.current];
          for (const file of filesToProcess) {
            const insertionIndex = currentImages.findIndex((image) => image === null);
            if (insertionIndex < 0) break;

            addOrReplaceSelection(file, insertionIndex);
            currentImages = [...currentImages];
            currentImages[insertionIndex] = {
              ...buildSelectedImageItem(file, true),
            };
          }
        }
      }

      e.currentTarget.value = "";
    },
    [validateAndStoreFile, selectedImageCount, addOrReplaceSelection, buildSelectedImageItem, onUploadAttemptStart],
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

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        onUploadAttemptStart?.();
        const validFiles: File[] = [];
        for (const file of Array.from(files)) {
          if (IMAGE_VALIDATION_RULES.acceptedMimeTypes.includes(
            file.type as typeof IMAGE_VALIDATION_RULES.acceptedMimeTypes[number],
          )) {
            validFiles.push(file);
          }
        }
        const maxAllowed = IMAGE_VALIDATION_RULES.maxSelectedImages - selectedImageCount;
        const filesToProcess = validFiles.slice(0, maxAllowed);

        let currentImages = [...selectedImagesRef.current];
        for (const file of filesToProcess) {
          const insertionIndex = currentImages.findIndex((image) => image === null);
          if (insertionIndex < 0) break;

          addOrReplaceSelection(file, insertionIndex);
          currentImages = [...currentImages];
          currentImages[insertionIndex] = {
            ...buildSelectedImageItem(file, true),
          };
        }
      }
    },
    [selectedImageCount, addOrReplaceSelection, buildSelectedImageItem, onUploadAttemptStart],
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
      setIsTriptychSplit(false);
      setIsTriptychLinked(true);

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
      setShowRemoveSlotDialog(true);
    }
  }, []);

  const handleConfirmRemoveSlot = useCallback(() => {
    setShowRemoveSlotDialog(false);
    const currentActiveIndex = activeImageIndexRef.current;
    if (typeof currentActiveIndex === "number") {
      handleRemoveImageSlot(currentActiveIndex);
    }
  }, [handleRemoveImageSlot]);

  const handleCancelRemoveSlot = useCallback(() => {
    setShowRemoveSlotDialog(false);
  }, []);

  const handleCancel = useCallback(() => {
    setShowRemoveSlotDialog(false);
    setSelectedImages((prevImages) => {
      if (prevImages.some(Boolean)) {
        revokePreviewUrls(prevImages);
      }

      return createEmptySelectionSlots();
    });
    setActiveImageIndex(null);
    updateSelectedImageMetadata(null);
    setIsTriptychSplit(false);
    userSelectedPaintingSizeRef.current = false;
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

    let targetSize = selectedPaintingSize;
    if (selectedImageMetadata) {
      // Project printability at the seamless window width (portrait window of
      // the panorama) so the auto-selected triptych size matches what each
      // printed canvas can actually support — wide panoramas yield narrower
      // windows and thus a smaller recommended size, without losing the masked
      // left/right edges the user can still drag to reveal.
      const projection = projectTriptychPrintability(
        selectedImageMetadata.width,
        selectedImageMetadata.height,
        selectedPaintingSize,
        TRIPTYCH_PROJECTED_SHAPE,
        getTargetAspectRatio("vertical"),
      );
      targetSize = resolveTriptychTargetSizeIndex(
        selectedPaintingSize,
        projection,
      );
    }

    try {
      // Remember the pre-split source so external consumers (panoramka) keep
      // displaying the image the user originally loaded.
      triptychSourceUrlRef.current = activeImage.previewUrl;

      // Wide panoramas use the seamless window model: each of the three panels
      // becomes a contiguous portrait window cut from the shared panorama, so
      // they meet edge-to-edge and can be dragged/zoomed as one continuous
      // image with no gaps (mirroring the square-image top/bottom pan on the
      // horizontal axis). A shared zoom is supported natively by the window
      // crop. A pre-split rotation/flip is baked into a single transformed
      // source so the windows can still share one image in display space.
      const sourceWidth =
        activeImage.metadata?.width ?? selectedImageMetadata?.width ?? 0;
      const sourceHeight =
        activeImage.metadata?.height ?? selectedImageMetadata?.height ?? 0;
      const verticalFrameAspect = getTargetAspectRatio("vertical");
      const preTransform = activeImage.previewTransform;
      const preRotation =
        (((preTransform?.rotation ?? 0) % 360) + 360) % 360;
      const isQuarterTurn = preRotation === 90 || preRotation === 270;
      // Effective dimensions after rotation — 90°/270° swap the axes.
      const effectiveWidth = isQuarterTurn ? sourceHeight : sourceWidth;
      const effectiveHeight = isQuarterTurn ? sourceWidth : sourceHeight;
      const useSeamlessWindows =
        effectiveWidth > 0 &&
        effectiveHeight > 0 &&
        isWidePanoramaForTriptych(
          effectiveWidth,
          effectiveHeight,
          verticalFrameAspect,
        );

      if (useSeamlessWindows) {
        const hasPreTransform =
          preRotation !== 0 ||
          !!preTransform?.flipHorizontal ||
          !!preTransform?.flipVertical;

        // Source shared by all three windows. When a transform is present it
        // is baked once into a single upright buffer; the window crop math
        // then runs in display space with an identity transform.
        let sharedFile = activeImage.file;
        let sharedMetadata = activeImage.metadata ?? null;
        if (hasPreTransform) {
          const composed = await composeFullTransformedImage({
            previewUrl: activeImage.previewUrl,
            sourceFile: activeImage.file,
            previewTransform: preTransform,
          });
          sharedFile = composed.file;
          sharedMetadata = {
            width: composed.width,
            height: composed.height,
            aspectRatio: formatAspectRatio(composed.width, composed.height),
          };
        }

        setSelectedImages((prevImages) => {
          if (prevImages.some(Boolean)) {
            revokePreviewUrls(prevImages, triptychSourceUrlRef.current);
          }

          return [0, 1, 2].map((windowIndex) => ({
            ...buildSelectedImageItem(sharedFile, false),
            displayImageProportion: "vertical" as ImageDisplayProportion,
            // Every window slot shows the full shared panorama; the visible
            // region is a per-panel window crop computed at render time.
            metadata: sharedMetadata,
            previewEffects: {
              ...activeImage.previewEffects,
            },
            previewTransform: {
              rotation: 0,
              flipHorizontal: false,
              flipVertical: false,
            },
            // Carry the pre-split zoom into the windows so the user does not
            // lose their zoom level at split time; pan is reset because the
            // window model recenters the band (its pan range differs from the
            // pre-split centered-crop pan range).
            previewCropAdjust:
              activeImage.previewCropAdjust &&
              activeImage.previewCropAdjust.zoom > 1
                ? {
                    zoom: activeImage.previewCropAdjust.zoom,
                    panX: 0,
                    panY: 0,
                  }
                : undefined,
            triptychWindowIndex: windowIndex,
          }));
        });
      } else {
        const splitFiles = await splitImageIntoVerticalThirdFiles({
          previewUrl: activeImage.previewUrl,
          sourceFile: activeImage.file,
          metadata: activeImage.metadata,
          proportion: activeImage.displayImageProportion,
          previewTransform: activeImage.previewTransform,
          previewCropAdjust: activeImage.previewCropAdjust,
        });

        setSelectedImages((prevImages) => {
          if (prevImages.some(Boolean)) {
            revokePreviewUrls(prevImages, triptychSourceUrlRef.current);
          }

          return splitFiles.map((file) => ({
            ...buildSelectedImageItem(file, false),
            displayImageProportion: "vertical" as ImageDisplayProportion,
            previewEffects: {
              ...activeImage.previewEffects,
            },
            // The pre-split crop/transform is now baked into the slices, so the
            // parts start without any local crop adjust.
            previewCropAdjust: undefined,
          }));
        });
      }

      setActiveImageIndex(CENTER_SLOT_INDEX);
      activeImageIndexRef.current = CENTER_SLOT_INDEX;
      onImageMetadataChange?.(null);
      userSelectedPaintingSizeRef.current = true;
      setSelectedPaintingSize(targetSize);
      setIsTriptychSplit(true);
      setIsTriptychLinked(true);
    } catch {
      onUploadError?.(t("upload.error"));
    }
  }, [
    activeImage,
    buildSelectedImageItem,
    onImageMetadataChange,
    onUploadError,
    revokePreviewUrls,
    selectedImageMetadata,
    selectedPaintingSize,
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

  const bestDisplayImageProportion = useMemo(() => {
    if (!selectedImageMetadata) {
      return null;
    }

    return getOptimalDisplayProportion(
      selectedImageMetadata.width,
      selectedImageMetadata.height,
    );
  }, [selectedImageMetadata]);

  const paintingShape = useMemo<PaintingShape>(
    () => (displayImageProportion === "square" ? "square" : "rectangular"),
    [displayImageProportion],
  );

  const sizesDpiInfo = useMemo((): SizeDpiInfo[] | undefined => {
    if (!selectedImageMetadata) {
      return undefined;
    }

    return computeSizesDpiAvailability(
      selectedImageMetadata.width,
      selectedImageMetadata.height,
      paintingShape,
    );
  }, [selectedImageMetadata, paintingShape]);

  const splitPrintability = useMemo(() => {
    if (!selectedImageMetadata) {
      return null;
    }

    return projectTriptychPrintability(
      selectedImageMetadata.width,
      selectedImageMetadata.height,
      selectedPaintingSize,
    );
  }, [selectedImageMetadata, selectedPaintingSize]);

  useEffect(() => {
    if (!sizesDpiInfo) return;

    if (!userSelectedPaintingSizeRef.current) {
      setSelectedPaintingSize(resolveRecommendedPaintingSize(sizesDpiInfo));
      return;
    }

    const currentInfo = sizesDpiInfo.find(
      (info) => info.sizeIndex === selectedPaintingSize,
    );
    if (!currentInfo) {
      setSelectedPaintingSize(resolveRecommendedPaintingSize(sizesDpiInfo));
      return;
    }
    if (!currentInfo.isAvailable) {
      const largestAvailable = [...sizesDpiInfo]
        .filter((info) => info.isAvailable)
        .sort((a, b) => b.sizeIndex - a.sizeIndex)[0];
      if (largestAvailable) {
        setSelectedPaintingSize(largestAvailable.sizeIndex);
      }
    }
  }, [sizesDpiInfo, selectedPaintingSize]);

  const computedDebugData = useMemo((): ImageDebugData | null => {
    if (!selectedImageMetadata) {
      return null;
    }

    const shape: PaintingShape = displayImageProportion === "square" ? "square" : "rectangular";
    const sizeOptions = getPaintingSizeOptions(shape);
    const currentSize = sizeOptions.find((opt) => opt.key === selectedPaintingSize);
    const currentSizeInfo = sizesDpiInfo?.find(
      (i) => i.sizeIndex === selectedPaintingSize,
    );
    const dpi = currentSizeInfo?.dpi ?? 0;
    const dpiQuality = currentSizeInfo?.quality ?? "low";
    const printDims = currentSize
      ? getOrientedPaintingDimensions(
          currentSize,
          getPaintingOrientation(displayImageProportion),
        )
      : null;

    return {
      metadata: selectedImageMetadata,
      displayProportion: displayImageProportion,
      suggestedProportion: bestDisplayImageProportion,
      coveragePercent: coveragePercent ?? {},
      effectiveDpi: dpi,
      dpiQuality,
      printSizeLabel: printDims ? `${printDims.widthCm}×${printDims.heightCm} cm` : "",
    };
  }, [selectedImageMetadata, displayImageProportion, bestDisplayImageProportion, coveragePercent, selectedPaintingSize, sizesDpiInfo]);

  const prevDebugDataRef = useRef<ImageDebugData | null>(null);
  useEffect(() => {
    if (!onDebugDataChange) return;
    if (computedDebugData === prevDebugDataRef.current) return;
    prevDebugDataRef.current = computedDebugData;
    onDebugDataChange(computedDebugData);
  }, [computedDebugData, onDebugDataChange]);

  const previewFrameAspectRatio = useMemo(
    () => getTargetAspectRatio(displayImageProportion),
    [displayImageProportion],
  );

  const handleSelectProportion = useCallback(
    (proportion: Parameters<FooterToolsBarProps["onSelectProportion"]>[0]) => {
      updateActiveImage((image) => ({
        ...image,
        displayImageProportion:
          proportion === "rectangle" ? "square" : proportion,
        previewCropAdjust: undefined,
      }));
    },
    [updateActiveImage],
  );

  const handleSelectPaintingSize = useCallback(
    (index: PaintingSizeIndex) => {
      userSelectedPaintingSizeRef.current = true;
      setSelectedPaintingSize(index);
    },
    [],
  );

  const paintingAspectRatio = useMemo(
    () => getTargetAspectRatio(displayImageProportion),
    [displayImageProportion],
  );

  const enterEffectsEditMode = useCallback(() => {
    setEffectsEditMode("settings");
    setIsEffectsEditMode(true);
    setIsZoomPanMode(false);
  }, []);

  const enterAiEditMode = useCallback(() => {
    setEffectsEditMode("ai");
    setIsEffectsEditMode(true);
    setIsZoomPanMode(false);
  }, []);

  const toggleZoomPan = useCallback(() => {
    setIsZoomPanMode((prev) => !prev);
    setIsEffectsEditMode(false);
  }, []);

  const computedToolsBarProps = useMemo((): FooterToolsBarProps | null => {
    if (selectedImageCount === 0) {
      return null;
    }

    return {
      onSplitImage: () => void handleSplitActiveImage(),
      canSplitImage:
        !!activeImage && !(splitPrintability?.noSizePrintable ?? false),
      shouldConfirmSplit:
        selectedImageCount > 1 ||
        (splitPrintability?.willSelectedSizeBeBlocked ?? false),
      splitConfirmVariant: resolveSplitConfirmVariant(
        selectedImageCount > 1,
        splitPrintability?.willSelectedSizeBeBlocked ?? false,
      ),
      triptychDisabledReason: splitPrintability?.noSizePrintable
        ? "noPrintableSize"
        : undefined,
      isTriptychLinked,
      canToggleTriptychLink:
        isTriptychSplit &&
        selectedImages.length === MAX_SELECTED_IMAGES &&
        selectedImages.every(Boolean),
      onToggleTriptychLink: toggleTriptychLink,
      onSelectProportion: handleSelectProportion,
      coveragePercent,
      selectedProportion:
        displayImageProportion === "square"
          ? "rectangle"
          : displayImageProportion,
      showCoverageDetails: shouldShowUploaderDebugData,
      isZoomPanMode: isZoomPanMode,
      onToggleZoomPan: toggleZoomPan,
      canToggleZoomPan: !!activeImage && !isEffectsEditMode,
      onEnterAiEditMode: enterAiEditMode,
      canUpdateAiEffects: !!activeImage,
      canUpdateEffects: !!activeImage,
      isEditMode: isEffectsEditMode,
      onEnterEditMode: enterEffectsEditMode,
      onReset: onReset ?? (() => {}),
      canReset: !!onReset && selectedImageCount > 0,
      selectedPaintingSize,
      onSelectPaintingSize: handleSelectPaintingSize,
      paintingShape,
      sizesDpiInfo,
    };
  }, [
    selectedImageCount,
    handleSplitActiveImage,
    activeImage,
    handleSelectProportion,
    coveragePercent,
    displayImageProportion,
    shouldShowUploaderDebugData,
    isEffectsEditMode,
    isZoomPanMode,
    enterEffectsEditMode,
    enterAiEditMode,
    toggleZoomPan,
    onReset,
    selectedPaintingSize,
    handleSelectPaintingSize,
    paintingShape,
    sizesDpiInfo,
    splitPrintability,
    isTriptychSplit,
    isTriptychLinked,
    toggleTriptychLink,
    selectedImages,
  ]);

  const prevToolsBarPropsRef = useRef<FooterToolsBarProps | null>(null);
  useEffect(() => {
    if (!onToolsPanelPropsChange) return;
    if (computedToolsBarProps === prevToolsBarPropsRef.current) return;
    prevToolsBarPropsRef.current = computedToolsBarProps;
    onToolsPanelPropsChange(computedToolsBarProps);
  }, [computedToolsBarProps, onToolsPanelPropsChange]);

  const computedSlotSwitcherProps = useMemo((): SlotSwitcherBarProps | null => {
    if (selectedImageCount === 0) return null;
    return {
      slots: selectedImages,
      activeSlotIndex: activeImageIndex,
      onSelectSlot: handlePreviewSlotSelect,
      hidden: isEffectsEditMode || isZoomPanMode || isDesktopTriptych,
    };
  }, [selectedImageCount, selectedImages, activeImageIndex, handlePreviewSlotSelect, isEffectsEditMode, isZoomPanMode, isDesktopTriptych]);

  useEffect(() => {
    if (!onSlotSwitcherPropsChange) return;
    onSlotSwitcherPropsChange(computedSlotSwitcherProps);
  }, [computedSlotSwitcherProps, onSlotSwitcherPropsChange]);

  useEffect(() => {
    selectedImagesRef.current = selectedImages;
  }, [selectedImages]);

  useEffect(() => {
    activeImageIndexRef.current = activeImageIndex;
  }, [activeImageIndex]);

  useEffect(() => {
    onSelectionStateChange?.(selectedImageCount > 0);
  }, [onSelectionStateChange, selectedImageCount]);

  // While triptych mode is active, keep reporting the pre-split source: the
  // slots hold parts/windows of it, not the image the user loaded.
  const activeImageSrc = isTriptychSplit
    ? triptychSourceUrlRef.current
    : (activeImage?.previewUrl ?? null);
  useEffect(() => {
    onActiveImageSrcChange?.(activeImageSrc);
  }, [onActiveImageSrcChange, activeImageSrc]);

  // Release the preserved triptych source once the mode is exited; by then the
  // notification above has already switched consumers to the current source.
  useEffect(() => {
    if (isTriptychSplit || triptychSourceUrlRef.current === null) {
      return;
    }
    URL.revokeObjectURL(triptychSourceUrlRef.current);
    triptychSourceUrlRef.current = null;
  }, [isTriptychSplit]);

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
      if (triptychSourceUrlRef.current !== null) {
        URL.revokeObjectURL(triptychSourceUrlRef.current);
        triptychSourceUrlRef.current = null;
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

  const removeSlotDialog = (
    <AlertDialog open={showRemoveSlotDialog} onOpenChange={(open) => { if (!open) handleCancelRemoveSlot(); }}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <TriangleAlert className="h-4 w-4 text-destructive" aria-hidden="true" />
            {t("uploader.removeSlotConfirmTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("uploader.removeSlotConfirmDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("uploader.cancel")}</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleConfirmRemoveSlot}>
            {t("uploader.removeSlotConfirmAction")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  if (selectedImageCount === 0) {
    return (
      <>
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
      </>
    );
  }

  return (
    <>
      {removeSlotDialog}
      <Card className="mx-auto flex h-full w-full max-w-2xl md:max-w-4xl lg:max-w-6xl xl:max-w-7xl flex-col border-0 bg-transparent! shadow-none! ring-0!">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
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
      <CardContent className="relative flex-1 flex flex-col overflow-hidden pb-2 lg:pb-1">
        <h2 className="sr-only">{t("uploader.adjustImage")}</h2>
        <div className="flex-[0.15] md:hidden" />
        <div className="flex flex-1 flex-col gap-3 sm:gap-8 min-h-0">
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
          swipeDisabled={isEffectsEditMode || isZoomPanMode}
          isEditMode={isEffectsEditMode || isZoomPanMode}
          previewCropAdjust={activeImage?.previewCropAdjust}
          onCropAdjustChange={updateActiveImageCropAdjust}
          onTouchStart={handleSliderTouchStart}
          onTouchEnd={handleSliderTouchEnd}
          onMetadataResolved={handleMetadataResolved}
          onSelectEmptySlot={
            typeof activeImageIndex === "number"
              ? () => handlePreviewSlotSelect(activeImageIndex)
              : undefined
          }
          onClearSlot={activeImage ? handleRemoveActiveImage : undefined}
          selectedPaintingSize={selectedPaintingSize}
          paintingAspectRatio={paintingAspectRatio}
          paintingShape={paintingShape}
          slots={selectedImages}
          onSelectSlot={handlePreviewSlotSelect}
          getSlotPreviewUrl={getTransformedImagePreviewUrl}
          isDesktopTriptych={isDesktopTriptych}
          isTriptychLinked={isTriptychLinked}
        />

        <UploaderPreviewToolsPanel
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
          onEditModeChange={setIsEffectsEditMode}
          activeImageCropAdjust={activeImage?.previewCropAdjust}
          onUpdateCropAdjust={updateActiveImageCropAdjust}
          isZoomAvailable={!!selectedImageMetadata}
          externalEditMode={isEffectsEditMode}
          effectsMode={effectsEditMode}
        />
        </div>
      </CardContent>
    </Card>
    </>
  );
});

ImageUploader.displayName = "ImageUploader";
