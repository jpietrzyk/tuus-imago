import type { CropCalculationResult } from "./image-proportion-calculator";

interface ImageDimensions {
  sourceWidth: number;
  sourceHeight: number;
}

export const loadImageElement = (
  previewUrl: string,
): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load image preview"));
    image.src = previewUrl;
  });
};

export const resolveImageDimensions = (image: HTMLImageElement): ImageDimensions => {
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;

  return {
    sourceWidth,
    sourceHeight,
  };
};

export const drawCroppedImageToCanvas = ({
  canvas,
  image,
  crop,
  effects,
}: {
  canvas: HTMLCanvasElement;
  image: HTMLImageElement;
  crop: CropCalculationResult;
  effects?: { brightness: number; contrast: number } | null;
}): boolean => {
  const context = canvas.getContext("2d");
  if (!context) {
    return false;
  }

  const rect = canvas.getBoundingClientRect();
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  // Ignore transient tiny measurements that can happen during initial layout/animation.
  // In those cases, use crop output size for the internal canvas buffer.
  const hasMeasuredCanvasSize = rect.width >= 32 && rect.height >= 32;
  const displayWidth = hasMeasuredCanvasSize
    ? Math.max(1, Math.round(rect.width))
    : crop.outputWidth;
  const displayHeight = hasMeasuredCanvasSize
    ? Math.max(1, Math.round(rect.height))
    : crop.outputHeight;

  canvas.width = Math.round(displayWidth * dpr);
  canvas.height = Math.round(displayHeight * dpr);

  if (
    typeof HTMLImageElement !== "undefined" &&
    !(image instanceof HTMLImageElement)
  ) {
    return false;
  }

  const dstW = canvas.width;
  const dstH = canvas.height;
  const cropAspectRatio = crop.outputWidth / crop.outputHeight;
  const canvasAspectRatio = dstW / dstH;

  let drawWidth = dstW;
  let drawHeight = dstH;

  // Preserve crop proportions inside the measured canvas box to avoid
  // stretching when layout briefly reports a mismatched aspect ratio.
  if (canvasAspectRatio > cropAspectRatio) {
    drawWidth = Math.round(dstH * cropAspectRatio);
  } else if (canvasAspectRatio < cropAspectRatio) {
    drawHeight = Math.round(dstW / cropAspectRatio);
  }

  const drawX = Math.floor((dstW - drawWidth) / 2);
  const drawY = Math.floor((dstH - drawHeight) / 2);

  // Apply preview effects via canvas filter if present
  if (effects && (effects.brightness !== 0 || effects.contrast !== 0)) {
    // Convert slider values (-100 to 100) to filter values (0 to 2)
    const brightnessFactor = 1 + effects.brightness / 100;
    const contrastFactor = 1 + effects.contrast / 100;

    // Clamp values to reasonable ranges
    const clampedBrightness = Math.max(0, Math.min(2, brightnessFactor));
    const clampedContrast = Math.max(0, Math.min(2, contrastFactor));

    context.filter = `brightness(${clampedBrightness}) contrast(${clampedContrast})`;
  }

  context.clearRect(0, 0, dstW, dstH);
  context.drawImage(
    image,
    crop.cropX,
    crop.cropY,
    crop.cropWidth,
    crop.cropHeight,
    drawX,
    drawY,
    drawWidth,
    drawHeight,
  );

  return true;
};
