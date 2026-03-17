import { useMemo } from "react";
import type { SelectedImageItem } from "./image-uploader";

interface UsePreviewSliderSlotsParams {
  selectedImages: Array<SelectedImageItem | null>;
  activeImageIndex: number | null;
}

export const usePreviewSliderSlots = ({
  selectedImages,
  activeImageIndex,
}: UsePreviewSliderSlotsParams) => {
  const leftSlotIndex = useMemo(() => {
    return typeof activeImageIndex === "number" && activeImageIndex > 0
      ? activeImageIndex - 1
      : null;
  }, [activeImageIndex]);

  const rightSlotIndex = useMemo(() => {
    return typeof activeImageIndex === "number" &&
      activeImageIndex < selectedImages.length - 1
      ? activeImageIndex + 1
      : null;
  }, [activeImageIndex, selectedImages.length]);

  const leftSlotImage = useMemo(() => {
    return typeof leftSlotIndex === "number" ? selectedImages[leftSlotIndex] : null;
  }, [leftSlotIndex, selectedImages]);

  const rightSlotImage = useMemo(() => {
    return typeof rightSlotIndex === "number" ? selectedImages[rightSlotIndex] : null;
  }, [rightSlotIndex, selectedImages]);

  return {
    leftSlotIndex,
    rightSlotIndex,
    leftSlotImage,
    rightSlotImage,
  };
};
