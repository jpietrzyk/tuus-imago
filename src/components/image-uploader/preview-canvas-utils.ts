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
}: {
  canvas: HTMLCanvasElement;
  image: HTMLImageElement;
  crop: CropCalculationResult;
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

  context.clearRect(0, 0, dstW, dstH);
  context.drawImage(
    image,
    crop.cropX,
    crop.cropY,
    crop.cropWidth,
    crop.cropHeight,
    0,
    0,
    dstW,
    dstH,
  );

  return true;
};
