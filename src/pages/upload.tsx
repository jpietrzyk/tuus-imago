import { useEffect, useState } from "react";
import { type UploadResult } from "@/components/cloudinary-upload-widget";
import { CustomImageUploader } from "@/components/custom-image-uploader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  cloudinaryConfig,
  getCloudinaryUploadConfigError,
} from "@/lib/cloudinary";
import { CheckCircle2, AlertCircle, Sliders } from "lucide-react";
import { t } from "@/locales/i18n";
import {
  type ImageTransformations,
  type AiAdjustments,
  getTransformedPreviewUrl,
  DEFAULT_AI_ADJUSTMENTS,
  AI_ADJUSTMENT_OPTIONS,
} from "@/lib/image-transformations";

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
  const [previewLoadProgress, setPreviewLoadProgress] = useState(0);
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
    setIsPreviewLoading(true);
    setPreviewLoadProgress(0);
    setPreviewError(null);
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

  const activeAiTools = AI_ADJUSTMENT_OPTIONS.filter(
    (option) => aiAdjustments[option.key],
  );

  const toggleAiAdjustment = (adjustment: keyof AiAdjustments) => {
    setPreviewError(null);
    if (useAiPreview) {
      setIsPreviewLoading(true);
      setPreviewLoadProgress(0);
    }

    setAiAdjustments((prev) => ({
      ...prev,
      [adjustment]: !prev[adjustment],
    }));
  };

  useEffect(() => {
    if (!isPreviewLoading) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setPreviewLoadProgress((previous) => Math.min(previous + 5, 90));
    }, 120);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isPreviewLoading, transformedPreviewUrl]);

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
                <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                  <img
                    key={transformedPreviewUrl || uploadedImage.info.secure_url}
                    src={transformedPreviewUrl || uploadedImage.info.secure_url}
                    alt="Uploaded photo"
                    className="w-full h-auto"
                    onLoad={() => {
                      setPreviewLoadProgress(100);
                      setIsPreviewLoading(false);
                    }}
                    onError={() => {
                      setIsPreviewLoading(false);
                      setPreviewLoadProgress(0);
                      if (useAiPreview) {
                        setPreviewError(t("upload.aiPreviewError"));
                      }
                    }}
                  />
                  {isPreviewLoading && (
                    <div className="p-3 space-y-2">
                      <p className="text-xs text-gray-500 text-center">
                        {t("upload.loadingPreviewProgress", {
                          percent: previewLoadProgress,
                        })}
                      </p>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-[width] duration-150 ease-out"
                          style={{ width: `${previewLoadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {previewError && useAiPreview && (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-800 rounded-lg border border-amber-200 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{previewError}</span>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-200 space-y-4">
                  <div className="w-full px-4 py-3 border rounded-lg bg-muted/30 transition-colors flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-medium text-gray-900">
                      <Sliders className="h-4 w-4" />
                      {t("upload.aiAdjustmentsTitle")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {useAiPreview
                        ? t("upload.previewAiActive", {
                            count: activeAiAdjustmentsCount,
                          })
                        : t("upload.previewOriginalActive")}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {t("upload.aiAdjustmentsHint")}
                  </p>

                  {aiTemplateName && (
                    <p className="text-xs text-muted-foreground">
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
                          className="min-w-36"
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
                      onClick={() => {
                        setUseAiPreview(true);
                        setIsPreviewLoading(true);
                        setPreviewLoadProgress(0);
                        setPreviewError(null);
                      }}
                    >
                      {t("upload.previewAi")}
                    </Button>
                    <Button
                      variant={!useAiPreview ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setUseAiPreview(false);
                        setIsPreviewLoading(true);
                        setPreviewLoadProgress(0);
                        setPreviewError(null);
                      }}
                    >
                      {t("upload.previewOriginal")}
                    </Button>
                  </div>

                  <div className="pt-2 border-t border-gray-200 space-y-2">
                    <p className="text-xs font-semibold text-gray-900">
                      {t("upload.usedCloudinaryTools")}
                    </p>
                    {activeAiTools.length > 0 || aiTemplateName ? (
                      <div className="flex flex-wrap gap-2">
                        {activeAiTools.map((option) => (
                          <span
                            key={option.key}
                            className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
                          >
                            {t(option.labelKey)}
                          </span>
                        ))}
                        {aiTemplateName && (
                          <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                            {t("upload.aiTemplateLabel")} {aiTemplateName}
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {t("upload.noCloudinaryTools")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
