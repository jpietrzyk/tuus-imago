import { useCallback, useEffect, useRef, useState } from "react";
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

interface PreviewCropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

const CROP_MOVE_STEP = 10;
const CROP_RESIZE_STEP = 10;
const MIN_CROP_SIZE = 50;

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
  const [previewLoadingReason, setPreviewLoadingReason] = useState<
    "preview" | "crop"
  >("preview");
  const [previewError, setPreviewError] = useState<string | null>(null);
  const cloudinaryConfigError = getCloudinaryUploadConfigError();
  const showDebugPanel = import.meta.env.VITE_SHOW_DEBUG_PANEL === "true";
  const aiTemplateName =
    (
      import.meta.env.VITE_CLOUDINARY_AI_TEMPLATE as string | undefined
    )?.trim() || undefined;
  const [cropMode, setCropMode] = useState<"manual" | "auto">("manual");
  const [previewCropArea, setPreviewCropArea] = useState<PreviewCropArea>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [previewDisplayDimensions, setPreviewDisplayDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [appliedManualCropCoordinates, setAppliedManualCropCoordinates] =
    useState<string | undefined>(undefined);
  const previewDragStateRef = useRef({
    isDragging: false,
    isResizing: false,
    resizeHandle: null as "nw" | "ne" | "se" | "sw" | null,
    startX: 0,
    startY: 0,
    containerRect: null as DOMRect | null,
  });
  const cropAreaRef = useRef<HTMLDivElement>(null);
  const srAnnouncementRef = useRef<HTMLDivElement>(null);

  const handlePreviewCropMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    previewDragStateRef.current = {
      isDragging: true,
      isResizing: false,
      resizeHandle: null,
      startX: x,
      startY: y,
      containerRect: rect,
    };
  }, []);

  const handlePreviewResizeMouseDown = useCallback(
    (handle: "nw" | "ne" | "se" | "sw") => {
      return (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const rect = (
          e.currentTarget.parentElement as HTMLElement
        ).getBoundingClientRect();

        previewDragStateRef.current = {
          isDragging: false,
          isResizing: true,
          resizeHandle: handle,
          startX: e.clientX - rect.left,
          startY: e.clientY - rect.top,
          containerRect: rect,
        };
      };
    },
    [],
  );

  const announceCropAreaChange = useCallback((area: PreviewCropArea) => {
    if (srAnnouncementRef.current) {
      const message = t("upload.cropAreaAnnouncement", {
        x: Math.round(area.x),
        y: Math.round(area.y),
        width: Math.round(area.width),
        height: Math.round(area.height),
      });
      srAnnouncementRef.current.textContent = message;
    }
  }, [t]);

  const constrainSquareCropArea = useCallback(
    (desiredWidth: number, desiredHeight: number, x: number, y: number) => {
      // Ensure dimensions don't exceed image bounds
      const maxWidth = previewDisplayDimensions.width - x;
      const maxHeight = previewDisplayDimensions.height - y;
      
      const constrainedWidth = Math.min(desiredWidth, maxWidth);
      const constrainedHeight = Math.min(desiredHeight, maxHeight);
      
      // Maintain square aspect ratio with the smaller dimension
      const finalDimension = Math.min(constrainedWidth, constrainedHeight);
      
      return {
        width: finalDimension,
        height: finalDimension,
      };
    },
    [previewDisplayDimensions],
  );

  const handleCropAreaKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (
        !uploadedImage ||
        !useAiPreview ||
        cropMode !== "manual" ||
        previewDisplayDimensions.width === 0 ||
        previewDisplayDimensions.height === 0
      ) {
        return;
      }

      const moveStep = e.shiftKey ? 0 : CROP_MOVE_STEP;
      const resizeStep = e.shiftKey ? CROP_RESIZE_STEP : 0;
      let handled = false;

      setPreviewCropArea((prev) => {
        let newArea = { ...prev };

        if (moveStep > 0) {
          // Move mode - arrow keys
          switch (e.key) {
            case "ArrowLeft":
              newArea.x = Math.max(0, prev.x - moveStep);
              handled = true;
              break;
            case "ArrowRight":
              newArea.x = Math.min(
                previewDisplayDimensions.width - prev.width,
                prev.x + moveStep,
              );
              handled = true;
              break;
            case "ArrowUp":
              newArea.y = Math.max(0, prev.y - moveStep);
              handled = true;
              break;
            case "ArrowDown":
              newArea.y = Math.min(
                previewDisplayDimensions.height - prev.height,
                prev.y + moveStep,
              );
              handled = true;
              break;
          }
        } else if (resizeStep > 0) {
          // Resize mode - shift+arrow keys
          let desiredWidth: number;
          let desiredHeight: number;

          switch (e.key) {
            case "ArrowLeft":
              desiredWidth = Math.max(MIN_CROP_SIZE, prev.width - resizeStep);
              desiredHeight = desiredWidth;
              const constrainedLeft = constrainSquareCropArea(
                desiredWidth,
                desiredHeight,
                prev.x,
                prev.y,
              );
              newArea.width = constrainedLeft.width;
              newArea.height = constrainedLeft.height;
              handled = true;
              break;
            case "ArrowRight":
              desiredWidth = prev.width + resizeStep;
              desiredHeight = desiredWidth;
              const constrainedRight = constrainSquareCropArea(
                desiredWidth,
                desiredHeight,
                prev.x,
                prev.y,
              );
              newArea.width = constrainedRight.width;
              newArea.height = constrainedRight.height;
              handled = true;
              break;
            case "ArrowUp":
              desiredHeight = Math.max(MIN_CROP_SIZE, prev.height - resizeStep);
              desiredWidth = desiredHeight;
              const constrainedUp = constrainSquareCropArea(
                desiredWidth,
                desiredHeight,
                prev.x,
                prev.y,
              );
              newArea.width = constrainedUp.width;
              newArea.height = constrainedUp.height;
              handled = true;
              break;
            case "ArrowDown":
              desiredHeight = prev.height + resizeStep;
              desiredWidth = desiredHeight;
              const constrainedDown = constrainSquareCropArea(
                desiredWidth,
                desiredHeight,
                prev.x,
                prev.y,
              );
              newArea.width = constrainedDown.width;
              newArea.height = constrainedDown.height;
              handled = true;
              break;
          }
        }

        if (handled) {
          announceCropAreaChange(newArea);
        }

        return newArea;
      });

      if (handled) {
        e.preventDefault();
      }
    },
    [
      uploadedImage,
      useAiPreview,
      cropMode,
      previewDisplayDimensions,
      announceCropAreaChange,
      constrainSquareCropArea,
    ],
  );

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
    setCropMode("manual");
    setPreviewCropArea({ x: 0, y: 0, width: 0, height: 0 });
    setPreviewDisplayDimensions({ width: 0, height: 0 });
    setAppliedManualCropCoordinates(undefined);
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

  const manualCustomCoordinates =
    uploadedImage &&
    previewDisplayDimensions.width > 0 &&
    previewDisplayDimensions.height > 0 &&
    previewCropArea.width > 0 &&
    previewCropArea.height > 0
      ? `${Math.round((previewCropArea.x / previewDisplayDimensions.width) * uploadedImage.info.width)},${Math.round((previewCropArea.y / previewDisplayDimensions.height) * uploadedImage.info.height)},${Math.round((previewCropArea.width / previewDisplayDimensions.width) * uploadedImage.info.width)},${Math.round((previewCropArea.height / previewDisplayDimensions.height) * uploadedImage.info.height)}`
      : undefined;

  const shouldUseAutoCrop = cropMode === "auto";

  const customCoordinatesForPreview = shouldUseAutoCrop
    ? undefined
    : (appliedManualCropCoordinates ??
      (typeof uploadedImage?.info.custom_coordinates === "string"
        ? uploadedImage.info.custom_coordinates
        : undefined));

  const basePreviewUrl = uploadedImage
    ? getTransformedPreviewUrl(
        uploadedImage.info.secure_url,
        transformations,
        customCoordinatesForPreview,
        undefined,
        undefined,
        shouldUseAutoCrop,
      )
    : null;

  const aiPreviewUrl = uploadedImage
    ? getTransformedPreviewUrl(
        uploadedImage.info.secure_url,
        transformations,
        customCoordinatesForPreview,
        aiAdjustments,
        aiTemplateName,
        shouldUseAutoCrop,
      )
    : null;

  const transformedPreviewUrl = useAiPreview
    ? aiPreviewUrl || basePreviewUrl
    : (uploadedImage?.info.secure_url ?? null);
  const isOriginalPreview = !useAiPreview;

  const activeAiAdjustmentsCount =
    Object.values(aiAdjustments).filter(Boolean).length;

  const startPreviewReload = useCallback((reason: "preview" | "crop") => {
    setPreviewLoadingReason(reason);
    setIsPreviewLoading(true);
    setPreviewLoadProgress(0);
    setPreviewError(null);
  }, []);

  const toggleAiAdjustment = (adjustment: keyof AiAdjustments) => {
    if (useAiPreview) {
      startPreviewReload("preview");
    }

    setAiAdjustments((prev) => ({
      ...prev,
      [adjustment]: !prev[adjustment],
    }));
  };

  useEffect(() => {
    if (
      !uploadedImage ||
      !useAiPreview ||
      cropMode !== "manual" ||
      previewDisplayDimensions.width === 0 ||
      previewDisplayDimensions.height === 0
    ) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const state = previewDragStateRef.current;

      if (!state.isDragging && !state.isResizing) return;

      const rect = state.containerRect;
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (state.isDragging) {
        const dx = x - state.startX;
        const dy = y - state.startY;

        setPreviewCropArea((prev) => {
          let newX = prev.x + dx;
          let newY = prev.y + dy;

          newX = Math.max(
            0,
            Math.min(newX, previewDisplayDimensions.width - prev.width),
          );
          newY = Math.max(
            0,
            Math.min(newY, previewDisplayDimensions.height - prev.height),
          );

          previewDragStateRef.current.startX = x;
          previewDragStateRef.current.startY = y;

          return { ...prev, x: newX, y: newY };
        });
      } else if (state.isResizing && state.resizeHandle) {
        const handle = state.resizeHandle;
        const dx = x - state.startX;
        const dy = y - state.startY;

        setPreviewCropArea((prev) => {
          let newX = prev.x;
          let newY = prev.y;
          let newWidth = prev.width;
          let newHeight = prev.height;
          let deltaSize = 0;

          switch (handle) {
            case "se":
              deltaSize = Math.max(dx, dy);
              newWidth = Math.max(50, prev.width + deltaSize);
              newHeight = newWidth;
              newWidth = Math.min(
                newWidth,
                previewDisplayDimensions.width - prev.x,
              );
              newHeight = Math.min(
                newHeight,
                previewDisplayDimensions.height - prev.y,
              );
              break;
            case "sw":
              deltaSize = Math.max(-dx, dy);
              newWidth = Math.max(50, prev.width + deltaSize);
              newHeight = newWidth;
              newX = prev.x - (newWidth - prev.width);
              if (newX < 0) {
                newWidth = prev.width + prev.x;
                newX = 0;
                newHeight = newWidth;
              }
              newHeight = Math.min(
                newHeight,
                previewDisplayDimensions.height - prev.y,
              );
              newWidth = newHeight;
              newX = prev.x - (newWidth - prev.width);
              break;
            case "ne":
              deltaSize = Math.max(dx, -dy);
              newWidth = Math.max(50, prev.width + deltaSize);
              newHeight = newWidth;
              newY = prev.y - (newHeight - prev.height);
              if (newY < 0) {
                newHeight = prev.height + prev.y;
                newY = 0;
                newWidth = newHeight;
              }
              newWidth = Math.min(
                newWidth,
                previewDisplayDimensions.width - prev.x,
              );
              newHeight = newWidth;
              newY = prev.y - (newHeight - prev.height);
              break;
            case "nw":
              deltaSize = Math.max(-dx, -dy);
              newWidth = Math.max(50, prev.width + deltaSize);
              newHeight = newWidth;
              newX = prev.x - (newWidth - prev.width);
              newY = prev.y - (newHeight - prev.height);
              if (newX < 0) {
                newWidth = prev.width + prev.x;
                newX = 0;
                newHeight = newWidth;
              }
              if (newY < 0) {
                newHeight = prev.height + prev.y;
                newY = 0;
                newWidth = newHeight;
                newX = prev.x - (newWidth - prev.width);
              }
              break;
          }

          previewDragStateRef.current.startX = x;
          previewDragStateRef.current.startY = y;

          return {
            ...prev,
            x: newX,
            y: newY,
            width: newWidth,
            height: newHeight,
          };
        });
      }
    };

    const handleMouseUp = () => {
      previewDragStateRef.current.isDragging = false;
      previewDragStateRef.current.isResizing = false;
      previewDragStateRef.current.resizeHandle = null;
      previewDragStateRef.current.containerRect = null;
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    uploadedImage,
    useAiPreview,
    cropMode,
    previewDisplayDimensions.width,
    previewDisplayDimensions.height,
  ]);

  useEffect(() => {
    if (!isPreviewLoading) {
      return;
    }

    const progressConfig =
      previewLoadingReason === "crop"
        ? { step: 8, intervalMs: 90, cap: 95 }
        : { step: 4, intervalMs: 130, cap: 90 };

    const intervalId = window.setInterval(() => {
      setPreviewLoadProgress((previous) =>
        Math.min(previous + progressConfig.step, progressConfig.cap),
      );
    }, progressConfig.intervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isPreviewLoading, previewLoadingReason]);

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
                  skipCropStep
                  className="w-full max-w-sm py-6 text-lg font-semibold"
                />

                <p className="text-sm text-gray-500 text-center">
                  {t("upload.fileSupport")}
                </p>
              </div>
            )}

            {/* Uploaded Image Preview */}
            {uploadedImage && (
              <div className="space-y-4 pt-4 rounded-lg bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-base font-semibold text-gray-900">
                    {t("upload.uploadedPhoto")}
                  </p>
                  {useAiPreview && (
                    <span className="text-[11px] text-muted-foreground text-right">
                      {t("upload.previewAiActive", {
                        count: activeAiAdjustmentsCount,
                      })}
                    </span>
                  )}
                </div>
                <div className="rounded-lg bg-muted/50 p-4">
                  <div
                    className="mb-3 inline-flex rounded-lg border border-gray-200 bg-white p-1"
                    role="tablist"
                    aria-label={t("upload.previewModeTitle")}
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={!isOriginalPreview}
                      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                        !isOriginalPreview
                          ? "bg-primary text-primary-foreground"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                      onClick={() => {
                        if (!isOriginalPreview) {
                          return;
                        }

                        setUseAiPreview(true);
                        startPreviewReload("preview");
                      }}
                    >
                      {t("upload.previewYourImage")}
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={isOriginalPreview}
                      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                        isOriginalPreview
                          ? "bg-primary text-primary-foreground"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                      onClick={() => {
                        if (isOriginalPreview) {
                          return;
                        }

                        setUseAiPreview(false);
                        setIsPreviewLoading(false);
                        setPreviewLoadProgress(0);
                        setPreviewError(null);
                      }}
                    >
                      {t("upload.previewOriginalTab")}
                    </button>
                  </div>

                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-muted-foreground">
                      {t("upload.cropModeTitle")}
                    </span>
                    <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
                      <button
                        type="button"
                        className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                          cropMode === "manual"
                            ? "bg-primary text-primary-foreground"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                        onClick={() => {
                          if (cropMode === "manual") {
                            return;
                          }

                          setCropMode("manual");
                          if (useAiPreview) {
                            startPreviewReload("crop");
                          }
                        }}
                      >
                        {t("upload.cropManual")}
                      </button>
                      <button
                        type="button"
                        className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                          cropMode === "auto"
                            ? "bg-primary text-primary-foreground"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                        onClick={() => {
                          if (cropMode === "auto") {
                            return;
                          }

                          setCropMode("auto");
                          if (useAiPreview) {
                            startPreviewReload("crop");
                          }
                        }}
                      >
                        {t("upload.cropAuto")}
                      </button>
                    </div>
                  </div>

                  {useAiPreview && cropMode === "manual" && (
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-xs text-muted-foreground">
                        {t("upload.cropHint")}
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        disabled={!manualCustomCoordinates}
                        onClick={() => {
                          if (!manualCustomCoordinates) {
                            return;
                          }

                          setAppliedManualCropCoordinates(
                            manualCustomCoordinates,
                          );
                          startPreviewReload("crop");
                        }}
                      >
                        {t("upload.applyCrop")}
                      </Button>
                    </div>
                  )}

                  {/* Hidden description for screen readers */}
                  <div className="sr-only" id="crop-area-description">
                    {t("upload.cropAreaDescription")}
                  </div>

                  {/* Live region for screen reader announcements */}
                  <div
                    ref={srAnnouncementRef}
                    className="sr-only"
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                  />

                  <div
                    className="relative rounded-lg overflow-hidden border border-gray-200 shadow-sm"
                    style={{
                      aspectRatio:
                        uploadedImage.info.width > 0 &&
                        uploadedImage.info.height > 0
                          ? `${uploadedImage.info.width} / ${uploadedImage.info.height}`
                          : "1 / 1",
                    }}
                  >
                    <img
                      key={
                        transformedPreviewUrl || uploadedImage.info.secure_url
                      }
                      src={
                        transformedPreviewUrl || uploadedImage.info.secure_url
                      }
                      alt="Uploaded photo"
                      className="absolute inset-0 w-full h-full object-contain"
                      draggable={false}
                      onLoad={(e) => {
                        if (useAiPreview && cropMode === "manual") {
                          const imageElement = e.currentTarget;
                          const container = imageElement.parentElement;

                          if (container) {
                            const containerWidth = container.clientWidth;
                            const containerHeight = container.clientHeight;
                            const naturalWidth = imageElement.naturalWidth;
                            const naturalHeight = imageElement.naturalHeight;

                            if (naturalWidth > 0 && naturalHeight > 0) {
                              const scale = Math.min(
                                containerWidth / naturalWidth,
                                containerHeight / naturalHeight,
                              );
                              const renderedWidth = naturalWidth * scale;
                              const renderedHeight = naturalHeight * scale;

                              const offsetX = (containerWidth - renderedWidth) / 2;
                              const offsetY = (containerHeight - renderedHeight) / 2;

                              setPreviewDisplayDimensions({
                                width: renderedWidth,
                                height: renderedHeight,
                              });

                              if (
                                previewCropArea.width === 0 ||
                                previewCropArea.height === 0
                              ) {
                                const minDim = Math.min(
                                  renderedWidth,
                                  renderedHeight,
                                );
                                const cropWidth = minDim * 0.8;
                                const cropHeight = minDim * 0.8;

                                setPreviewCropArea({
                                  x:
                                    offsetX +
                                    (renderedWidth - cropWidth) / 2,
                                  y:
                                    offsetY +
                                    (renderedHeight - cropHeight) / 2,
                                  width: cropWidth,
                                  height: cropHeight,
                                });
                              }
                            }
                          }
                        }

                        setPreviewLoadProgress(100);
                        setIsPreviewLoading(false);
                        setPreviewLoadingReason("preview");
                      }}
                      onError={() => {
                        setIsPreviewLoading(false);
                        setPreviewLoadProgress(0);
                        setPreviewLoadingReason("preview");
                        if (useAiPreview) {
                          setPreviewError(t("upload.aiPreviewError"));
                        }
                      }}
                    />

                    {useAiPreview &&
                      cropMode === "manual" &&
                      previewCropArea.width > 0 &&
                      previewCropArea.height > 0 &&
                      previewDisplayDimensions.width > 0 &&
                      previewDisplayDimensions.height > 0 && (
                        <>
                          <div
                            className="absolute pointer-events-none bg-black/40"
                            style={{
                              left: 0,
                              top: 0,
                              width: "100%",
                              height: previewCropArea.y,
                            }}
                          />
                          <div
                            className="absolute pointer-events-none bg-black/40"
                            style={{
                              left: 0,
                              top: previewCropArea.y + previewCropArea.height,
                              width: "100%",
                              height:
                                previewDisplayDimensions.height -
                                previewCropArea.y -
                                previewCropArea.height,
                            }}
                          />
                          <div
                            className="absolute pointer-events-none bg-black/40"
                            style={{
                              left: 0,
                              top: previewCropArea.y,
                              width: previewCropArea.x,
                              height: previewCropArea.height,
                            }}
                          />
                          <div
                            className="absolute pointer-events-none bg-black/40"
                            style={{
                              left: previewCropArea.x + previewCropArea.width,
                              top: previewCropArea.y,
                              width:
                                previewDisplayDimensions.width -
                                previewCropArea.x -
                                previewCropArea.width,
                              height: previewCropArea.height,
                            }}
                          />
                          <div
                            className="absolute border-2 border-white shadow-2xl pointer-events-none"
                            style={{
                              left: previewCropArea.x,
                              top: previewCropArea.y,
                              width: previewCropArea.width,
                              height: previewCropArea.height,
                            }}
                          />
                          <div
                            ref={cropAreaRef}
                            className="absolute"
                            style={{
                              left: previewCropArea.x,
                              top: previewCropArea.y,
                              width: previewCropArea.width,
                              height: previewCropArea.height,
                              cursor: "move",
                            }}
                            role="button"
                            tabIndex={0}
                            aria-label={t("upload.cropAreaLabel")}
                            aria-describedby="crop-area-description"
                            onMouseDown={handlePreviewCropMouseDown}
                            onKeyDown={handleCropAreaKeyDown}
                          />
                          <div
                            className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-nwse-resize -ml-2 -mt-2"
                            style={{
                              left: previewCropArea.x,
                              top: previewCropArea.y,
                            }}
                            aria-hidden="true"
                            onMouseDown={handlePreviewResizeMouseDown("nw")}
                          />
                          <div
                            className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-nesw-resize -mr-2 -mt-2"
                            style={{
                              left: previewCropArea.x + previewCropArea.width,
                              top: previewCropArea.y,
                            }}
                            aria-hidden="true"
                            onMouseDown={handlePreviewResizeMouseDown("ne")}
                          />
                          <div
                            className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-nwse-resize -mr-2 -mb-2"
                            style={{
                              left: previewCropArea.x + previewCropArea.width,
                              top: previewCropArea.y + previewCropArea.height,
                            }}
                            aria-hidden="true"
                            onMouseDown={handlePreviewResizeMouseDown("se")}
                          />
                          <div
                            className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-nesw-resize -ml-2 -mb-2"
                            style={{
                              left: previewCropArea.x,
                              top: previewCropArea.y + previewCropArea.height,
                            }}
                            aria-hidden="true"
                            onMouseDown={handlePreviewResizeMouseDown("sw")}
                          />
                        </>
                      )}

                    {isPreviewLoading && (
                      <div className="absolute inset-0 z-20 flex flex-col justify-end bg-black/25 p-3 space-y-2">
                        <p className="text-xs text-white text-center">
                          {t(
                            previewLoadingReason === "crop"
                              ? "upload.applyingCropProgress"
                              : "upload.loadingPreviewProgress",
                            {
                              percent: previewLoadProgress,
                            },
                          )}
                        </p>
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-[width] duration-150 ease-out"
                            style={{ width: `${previewLoadProgress}%` }}
                            role="progressbar"
                            aria-valuenow={previewLoadProgress}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={t(
                              previewLoadingReason === "crop"
                                ? "upload.applyingCropProgress"
                                : "upload.loadingPreviewProgress",
                              {
                                percent: previewLoadProgress,
                              },
                            )}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {previewError && useAiPreview && (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-800 rounded-lg border border-amber-200 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{previewError}</span>
                  </div>
                )}

                <div className="pt-4 space-y-4">
                  <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50/50 p-4">
                    <div className="w-full flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-sm font-medium text-gray-900">
                        <Sliders className="h-4 w-4" />
                        {t("upload.aiAdjustmentsTitle")}
                      </span>
                    </div>

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
