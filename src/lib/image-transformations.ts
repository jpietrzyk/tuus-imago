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

export function getTransformedPreviewUrl(
  secureUrl: string,
  trans: ImageTransformations | null,
  customCoordinates?: string,
  aiAdjustments?: AiAdjustments | null,
  aiTemplate?: string,
): string {
  const hasAiAdjustments = hasActiveAiAdjustments(aiAdjustments || null);
  const hasCropCoordinates = !!customCoordinates?.trim();

  if (!trans && !hasAiAdjustments && !hasCropCoordinates) {
    return secureUrl;
  }

  const transformationParts: string[] = [];

  if (customCoordinates) {
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

  const urlParts = secureUrl.split("/upload/");
  if (urlParts.length !== 2) {
    return secureUrl;
  }

  return `${urlParts[0]}/upload/${transformationParts.join("/")}/${urlParts[1]}`;
}
