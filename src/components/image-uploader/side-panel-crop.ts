import type { CropCalculationResult } from "./image-proportion-calculator";
import { calculateMaxCenteredCrop } from "./image-proportion-calculator";
import { adjustCropForZoomPan } from "./use-crop-adjust";
import { resolveTriptychSlotCrop } from "./triptych-window-crop";
import { loadImageElement } from "./preview-canvas-utils";
import type { SelectedImageItem } from "./image-uploader";

/**
 * Compute the source crop a desktop-triptych side panel must display.
 *
 * Seamless window slots (triptychWindowIndex set) resolve their contiguous
 * portrait window on the shared panorama; other slots use the centered crop
 * adjusted by the slot's zoom/pan. Returns null until dimensions are known —
 * callers decide whether to wait for slot metadata or the decoded image.
 */
export function computeSidePanelCrop(
  image: SelectedImageItem,
  sourceDims: { width: number; height: number } | null,
): CropCalculationResult | null {
  if (!sourceDims || sourceDims.width <= 0 || sourceDims.height <= 0) {
    return null;
  }

  if (image.triptychWindowIndex !== undefined) {
    return resolveTriptychSlotCrop({
      sourceWidth: sourceDims.width,
      sourceHeight: sourceDims.height,
      displayImageProportion: image.displayImageProportion,
      windowIndex: image.triptychWindowIndex,
      cropAdjust: image.previewCropAdjust,
    });
  }

  const baseCrop = calculateMaxCenteredCrop({
    sourceWidth: sourceDims.width,
    sourceHeight: sourceDims.height,
    proportion: image.displayImageProportion,
  });
  const cropAdjust = image.previewCropAdjust;
  return cropAdjust
    ? adjustCropForZoomPan(
        baseCrop,
        cropAdjust.zoom,
        cropAdjust.panX,
        cropAdjust.panY,
      )
    : baseCrop;
}

const IMAGE_CACHE_LIMIT = 4;
const imageElementCache = new Map<string, Promise<HTMLImageElement>>();

/**
 * Decode an image URL once and share the element between callers.
 *
 * The three triptych panels reference the same multi-megapixel panorama;
 * decoding it per panel (each ~4 bytes/px) exhausts the canvas/GPU budget
 * and blanks previews. The cache holds a handful of entries — enough for a
 * triptych plus a source — and evicts oldest-first.
 */
export function loadCachedImageElement(url: string): Promise<HTMLImageElement> {
  const cached = imageElementCache.get(url);
  if (cached) {
    return cached;
  }

  const promise = loadImageElement(url).catch((error) => {
    imageElementCache.delete(url);
    throw error;
  });
  imageElementCache.set(url, promise);

  if (imageElementCache.size > IMAGE_CACHE_LIMIT) {
    const oldestUrl = imageElementCache.keys().next().value;
    if (oldestUrl !== undefined && oldestUrl !== url) {
      imageElementCache.delete(oldestUrl);
    }
  }

  return promise;
}
