import { useEffect } from "react";
import {
  getOptimalDisplayProportion,
  type ImageDisplayProportion,
} from "./image-proportion-calculator";

interface UseSideSlotProportionResolveParams {
  image: {
    previewUrl: string;
    autoSelectOptimalPending?: boolean;
    displayImageProportion: ImageDisplayProportion;
    metadata: { width: number; height: number } | null;
  } | null;
  onProportionResolved: (proportion: ImageDisplayProportion) => void;
}

export const useSideSlotProportionResolve = ({
  image,
  onProportionResolved,
}: UseSideSlotProportionResolveParams) => {
  useEffect(() => {
    if (!image || !image.autoSelectOptimalPending || image.metadata) {
      return;
    }

    let isActive = true;

    const resolveProportion = async () => {
      try {
        const img = new Image();
        img.src = image.previewUrl;

        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("Failed to load image"));
        });

        if (!isActive || !img.naturalWidth || !img.naturalHeight) {
          return;
        }

        const optimal = getOptimalDisplayProportion(
          img.naturalWidth,
          img.naturalHeight,
        );

        onProportionResolved(optimal);
      } catch {
        // keep default horizontal proportion on load failure
      }
    };

    void resolveProportion();

    return () => {
      isActive = false;
    };
  }, [image, onProportionResolved]);
};
