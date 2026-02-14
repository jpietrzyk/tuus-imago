import { useState } from "react";
import { type UploadResult } from "@/components/cloudinary-upload-widget";
import { CustomImageUploader } from "@/components/custom-image-uploader";
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

export function UploadPage() {
  const [uploadedImage, setUploadedImage] = useState<UploadResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [transformations, setTransformations] =
    useState<ImageTransformations | null>(null);
  const cloudinaryConfigError = getCloudinaryUploadConfigError();
  const showDebugPanel = import.meta.env.VITE_SHOW_DEBUG_PANEL === "true";

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
              resource_type: "image",
              created_at: new Date().toISOString(),
            },
          };
    setUploadedImage(uploadResult);
    setTransformations(transformationsParam);
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
              </div>
            )}

            {/* Upload Widget */}
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

            {/* Uploaded Image Preview */}
            {uploadedImage && (
              <div className="space-y-3 pt-4 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  {t("upload.uploadedPhoto")}
                </h3>
                <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                  <img
                    src={uploadedImage.info.secure_url}
                    alt="Uploaded photo"
                    className="w-full h-auto"
                  />
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
