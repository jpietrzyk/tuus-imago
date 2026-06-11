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
  cachedDimensions,
}: {
  canvas: HTMLCanvasElement;
  image: HTMLImageElement;
  crop: CropCalculationResult;
  effects?: { brightness: number; contrast: number } | null;
  /**
   * Optional cached display dimensions { w, h } to avoid calling
   * getBoundingClientRect() on every draw.  When provided, the canvas
   * buffer is only resized when these dimensions differ from the current
   * buffer size.
   */
  cachedDimensions?: { w: number; h: number } | null;
}): boolean => {
  const context = canvas.getContext("2d");
  if (!context) {
    return false;
  }

  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

  let displayWidth: number;
  let displayHeight: number;

  if (cachedDimensions) {
    displayWidth = cachedDimensions.w;
    displayHeight = cachedDimensions.h;
  } else {
    const rect = canvas.getBoundingClientRect();
    const hasMeasuredCanvasSize = rect.width >= 32 && rect.height >= 32;
    displayWidth = hasMeasuredCanvasSize
      ? Math.max(1, Math.round(rect.width))
      : crop.outputWidth;
    displayHeight = hasMeasuredCanvasSize
      ? Math.max(1, Math.round(rect.height))
      : crop.outputHeight;
  }

  const bufferWidth = Math.round(displayWidth * dpr);
  const bufferHeight = Math.round(displayHeight * dpr);

  // Only resize the canvas buffer when dimensions actually changed.
  // Setting canvas.width/height clears the buffer and resets context
  // state, which is expensive and causes flicker during zoom/pan.
  if (canvas.width !== bufferWidth || canvas.height !== bufferHeight) {
    canvas.width = bufferWidth;
    canvas.height = bufferHeight;
  }

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

  // Reset filter to a known state before each draw so stale effects from a
  // previous render don't persist (e.g. after "Reset Effects" is pressed).
  context.filter = "none";

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
