import { loadImageElement, resolveImageDimensions } from "./preview-canvas-utils";

const PART_COUNT = 3;

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
  image,
  sliceStartX,
  sliceWidth,
  sourceHeight,
}: {
  image: HTMLImageElement;
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
    image,
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

export const splitImageIntoVerticalThirdFiles = async ({
  previewUrl,
  sourceFile,
}: {
  previewUrl: string;
  sourceFile: File;
}): Promise<[File, File, File]> => {
  const image = await loadImageElement(previewUrl);
  const { sourceWidth, sourceHeight } = resolveImageDimensions(image);

  if (sourceWidth <= 0 || sourceHeight <= 0) {
    throw new Error("Cannot split image with invalid dimensions");
  }

  const outputMimeType = resolveOutputMimeType(sourceFile.type);
  const outputExtension = inferExtension(outputMimeType);
  const baseFilename = stripExtension(sourceFile.name);
  const singleSliceWidth = Math.floor(sourceWidth / PART_COUNT);

  const splitFiles = await Promise.all(
    Array.from({ length: PART_COUNT }, async (_, index) => {
      const sliceStartX = singleSliceWidth * index;
      const sliceWidth =
        index === PART_COUNT - 1 ? sourceWidth - sliceStartX : singleSliceWidth;

      const canvas = drawSliceToCanvas({
        image,
        sliceStartX,
        sliceWidth,
        sourceHeight,
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
