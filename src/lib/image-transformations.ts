export interface ImageTransformations {
  rotation: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
  brightness: number;
  contrast: number;
  grayscale: number;
  blur: number;
}

export interface AiAdjustments {
  enhance: boolean;
  removeBackground: boolean;
  upscale: boolean;
  restore: boolean;
}

export const DEFAULT_AI_ADJUSTMENTS: AiAdjustments = {
  enhance: true,
  removeBackground: false,
  upscale: false,
  restore: false,
};

export const AI_ADJUSTMENT_OPTIONS: Array<{
  key: keyof AiAdjustments;
  transformation: string;
  labelKey: string;
}> = [
  {
    key: "enhance",
    transformation: "e_enhance",
    labelKey: "upload.aiEnhance",
  },
  {
    key: "removeBackground",
    transformation: "e_background_removal",
    labelKey: "upload.aiRemoveBackground",
  },
  {
    key: "upscale",
    transformation: "e_upscale",
    labelKey: "upload.aiUpscale",
  },
  {
    key: "restore",
    transformation: "e_gen_restore",
    labelKey: "upload.aiRestore",
  },
];

function hasActiveAiAdjustments(aiAdjustments: AiAdjustments | null): boolean {
  return aiAdjustments ? Object.values(aiAdjustments).some(Boolean) : false;
}

/**
 * Inserts Cloudinary transformation parts into a URL.
 * If the URL already contains transformations (between /upload/ and the
 * version/public_id), the new parts are appended AFTER the existing ones.
 * This ensures correct ordering — e.g. AI effects run on the full image
 * first, then thumbnail cropping is applied last.
 */
function applyCloudinaryTransformations(
  url: string,
  transformationParts: string[],
): string {
  if (transformationParts.length === 0) {
    return url;
  }

  const uploadMarker = "/upload/";
  const uploadIndex = url.indexOf(uploadMarker);
  if (uploadIndex === -1) {
    return url;
  }

  const prefix = url.substring(0, uploadIndex + uploadMarker.length);
  const suffix = url.substring(uploadIndex + uploadMarker.length);

  // Find the start of the version/public_id by locating the first segment
  // that is a version (v123...) or contains a file extension.
  // Everything before that point is existing transformations.
  const segments = suffix.split("/");
  let insertIndex = 0;
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    // Version segment: v followed by digits
    if (/^v\d+/.test(seg)) {
      insertIndex = i;
      break;
    }
    // Public ID segment: contains a dot (file extension)
    if (seg.includes(".")) {
      insertIndex = i;
      break;
    }
    // Otherwise it's an existing transformation — continue
    insertIndex = i + 1;
  }

  const newParts = transformationParts.join("/");
  const before = segments.slice(0, insertIndex).join("/");
  const after = segments.slice(insertIndex).join("/");

  if (before) {
    return `${prefix}${before}/${newParts}/${after}`;
  }
  return `${prefix}${newParts}/${after}`;
}

export function getCloudinaryThumbnailUrl(
  url: string,
  width: number,
  height: number,
): string {
  return applyCloudinaryTransformations(url, [
    `c_fill,g_auto,h_${height},w_${width}`,
    "f_auto",
    "q_auto",
  ]);
}

export function getTransformedPreviewUrl(
  secureUrl: string,
  trans: ImageTransformations | null,
  customCoordinates?: string,
  aiAdjustments?: AiAdjustments | null,
  aiTemplate?: string,
  autoCrop?: boolean,
): string {
  const hasAiAdjustments = hasActiveAiAdjustments(aiAdjustments || null);
  const hasCropCoordinates = !!customCoordinates?.trim();
  const hasAutoCrop = autoCrop === true;

  if (!trans && !hasAiAdjustments && !hasCropCoordinates && !hasAutoCrop) {
    return secureUrl;
  }

  const transformationParts: string[] = [];

  if (hasAutoCrop) {
    transformationParts.push("c_fill,g_auto,ar_1:1");
  }

  if (customCoordinates && !hasAutoCrop) {
    const [x, y, width, height] = customCoordinates
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);

    if (x && y && width && height) {
      transformationParts.push(`c_crop,x_${x},y_${y},w_${width},h_${height}`);
    }
  }

  if (trans) {
    if (trans.rotation !== 0) {
      transformationParts.push(`a_${trans.rotation}`);
    }

    if (trans.flipHorizontal) {
      transformationParts.push("a_hflip");
    }

    if (trans.flipVertical) {
      transformationParts.push("a_vflip");
    }

    if (trans.brightness !== 0) {
      transformationParts.push(`e_brightness:${trans.brightness}`);
    }

    if (trans.contrast !== 0) {
      transformationParts.push(`e_contrast:${trans.contrast}`);
    }

    if (trans.grayscale !== 0) {
      transformationParts.push(`e_grayscale:${trans.grayscale}`);
    }

    if (trans.blur !== 0) {
      transformationParts.push(`e_blur:${trans.blur}`);
    }
  }

  if (hasAiAdjustments && aiAdjustments) {
    if (aiTemplate) {
      transformationParts.push(`t_${aiTemplate}`);
    }

    AI_ADJUSTMENT_OPTIONS.forEach((option) => {
      if (aiAdjustments[option.key]) {
        transformationParts.push(option.transformation);
      }
    });
  }

  if (transformationParts.length === 0) {
    return secureUrl;
  }

  return applyCloudinaryTransformations(secureUrl, transformationParts);
}
