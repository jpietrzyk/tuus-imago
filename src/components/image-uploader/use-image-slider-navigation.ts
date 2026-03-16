import { useMemo } from "react";
import type { SelectedImageItem } from "./image-uploader";

interface UseImageSliderNavigationParams {
  selectedImages: Array<SelectedImageItem | null>;
  activeImageIndex: number | null;
}

export const useImageSliderNavigation = ({
  selectedImages,
  activeImageIndex,
}: UseImageSliderNavigationParams) => {
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

  return {
    previousFilledSlotIndex,
    nextFilledSlotIndex,
    canMovePrevious: previousFilledSlotIndex !== null,
    canMoveNext: nextFilledSlotIndex !== null,
  };
};
