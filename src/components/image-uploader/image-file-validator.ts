import { type ImageValidationRules } from "./image-validation-rules";
import { readJpegExifResolution } from "./jpeg-exif-reader";
import { loadImageDimensions } from "./load-image-dimensions";

export interface ImageValidationViolation {
  rule: string;
  messageKey: string;
  params: Record<string, string | number>;
}

async function extractDpi(file: File): Promise<number | null> {
  if (file.type === "image/webp") {
    return null;
  }

  if (file.type === "image/png") {
    return extractPngDpi(file);
  }

  const result = await readJpegExifResolution(file);
  if (!result) {
    return null;
  }

  const { xResolution, yResolution, resolutionUnit } = result;

  if (resolutionUnit === 2 || resolutionUnit === undefined) {
    return Math.min(xResolution, yResolution);
  }

  if (resolutionUnit === 1) {
    return Math.round(Math.min(xResolution, yResolution) * 2.54);
  }

  return Math.min(xResolution, yResolution);
}

async function readFileAsBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
}

async function extractPngDpi(file: File): Promise<number | null> {
  try {
    const buffer = await readFileAsBuffer(file);
    const view = new DataView(buffer);

    const sig0 = view.getUint32(0);
    const sig1 = view.getUint32(4);
    if (sig0 !== 0x89504e47 || sig1 !== 0x0d0a1a0a) {
      return null;
    }

    let offset = 8;
    while (offset < buffer.byteLength - 12) {
      const length = view.getUint32(offset);
      const type =
        String.fromCharCode(view.getUint8(offset + 4)) +
        String.fromCharCode(view.getUint8(offset + 5)) +
        String.fromCharCode(view.getUint8(offset + 6)) +
        String.fromCharCode(view.getUint8(offset + 7));

      if (type === "pHYs") {
        const pixelsPerUnitX = view.getUint32(offset + 8);
        const pixelsPerUnitY = view.getUint32(offset + 12);
        const unit = view.getUint8(offset + 16);

        if (unit === 1) {
          const dpiX = Math.round(pixelsPerUnitX * 0.0254);
          const dpiY = Math.round(pixelsPerUnitY * 0.0254);
          return Math.min(dpiX, dpiY);
        }

        return null;
      }

      if (type === "IDAT") {
        break;
      }

      offset += 12 + length;
    }

    return null;
  } catch {
    return null;
  }
}

export async function validateImageFile(
  file: File,
  rules: ImageValidationRules,
): Promise<ImageValidationViolation[]> {
  const violations: ImageValidationViolation[] = [];

  if (!rules.acceptedMimeTypes.includes(file.type as typeof rules.acceptedMimeTypes[number])) {
    violations.push({
      rule: "invalidType",
      messageKey: "upload.validation.invalidType",
      params: {},
    });
    return violations;
  }

  if (file.size > rules.maxFileSizeBytes) {
    violations.push({
      rule: "maxFileSize",
      messageKey: "upload.validation.maxFileSize",
      params: { maxSizeMB: rules.maxFileSizeBytes / (1024 * 1024) },
    });
    return violations;
  }

  let dimensions: { width: number; height: number };
  try {
    dimensions = await loadImageDimensions(file);
  } catch {
    violations.push({
      rule: "invalidImage",
      messageKey: "upload.validation.invalidImage",
      params: {},
    });
    return violations;
  }

  if (dimensions.width < rules.minWidth) {
    violations.push({
      rule: "minWidth",
      messageKey: "upload.validation.minWidth",
      params: { minWidth: rules.minWidth, actualWidth: dimensions.width },
    });
  }

  if (dimensions.height < rules.minHeight) {
    violations.push({
      rule: "minHeight",
      messageKey: "upload.validation.minHeight",
      params: { minHeight: rules.minHeight, actualHeight: dimensions.height },
    });
  }

  if (violations.length > 0) {
    return violations;
  }

  const dpi = await extractDpi(file);
  if (dpi !== null && dpi < rules.minDpi) {
    violations.push({
      rule: "minDpi",
      messageKey: "upload.validation.minDpi",
      params: { minDpi: rules.minDpi, actualDpi: dpi },
    });
  }

  return violations;
}

export { extractPngDpi };
