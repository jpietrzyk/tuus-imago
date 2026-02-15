import { useEffect, useState } from "react";
import { type UploadResult } from "@/components/cloudinary-upload-widget";
import { CustomImageUploader } from "@/components/custom-image-uploader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  cloudinaryConfig,
  getCloudinaryUploadConfigError,
} from "@/lib/cloudinary";
import {
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Sliders,
} from "lucide-react";
import { t } from "@/locales/i18n";

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

const DEFAULT_AI_ADJUSTMENTS: AiAdjustments = {
  enhance: true,
  removeBackground: false,
  upscale: false,
  restore: false,
};

const AI_ADJUSTMENT_OPTIONS: Array<{
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

  if (!trans && !hasAiAdjustments) {
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

export function UploadPage() {
  const [uploadedImage, setUploadedImage] = useState<UploadResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [transformations, setTransformations] =
    useState<ImageTransformations | null>(null);
  const [aiAdjustments, setAiAdjustments] = useState<AiAdjustments>(
    DEFAULT_AI_ADJUSTMENTS,
  );
  const [useAiPreview, setUseAiPreview] = useState(true);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const cloudinaryConfigError = getCloudinaryUploadConfigError();
  const showDebugPanel = import.meta.env.VITE_SHOW_DEBUG_PANEL === "true";
  const aiTemplateName =
    (
      import.meta.env.VITE_CLOUDINARY_AI_TEMPLATE as string | undefined
    )?.trim() || undefined;

  const handleUploadSuccess = (
    result:
      | UploadResult
      | {
          public_id: string;
          secure_url: string;
          width: number;
          height: number;
          bytes: number;
          format: string;
          url: string;
          custom_coordinates?: string;
          context?: string;
        },
    transformationsParam: ImageTransformations,
  ) => {
    // Handle both formats (from CloudinaryUploadWidget and CustomImageUploader)
    const uploadResult: UploadResult =
      "event" in result
        ? result
        : {
            event: "success",
            info: {
              public_id: result.public_id,
              secure_url: result.secure_url,
              url: result.url,
              bytes: result.bytes,
              width: result.width,
              height: result.height,
              format: result.format,
              custom_coordinates: result.custom_coordinates,
              context: result.context,
              resource_type: "image",
              created_at: new Date().toISOString(),
            },
          };
    setUploadedImage(uploadResult);
    setTransformations(transformationsParam);
    setAiAdjustments(DEFAULT_AI_ADJUSTMENTS);
    setUseAiPreview(true);
    setUploadError(null);
    setIsSuccess(true);
    // Auto-hide success message after 3 seconds
    setTimeout(() => setIsSuccess(false), 3000);
  };

  const handleUploadError = (error: string) => {
    setUploadError(error);
    setUploadedImage(null);
    setIsSuccess(false);
    // Auto-hide error message after 5 seconds
    setTimeout(() => setUploadError(null), 5000);
  };

  const basePreviewUrl = uploadedImage
    ? getTransformedPreviewUrl(
        uploadedImage.info.secure_url,
        transformations,
        typeof uploadedImage.info.custom_coordinates === "string"
          ? uploadedImage.info.custom_coordinates
          : undefined,
      )
    : null;

  const aiPreviewUrl = uploadedImage
    ? getTransformedPreviewUrl(
        uploadedImage.info.secure_url,
        transformations,
        typeof uploadedImage.info.custom_coordinates === "string"
          ? uploadedImage.info.custom_coordinates
          : undefined,
        aiAdjustments,
        aiTemplateName,
      )
    : null;

  const transformedPreviewUrl = useAiPreview
    ? aiPreviewUrl || basePreviewUrl
    : basePreviewUrl;

  const activeAiAdjustmentsCount =
    Object.values(aiAdjustments).filter(Boolean).length;

  const toggleAiAdjustment = (adjustment: keyof AiAdjustments) => {
    setAiAdjustments((prev) => ({
      ...prev,
      [adjustment]: !prev[adjustment],
    }));
  };

  useEffect(() => {
    if (!uploadedImage || !transformedPreviewUrl) {
      return;
    }

    setIsPreviewLoading(true);
    setPreviewError(null);
  }, [uploadedImage, transformedPreviewUrl]);

  useEffect(() => {
    if (!useAiPreview) {
      setPreviewError(null);
    }
  }, [useAiPreview]);

  return (
    <div className="flex-1 h-full flex justify-center p-4 py-8 transition-all duration-500 ease-in-out">
      <div className="w-full max-w-2xl transition-all duration-500 ease-in-out">
        <Card className="bg-black/10 backdrop-blur-md shadow-2xl">
          <CardContent className="space-y-6">
            {/* Status Messages */}
            {isSuccess && (
              <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg border border-green-200">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">{t("upload.success")}</span>
              </div>
            )}

            {uploadError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">{uploadError}</span>
              </div>
            )}

            {showDebugPanel && (
              <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 text-sm space-y-1">
                <p className="font-semibold">Cloudinary debug</p>
                <p>Cloud name: {cloudinaryConfig.cloudName || "(missing)"}</p>
                <p>
                  Upload preset: {cloudinaryConfig.uploadPreset || "(missing)"}
                </p>
                <p>Config status: {cloudinaryConfigError ?? "OK"}</p>
                {uploadedImage && (
                  <>
                    <p>Preview mode: {useAiPreview ? "AI" : "Original"}</p>
                    <p className="break-all">
                      Preview URL: {transformedPreviewUrl || "(missing)"}
                    </p>
                    {transformedPreviewUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          window.open(
                            transformedPreviewUrl,
                            "_blank",
                            "noopener,noreferrer",
                          )
                        }
                      >
                        {t("upload.openPreviewUrl")}
                      </Button>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Upload Widget */}
            {!uploadedImage && (
              <div className="flex flex-col items-center gap-4">
                <CustomImageUploader
                  onUploadSuccess={handleUploadSuccess}
                  onUploadError={handleUploadError}
                  className="w-full max-w-sm py-6 text-lg font-semibold"
                />

                <p className="text-sm text-gray-500 text-center">
                  {t("upload.fileSupport")}
                </p>
              </div>
            )}

            {/* Uploaded Image Preview */}
            {uploadedImage && (
              <div className="space-y-3 pt-4 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  {t("upload.uploadedPhoto")}
                </h3>
                <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                  {isPreviewLoading && (
                    <p className="p-3 text-xs text-gray-500 text-center">
                      {t("upload.loadingPreview")}
                    </p>
                  )}
                  <img
                    key={transformedPreviewUrl || uploadedImage.info.secure_url}
                    src={transformedPreviewUrl || uploadedImage.info.secure_url}
                    alt="Uploaded photo"
                    className="w-full h-auto"
                    onLoad={() => setIsPreviewLoading(false)}
                    onError={() => {
                      setIsPreviewLoading(false);
                      if (useAiPreview) {
                        setPreviewError(t("upload.aiPreviewError"));
                      }
                    }}
                  />
                </div>
                {previewError && (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-800 rounded-lg border border-amber-200 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{previewError}</span>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-200 space-y-3">
                  <h4 className="text-sm font-semibold text-gray-900">
                    {t("upload.aiAdjustmentsTitle")}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {t("upload.aiAdjustmentsHint")}
                  </p>
                  {aiTemplateName && (
                    <p className="text-xs text-gray-500">
                      {t("upload.aiTemplateLabel")} {aiTemplateName}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {AI_ADJUSTMENT_OPTIONS.map((option) => {
                      const isActive = aiAdjustments[option.key];

                      return (
                        <Button
                          key={option.key}
                          variant={isActive ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleAiAdjustment(option.key)}
                        >
                          {t(option.labelKey)}
                        </Button>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={useAiPreview ? "default" : "outline"}
                      size="sm"
                      onClick={() => setUseAiPreview(true)}
                    >
                      {t("upload.previewAi")}
                    </Button>
                    <Button
                      variant={!useAiPreview ? "default" : "outline"}
                      size="sm"
                      onClick={() => setUseAiPreview(false)}
                    >
                      {t("upload.previewOriginal")}
                    </Button>
                  </div>

                  <p className="text-xs text-gray-500">
                    {useAiPreview
                      ? t("upload.previewAiActive", {
                          count: activeAiAdjustmentsCount,
                        })
                      : t("upload.previewOriginalActive")}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 bg-gray-50 rounded">
                    <span className="font-medium text-gray-700">
                      {t("upload.dimensions")}
                    </span>
                    <span className="ml-2 text-gray-600">
                      {uploadedImage.info.width} × {uploadedImage.info.height}
                      px
                    </span>
                  </div>
                  <div className="p-2 bg-gray-50 rounded">
                    <span className="font-medium text-gray-700">
                      {t("upload.size")}
                    </span>
                    <span className="ml-2 text-gray-600">
                      {(uploadedImage.info.bytes / 1024).toFixed(2)} KB
                    </span>
                  </div>
                </div>

                {/* Applied Transformations */}
                {transformations && (
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3">
                      <Sliders className="h-4 w-4" />
                      {t("upload.appliedAdjustments")}
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {(transformations.rotation !== 0 ||
                        transformations.flipHorizontal ||
                        transformations.flipVertical ||
                        transformations.brightness !== 0 ||
                        transformations.contrast !== 0 ||
                        transformations.grayscale !== 0 ||
                        transformations.blur !== 0) && (
                        <>
                          {transformations.rotation !== 0 && (
                            <div className="p-2 bg-blue-50 rounded">
                              <span className="font-medium text-gray-700">
                                {t("upload.rotation")}
                              </span>
                              <span className="ml-2 text-gray-600">
                                {transformations.rotation}°
                              </span>
                            </div>
                          )}
                          {transformations.flipHorizontal && (
                            <div className="p-2 bg-blue-50 rounded">
                              <span className="font-medium text-gray-700">
                                {t("upload.flipHorizontal")}
                              </span>
                            </div>
                          )}
                          {transformations.flipVertical && (
                            <div className="p-2 bg-blue-50 rounded">
                              <span className="font-medium text-gray-700">
                                {t("upload.flipVertical")}
                              </span>
                            </div>
                          )}
                          {transformations.brightness !== 0 && (
                            <div className="p-2 bg-amber-50 rounded">
                              <span className="font-medium text-gray-700">
                                {t("upload.brightness")}
                              </span>
                              <span className="ml-2 text-gray-600">
                                {transformations.brightness > 0 ? "+" : ""}
                                {transformations.brightness}%
                              </span>
                            </div>
                          )}
                          {transformations.contrast !== 0 && (
                            <div className="p-2 bg-amber-50 rounded">
                              <span className="font-medium text-gray-700">
                                {t("upload.contrast")}
                              </span>
                              <span className="ml-2 text-gray-600">
                                {transformations.contrast > 0 ? "+" : ""}
                                {transformations.contrast}%
                              </span>
                            </div>
                          )}
                          {transformations.grayscale !== 0 && (
                            <div className="p-2 bg-purple-50 rounded">
                              <span className="font-medium text-gray-700">
                                {t("upload.grayscale")}
                              </span>
                              <span className="ml-2 text-gray-600">
                                {transformations.grayscale}%
                              </span>
                            </div>
                          )}
                          {transformations.blur !== 0 && (
                            <div className="p-2 bg-purple-50 rounded">
                              <span className="font-medium text-gray-700">
                                {t("upload.blur")}
                              </span>
                              <span className="ml-2 text-gray-600">
                                {transformations.blur}px
                              </span>
                            </div>
                          )}
                        </>
                      )}
                      {transformations.rotation === 0 &&
                        !transformations.flipHorizontal &&
                        !transformations.flipVertical &&
                        transformations.brightness === 0 &&
                        transformations.contrast === 0 &&
                        transformations.grayscale === 0 &&
                        transformations.blur === 0 && (
                          <div className="col-span-2 p-2 bg-gray-50 rounded text-center text-gray-500">
                            {t("upload.noAdjustments")}
                          </div>
                        )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
