import { formatAspectRatio } from "./image-proportion-calculator";
import type { SelectedImageMetadata } from "./image-uploader";

export const buildPreviewImageMetadata = ({
  sourceWidth,
  sourceHeight,
}: {
  sourceWidth: number;
  sourceHeight: number;
}): SelectedImageMetadata => {
  return {
    width: sourceWidth,
    height: sourceHeight,
    aspectRatio: formatAspectRatio(sourceWidth, sourceHeight),
  };
};
