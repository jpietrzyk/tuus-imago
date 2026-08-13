import {
  loadImageElement,
  resolveImageDimensions,
  isIdentityPreviewTransform,
  normalizeRotation,
  type PreviewTransform,
} from "./preview-canvas-utils";
import {
  calculateMaxCenteredCrop,
  invertDisplayProportion,
  type CropCalculationResult,
  type ImageDisplayProportion,
} from "./image-proportion-calculator";
import { adjustCropForZoomPan } from "./use-crop-adjust";

const PART_COUNT = 3;

interface ComposeSourceParams {
  image: CanvasImageSource;
  metadata: { width: number; height: number };
  proportion: ImageDisplayProportion;
  previewTransform?: PreviewTransform | null;
  previewCropAdjust?: { zoom: number; panX: number; panY: number } | null;
}

interface ComposedDrawable {
  drawable: CanvasImageSource;
  width: number;
  height: number;
}

/**
 * Render the source image with its rotation/flip and zoom/pan crop applied,
 * producing a single composed canvas that represents exactly what the user
 * saw in the preview before splitting. The triptych slices are then cut from
 * this composed canvas so every part keeps the pre-split effect.
 */
const resolveComposedCrop = ({
  metadata,
  proportion,
  previewTransform,
  previewCropAdjust,
}: Omit<ComposeSourceParams, "image">): {
  crop: CropCalculationResult;
  normalizedRotation: number;
  isQuarterTurn: boolean;
} => {
  const sourceWidth = metadata.width;
  const sourceHeight = metadata.height;

  if (sourceWidth <= 0 || sourceHeight <= 0) {
    throw new Error("Cannot compose image with invalid dimensions");
  }

  const normalizedRotation = normalizeRotation(previewTransform?.rotation);
  const isQuarterTurn = normalizedRotation === 90 || normalizedRotation === 270;

  // For 90°/270° rotations the on-screen axes swap, so the crop must be
  // selected against the inverse frame aspect — mirroring the live preview
  // (use-preview-canvas-render.ts) so the baked region matches what the user
  // saw.
  const baseCrop = calculateMaxCenteredCrop({
    sourceWidth,
    sourceHeight,
    proportion: isQuarterTurn ? invertDisplayProportion(proportion) : proportion,
  });

  const crop =
    previewCropAdjust && previewCropAdjust.zoom > 1
      ? adjustCropForZoomPan(
          baseCrop,
          previewCropAdjust.zoom,
          previewCropAdjust.panX,
          previewCropAdjust.panY,
        )
      : baseCrop;

  return { crop, normalizedRotation, isQuarterTurn };
};

/**
 * Render the source image with its rotation/flip and zoom/pan crop applied,
 * producing a single composed canvas that represents exactly what the user
 * saw in the preview before splitting. Used when a rotation or flip is present
 * (the no-transform/no-flip path slices the source directly to avoid this
 * full-resolution intermediate buffer).
 */
const composeSourceDrawable = (params: ComposeSourceParams): ComposedDrawable => {
  const { image, previewTransform } = params;
  const { crop: adjustedCrop, normalizedRotation, isQuarterTurn } =
    resolveComposedCrop(params);

  const cropWidth = Math.max(1, Math.round(adjustedCrop.cropWidth));
  const cropHeight = Math.max(1, Math.round(adjustedCrop.cropHeight));

  // A 90°/270° rotation swaps the on-screen axes, so the buffer must mirror
  // that swap to keep the drawn content upright and un-stretched.
  const canvasWidth = isQuarterTurn ? cropHeight : cropWidth;
  const canvasHeight = isQuarterTurn ? cropWidth : cropHeight;

  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to prepare image composition canvas context");
  }

  // Order matches the live canvas preview and Cloudinary transform:
  // rotate, then hflip, then vflip.
  context.save();
  context.translate(canvasWidth / 2, canvasHeight / 2);
  context.rotate((normalizedRotation * Math.PI) / 180);
  if (previewTransform?.flipHorizontal) {
    context.scale(-1, 1);
  }
  if (previewTransform?.flipVertical) {
    context.scale(1, -1);
  }

  const rectWidth = isQuarterTurn ? cropHeight : cropWidth;
  const rectHeight = isQuarterTurn ? cropWidth : cropHeight;

  context.drawImage(
    image,
    adjustedCrop.cropX,
    adjustedCrop.cropY,
    adjustedCrop.cropWidth,
    adjustedCrop.cropHeight,
    -rectWidth / 2,
    -rectHeight / 2,
    rectWidth,
    rectHeight,
  );
  context.restore();

  return { drawable: canvas, width: canvasWidth, height: canvasHeight };
};

export interface ComposeFullTransformedResult {
  file: File;
  /** Composed buffer width in px (axes swapped for 90°/270°). */
  width: number;
  /** Composed buffer height in px (axes swapped for 90°/270°). */
  height: number;
}

/**
 * Bake a rotation/flip into the FULL source image (no crop), producing a single
 * upright/unflipped buffer. Used so a seamless wide-panorama triptych can share
 * one pre-transformed image across its three scrolling windows — the window
 * crop math then runs in display space without re-applying the transform.
 */
export const composeFullTransformedImage = async ({
  previewUrl,
  sourceFile,
  previewTransform,
}: {
  previewUrl: string;
  sourceFile: File;
  previewTransform?: PreviewTransform | null;
}): Promise<ComposeFullTransformedResult> => {
  const image = await loadImageElement(previewUrl);
  const { sourceWidth, sourceHeight } = resolveImageDimensions(image);

  if (sourceWidth <= 0 || sourceHeight <= 0) {
    throw new Error("Cannot compose image with invalid dimensions");
  }

  const normalizedRotation = normalizeRotation(previewTransform?.rotation);
  const isQuarterTurn = normalizedRotation === 90 || normalizedRotation === 270;

  // A 90°/270° rotation swaps the on-screen axes, so the buffer dims swap too.
  const canvasWidth = isQuarterTurn ? sourceHeight : sourceWidth;
  const canvasHeight = isQuarterTurn ? sourceWidth : sourceHeight;

  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to prepare image composition canvas context");
  }

  // Order matches the live canvas preview, Cloudinary transform and
  // composeSourceDrawable: rotate, then hflip, then vflip.
  context.save();
  context.translate(canvasWidth / 2, canvasHeight / 2);
  context.rotate((normalizedRotation * Math.PI) / 180);
  if (previewTransform?.flipHorizontal) {
    context.scale(-1, 1);
  }
  if (previewTransform?.flipVertical) {
    context.scale(1, -1);
  }

  const rectWidth = isQuarterTurn ? sourceHeight : sourceWidth;
  const rectHeight = isQuarterTurn ? sourceWidth : sourceHeight;

  context.drawImage(
    image,
    -rectWidth / 2,
    -rectHeight / 2,
    rectWidth,
    rectHeight,
  );
  context.restore();

  const outputMimeType = resolveOutputMimeType(sourceFile.type);
  const outputExtension = inferExtension(outputMimeType);
  const baseFilename = stripExtension(sourceFile.name);
  const blob = await canvasToBlob(canvas, outputMimeType);

  const file = new File(
    [blob],
    `${baseFilename}-transformed.${outputExtension}`,
    { type: outputMimeType, lastModified: Date.now() },
  );

  return { file, width: canvasWidth, height: canvasHeight };
};

const resolveOutputMimeType = (sourceMimeType: string): string => {
  if (
    sourceMimeType === "image/jpeg" ||
    sourceMimeType === "image/png" ||
    sourceMimeType === "image/webp"
  ) {
    return sourceMimeType;
  }

  return "image/png";
};

const inferExtension = (mimeType: string): string => {
  if (mimeType === "image/jpeg") {
    return "jpg";
  }

  if (mimeType === "image/png") {
    return "png";
  }

  if (mimeType === "image/webp") {
    return "webp";
  }

  return "png";
};

const stripExtension = (filename: string): string => {
  const trimmed = filename.trim();
  const dotIndex = trimmed.lastIndexOf(".");

  if (dotIndex <= 0) {
    return trimmed || "split-image";
  }

  return trimmed.slice(0, dotIndex);
};

const dataUrlToBlob = (dataUrl: string, mimeType: string): Blob => {
  const [, encodedPayload = ""] = dataUrl.split(",", 2);

  if (!encodedPayload) {
    return new Blob([], { type: mimeType });
  }

  const binaryString = atob(encodedPayload);
  const bytes = new Uint8Array(binaryString.length);

  for (let index = 0; index < binaryString.length; index += 1) {
    bytes[index] = binaryString.charCodeAt(index);
  }

  return new Blob([bytes], { type: mimeType });
};

const canvasToBlob = async (
  canvas: HTMLCanvasElement,
  mimeType: string,
): Promise<Blob> => {
  if (typeof canvas.toBlob === "function") {
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((result) => {
        resolve(result);
      }, mimeType);
    });

    if (blob) {
      return blob;
    }
  }

  if (typeof canvas.toDataURL === "function") {
    const dataUrl = canvas.toDataURL(mimeType);
    return dataUrlToBlob(dataUrl, mimeType);
  }

  return new Blob([], { type: mimeType });
};

const drawSliceToCanvas = ({
  drawable,
  sliceStartX,
  sliceWidth,
  sourceHeight,
}: {
  drawable: CanvasImageSource;
  sliceStartX: number;
  sliceWidth: number;
  sourceHeight: number;
}): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  canvas.width = sliceWidth;
  canvas.height = sourceHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to prepare image split canvas context");
  }

  context.drawImage(
    drawable,
    sliceStartX,
    0,
    sliceWidth,
    sourceHeight,
    0,
    0,
    sliceWidth,
    sourceHeight,
  );

  return canvas;
};

const sliceDrawableIntoFiles = async ({
  drawable,
  drawableWidth,
  drawableHeight,
  baseFilename,
  outputMimeType,
  outputExtension,
}: {
  drawable: CanvasImageSource;
  drawableWidth: number;
  drawableHeight: number;
  baseFilename: string;
  outputMimeType: string;
  outputExtension: string;
}): Promise<[File, File, File]> => {
  const singleSliceWidth = Math.floor(drawableWidth / PART_COUNT);

  const splitFiles = await Promise.all(
    Array.from({ length: PART_COUNT }, async (_, index) => {
      const sliceStartX = singleSliceWidth * index;
      const sliceWidth =
        index === PART_COUNT - 1
          ? drawableWidth - sliceStartX
          : singleSliceWidth;

      const canvas = drawSliceToCanvas({
        drawable,
        sliceStartX,
        sliceWidth,
        sourceHeight: drawableHeight,
      });

      const blob = await canvasToBlob(canvas, outputMimeType);

      return new File(
        [blob],
        `${baseFilename}-part-${index + 1}.${outputExtension}`,
        {
          type: outputMimeType,
          lastModified: Date.now(),
        },
      );
    }),
  );

  return splitFiles as [File, File, File];
};

/**
 * Draw a single vertical third directly from the source image's crop region,
 * avoiding a full-resolution intermediate compose canvas. Only valid for the
 * no-rotation / no-flip path (the slice geometry matches the compose-then-slice
 * result because each third is an unmirrored vertical strip of the crop).
 */
const drawDirectCropSliceToCanvas = ({
  image,
  crop,
  index,
}: {
  image: CanvasImageSource;
  crop: CropCalculationResult;
  index: number;
}): HTMLCanvasElement => {
  const composedWidth = Math.max(1, Math.round(crop.cropWidth));
  const composedHeight = Math.max(1, Math.round(crop.cropHeight));
  const singleSliceWidth = Math.floor(composedWidth / PART_COUNT);
  const sliceStartX = singleSliceWidth * index;
  const sliceWidth =
    index === PART_COUNT - 1 ? composedWidth - sliceStartX : singleSliceWidth;

  // Map the slice columns back to source-crop space proportionally.
  const sourceSliceX =
    crop.cropX + (sliceStartX / composedWidth) * crop.cropWidth;
  const sourceSliceWidth = (sliceWidth / composedWidth) * crop.cropWidth;

  const canvas = document.createElement("canvas");
  canvas.width = sliceWidth;
  canvas.height = composedHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to prepare image split canvas context");
  }

  context.drawImage(
    image,
    sourceSliceX,
    crop.cropY,
    sourceSliceWidth,
    crop.cropHeight,
    0,
    0,
    sliceWidth,
    composedHeight,
  );

  return canvas;
};

export interface SplitImageOptions {
  previewUrl: string;
  sourceFile: File;
  /** Source metadata; required to apply pre-split crop/transform baking. */
  metadata?: { width: number; height: number } | null;
  /** Display proportion used to compute the pre-split crop. */
  proportion?: ImageDisplayProportion | null;
  /** Rotation/flip applied to the single image before splitting. */
  previewTransform?: PreviewTransform | null;
  /** Zoom/pan crop applied to the single image before splitting. */
  previewCropAdjust?: { zoom: number; panX: number; panY: number } | null;
}

export const splitImageIntoVerticalThirdFiles = async ({
  previewUrl,
  sourceFile,
  metadata,
  proportion,
  previewTransform,
  previewCropAdjust,
}: SplitImageOptions): Promise<[File, File, File]> => {
  const image = await loadImageElement(previewUrl);
  const { sourceWidth, sourceHeight } = resolveImageDimensions(image);

  if (sourceWidth <= 0 || sourceHeight <= 0) {
    throw new Error("Cannot split image with invalid dimensions");
  }

  const outputMimeType = resolveOutputMimeType(sourceFile.type);
  const outputExtension = inferExtension(outputMimeType);
  const baseFilename = stripExtension(sourceFile.name);

  const hasTransformOrCrop =
    !!metadata &&
    !!proportion &&
    (!isIdentityPreviewTransform(previewTransform) ||
      !!(previewCropAdjust && previewCropAdjust.zoom > 1));

  // Fast path: only zoom/pan crop (no rotation, no flip). Slice each third
  // directly from the source crop region, avoiding a full-resolution
  // intermediate compose canvas. Rotation/flip still go through the compose
  // path below.
  const hasFlip =
    !!previewTransform &&
    (previewTransform.flipHorizontal || previewTransform.flipVertical);
  const canSliceCropDirectly =
    hasTransformOrCrop &&
    !!metadata &&
    !!proportion &&
    !hasFlip &&
    normalizeRotation(previewTransform?.rotation) === 0;

  if (canSliceCropDirectly && metadata && proportion) {
    const { crop } = resolveComposedCrop({
      metadata,
      proportion,
      previewTransform,
      previewCropAdjust,
    });

    const splitFiles = await Promise.all(
      Array.from({ length: PART_COUNT }, async (_, index) => {
        const canvas = drawDirectCropSliceToCanvas({ image, crop, index });
        const blob = await canvasToBlob(canvas, outputMimeType);
        return new File(
          [blob],
          `${baseFilename}-part-${index + 1}.${outputExtension}`,
          {
            type: outputMimeType,
            lastModified: Date.now(),
          },
        );
      }),
    );

    return splitFiles as [File, File, File];
  }

  if (hasTransformOrCrop && metadata && proportion) {
    const composed = composeSourceDrawable({
      image,
      metadata,
      proportion,
      previewTransform,
      previewCropAdjust,
    });

    return sliceDrawableIntoFiles({
      drawable: composed.drawable,
      drawableWidth: composed.width,
      drawableHeight: composed.height,
      baseFilename,
      outputMimeType,
      outputExtension,
    });
  }

  // No transform/crop: slice the raw image unchanged.
  return sliceDrawableIntoFiles({
    drawable: image,
    drawableWidth: sourceWidth,
    drawableHeight: sourceHeight,
    baseFilename,
    outputMimeType,
    outputExtension,
  });
};
