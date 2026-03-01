import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Upload,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  RefreshCw,
  Check,
  X,
  Crop,
  Sliders,
  Droplets,
  Zap,
  ChevronDown,
} from "lucide-react";
import { t } from "@/locales/i18n";
import {
  cloudinaryConfig,
  getCloudinaryUploadConfigError,
} from "@/lib/cloudinary";
import { cn } from "@/lib/utils";
import UploadActionButtons from "@/components/upload-action-buttons";

export interface ImageTransformations {
  rotation: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
  brightness: number;
  contrast: number;
  grayscale: number;
  blur: number;
}

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SelectedImageMetadata {
  width: number;
  height: number;
  aspectRatio: string;
}

type DisplayImageProportion = "horizontal" | "vertical" | "square";

interface ImageUploaderProps {
  onUploadSuccess?: (
    result: {
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
    transformations: ImageTransformations,
  ) => void;
  onUploadError?: (error: string) => void;
  onImageMetadataChange?: (metadata: SelectedImageMetadata | null) => void;
  className?: string;
  skipCropStep?: boolean;
  defaultShowIcons?: boolean;
}

interface CloudinaryUploadResponse {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  bytes: number;
  format: string;
  url: string;
  error?: {
    message?: string;
  };
}

const DEFAULT_TRANSFORMATIONS: ImageTransformations = {
  rotation: 0,
  flipHorizontal: false,
  flipVertical: false,
  brightness: 0,
  contrast: 0,
  grayscale: 0,
  blur: 0,
};

const greatestCommonDivisor = (a: number, b: number): number => {
  if (!b) {
    return a;
  }

  return greatestCommonDivisor(b, a % b);
};

const formatAspectRatio = (width: number, height: number): string => {
  const divisor = greatestCommonDivisor(width, height);
  return `${width / divisor}:${height / divisor}`;
};

const getTargetAspectRatio = (proportion: DisplayImageProportion): number => {
  switch (proportion) {
    case "vertical":
      return 3 / 4;
    case "square":
      return 1;
    case "horizontal":
    default:
      return 16 / 9;
  }
};

// Upload timeout in milliseconds (2 minutes)
const UPLOAD_TIMEOUT_MS = 120000;

export function ImageUploader({
  onUploadSuccess,
  onUploadError,
  onImageMetadataChange,
  className,
  skipCropStep = false,
  defaultShowIcons = false,
}: ImageUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showIcons, setShowIcons] = useState(defaultShowIcons);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [transformations, setTransformations] = useState<ImageTransformations>(
    DEFAULT_TRANSFORMATIONS,
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [step, setStep] = useState<"crop" | "adjust">(
    skipCropStep ? "adjust" : "crop",
  );
  const [cropArea, setCropArea] = useState<CropArea>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [selectedImageMetadata, setSelectedImageMetadata] =
    useState<SelectedImageMetadata | null>(null);
  const [displayImageProportion, setDisplayImageProportion] =
    useState<DisplayImageProportion>("horizontal");
  const [isAdjustmentsOpen, setIsAdjustmentsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const centerCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const dragStateRef = useRef({
    isDragging: false,
    isResizing: false,
    resizeHandle: null as "nw" | "ne" | "se" | "sw" | null,
    startX: 0,
    startY: 0,
    containerRect: null as DOMRect | null,
  });

  useEffect(() => {
    setShowIcons(defaultShowIcons);
  }, [defaultShowIcons]);

  const updateSelectedImageMetadata = useCallback(
    (metadata: SelectedImageMetadata | null) => {
      setSelectedImageMetadata(metadata);
      onImageMetadataChange?.(metadata);
    },
    [onImageMetadataChange],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (
        file &&
        (file.type === "image/jpeg" ||
          file.type === "image/png" ||
          file.type === "image/webp")
      ) {
        if (file.size > 10 * 1024 * 1024) {
          onUploadError?.(t("upload.error"));
          return;
        }
        setSelectedFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        setTransformations(DEFAULT_TRANSFORMATIONS);
        setStep(skipCropStep ? "adjust" : "crop");
        setCropArea({ x: 0, y: 0, width: 0, height: 0 });
      }
    },
    [onUploadError, skipCropStep],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();

      const file = e.dataTransfer.files?.[0];
      if (
        file &&
        (file.type === "image/jpeg" ||
          file.type === "image/png" ||
          file.type === "image/webp")
      ) {
        if (file.size > 10 * 1024 * 1024) {
          onUploadError?.(t("upload.error"));
          return;
        }
        setSelectedFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        setTransformations(DEFAULT_TRANSFORMATIONS);
        setStep(skipCropStep ? "adjust" : "crop");
        setCropArea({ x: 0, y: 0, width: 0, height: 0 });
      }
    },
    [onUploadError, skipCropStep],
  );

  useEffect(() => {
    if (!previewUrl) {
      updateSelectedImageMetadata(null);
      return;
    }

    if (step === "crop" && imageRef.current) {
      const img = imageRef.current;
      const width = img.offsetWidth;
      const height = img.offsetHeight;
      setImageDimensions({ width, height });
      const minDim = Math.min(width, height);
      const initialCrop: CropArea = {
        x: (width - minDim * 0.8) / 2,
        y: (height - minDim * 0.8) / 2,
        width: minDim * 0.8,
        height: minDim * 0.8,
      };
      setCropArea(initialCrop);
      return;
    }

    if (step === "adjust" && (cropArea.width === 0 || cropArea.height === 0)) {
      const img = new Image();
      img.onload = () => {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;

        if (width > 0 && height > 0) {
          setImageDimensions({ width, height });
          setCropArea({ x: 0, y: 0, width, height });
        }
      };
      img.src = previewUrl;
    }
  }, [
    previewUrl,
    step,
    cropArea.width,
    cropArea.height,
    updateSelectedImageMetadata,
  ]);

  const handleCropMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    dragStateRef.current = {
      isDragging: true,
      isResizing: false,
      resizeHandle: null,
      startX: x,
      startY: y,
      containerRect: (e.currentTarget as HTMLElement).getBoundingClientRect(),
    };
  }, []);

  const handleResizeMouseDown = useCallback(
    (handle: "nw" | "ne" | "se" | "sw") => {
      return (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const rect = (
          e.currentTarget.parentElement as HTMLElement
        ).getBoundingClientRect();

        dragStateRef.current = {
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

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const state = dragStateRef.current;

      if (!state.isDragging && !state.isResizing) return;

      const rect = state.containerRect;
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (state.isDragging) {
        const dx = x - state.startX;
        const dy = y - state.startY;

        setCropArea((prev) => {
          let newX = prev.x + dx;
          let newY = prev.y + dy;

          // Clamp to image bounds
          newX = Math.max(
            0,
            Math.min(newX, imageDimensions.width - prev.width),
          );
          newY = Math.max(
            0,
            Math.min(newY, imageDimensions.height - prev.height),
          );

          // Update drag start position for next move
          dragStateRef.current.startX = x;
          dragStateRef.current.startY = y;

          return { ...prev, x: newX, y: newY };
        });
      } else if (state.isResizing && state.resizeHandle) {
        const handle = state.resizeHandle;
        const dx = x - state.startX;
        const dy = y - state.startY;

        setCropArea((prev) => {
          let newX = prev.x;
          let newY = prev.y;
          let newWidth = prev.width;
          let newHeight = prev.height;

          // Calculate new size based on resize handle
          // We maintain aspect ratio (1:1)
          let deltaSize = 0;

          switch (handle) {
            case "se": // Bottom-right
              deltaSize = Math.max(dx, dy);
              newWidth = Math.max(50, prev.width + deltaSize);
              newHeight = newWidth; // Maintain 1:1 aspect ratio
              // Clamp to image bounds
              newWidth = Math.min(newWidth, imageDimensions.width - prev.x);
              newHeight = Math.min(newHeight, imageDimensions.height - prev.y);
              break;
            case "sw": // Bottom-left
              deltaSize = Math.max(-dx, dy);
              newWidth = Math.max(50, prev.width + deltaSize);
              newHeight = newWidth;
              newX = prev.x - (newWidth - prev.width);
              // Clamp
              if (newX < 0) {
                newWidth = prev.width + prev.x;
                newX = 0;
                newHeight = newWidth;
              }
              newHeight = Math.min(newHeight, imageDimensions.height - prev.y);
              newWidth = newHeight;
              newX = prev.x - (newWidth - prev.width);
              break;
            case "ne": // Top-right
              deltaSize = Math.max(dx, -dy);
              newWidth = Math.max(50, prev.width + deltaSize);
              newHeight = newWidth;
              newY = prev.y - (newHeight - prev.height);
              // Clamp
              if (newY < 0) {
                newHeight = prev.height + prev.y;
                newY = 0;
                newWidth = newHeight;
              }
              newWidth = Math.min(newWidth, imageDimensions.width - prev.x);
              newHeight = newWidth;
              newY = prev.y - (newHeight - prev.height);
              break;
            case "nw": // Top-left
              deltaSize = Math.max(-dx, -dy);
              newWidth = Math.max(50, prev.width + deltaSize);
              newHeight = newWidth;
              newX = prev.x - (newWidth - prev.width);
              newY = prev.y - (newHeight - prev.height);
              // Clamp
              if (newX < 0) {
                newWidth = prev.width + prev.x;
                newX = 0;
                newHeight = newWidth;
              }
              if (newY < 0) {
                newHeight = newWidth;
                newY = prev.y - (newHeight - prev.height);
                newHeight = prev.height + prev.y;
                newY = 0;
                newWidth = newHeight;
                newX = prev.x - (newWidth - prev.width);
              }
              break;
          }

          // Update drag start position for next move
          dragStateRef.current.startX = x;
          dragStateRef.current.startY = y;

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
      dragStateRef.current.isDragging = false;
      dragStateRef.current.isResizing = false;
      dragStateRef.current.resizeHandle = null;
      dragStateRef.current.containerRect = null;
    };

    if (step === "crop") {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [imageDimensions, step]);

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    const configError = getCloudinaryUploadConfigError();
    if (configError) {
      onUploadError?.(
        `${configError}. Configure Cloudinary env vars and create an unsigned upload preset in Cloudinary Dashboard.`,
      );
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const img = new Image();

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = previewUrl!;
      });

      const effectiveImageDimensions =
        imageDimensions.width > 0 && imageDimensions.height > 0
          ? imageDimensions
          : { width: img.naturalWidth, height: img.naturalHeight };

      const effectiveCropArea =
        cropArea.width > 0 && cropArea.height > 0
          ? cropArea
          : {
              x: 0,
              y: 0,
              width: effectiveImageDimensions.width,
              height: effectiveImageDimensions.height,
            };

      const scaleX = img.naturalWidth / effectiveImageDimensions.width;
      const scaleY = img.naturalHeight / effectiveImageDimensions.height;

      const cropX = effectiveCropArea.x * scaleX;
      const cropY = effectiveCropArea.y * scaleY;
      const cropWidth = effectiveCropArea.width * scaleX;
      const cropHeight = effectiveCropArea.height * scaleY;

      const customCoordinates = `${Math.round(cropX)},${Math.round(cropY)},${Math.round(cropWidth)},${Math.round(cropHeight)}`;
      const context = [
        `rotation=${transformations.rotation}`,
        `flipHorizontal=${transformations.flipHorizontal}`,
        `flipVertical=${transformations.flipVertical}`,
        `brightness=${transformations.brightness}`,
        `contrast=${transformations.contrast}`,
        `grayscale=${transformations.grayscale}`,
        `blur=${transformations.blur}`,
      ].join("|");

      const signatureResponse = await fetch(
        "/.netlify/functions/cloudinary-signature",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paramsToSign: {
              upload_preset: cloudinaryConfig.uploadPreset,
              folder: "tuus-imago",
              custom_coordinates: customCoordinates,
              context,
            },
          }),
        },
      );

      const signatureData = await signatureResponse.json();

      if (!signatureResponse.ok) {
        throw new Error(
          signatureData.error ||
            "Failed to generate upload signature. Make sure Netlify Function is configured.",
        );
      }

      // Upload original image with crop/adjustment metadata
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("upload_preset", cloudinaryConfig.uploadPreset);
      formData.append("folder", "tuus-imago");
      formData.append("custom_coordinates", customCoordinates);
      formData.append("context", context);
      formData.append("timestamp", String(signatureData.timestamp));
      formData.append("signature", signatureData.signature);
      formData.append("api_key", signatureData.apiKey);

      const data = await new Promise<CloudinaryUploadResponse>(
        (resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open(
            "POST",
            `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
          );

          // Configure timeout for the upload request
          xhr.timeout = UPLOAD_TIMEOUT_MS;

          xhr.upload.onprogress = (event) => {
            if (!event.lengthComputable) return;

            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(Math.max(0, Math.min(100, progress)));
          };

          xhr.onload = () => {
            try {
              const responseJson = JSON.parse(
                xhr.responseText || "{}",
              ) as CloudinaryUploadResponse;

              if (xhr.status >= 200 && xhr.status < 300) {
                resolve(responseJson);
                return;
              }

              const errorMessage =
                typeof responseJson.error === "object" &&
                responseJson.error !== null &&
                "message" in responseJson.error
                  ? String(
                      (responseJson.error as { message?: unknown }).message,
                    )
                  : "Upload failed";

              reject(new Error(errorMessage));
            } catch {
              reject(new Error("Upload failed"));
            }
          };

          xhr.onerror = () => {
            reject(new Error("Upload failed"));
          };

          xhr.ontimeout = () => {
            reject(
              new Error(
                "Upload timed out. Please check your connection and try again.",
              ),
            );
          };

          xhr.send(formData);
        },
      );

      setUploadProgress(100);

      onUploadSuccess?.(
        {
          public_id: data.public_id,
          secure_url: data.secure_url,
          width: data.width,
          height: data.height,
          bytes: data.bytes,
          format: data.format,
          url: data.url,
          custom_coordinates: customCoordinates,
          context,
        },
        transformations,
      );

      // Reset
      setSelectedFile(null);
      setPreviewUrl(null);
      setTransformations(DEFAULT_TRANSFORMATIONS);
      setStep(skipCropStep ? "adjust" : "crop");
      setCropArea({ x: 0, y: 0, width: 0, height: 0 });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      if (cameraInputRef.current) {
        cameraInputRef.current.value = "";
      }
    } catch (error) {
      onUploadError?.(
        error instanceof Error ? error.message : t("upload.uploadFailed"),
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [
    selectedFile,
    previewUrl,
    imageDimensions,
    cropArea,
    transformations,
    onUploadSuccess,
    onUploadError,
    skipCropStep,
  ]);

  const handleCancel = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
    updateSelectedImageMetadata(null);
    setTransformations(DEFAULT_TRANSFORMATIONS);
    setStep(skipCropStep ? "adjust" : "crop");
    setCropArea({ x: 0, y: 0, width: 0, height: 0 });
    setDisplayImageProportion("horizontal");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
  }, [skipCropStep, updateSelectedImageMetadata]);

  const previewAspectRatio =
    displayImageProportion === "horizontal"
      ? "16 / 9"
      : displayImageProportion === "vertical"
        ? "3 / 4"
        : "1 / 1";

  useEffect(() => {
    if (!previewUrl || !previewCanvasRef.current) {
      return;
    }

    const canvas = previewCanvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const image = new Image();
    image.onload = () => {
      const sourceWidth = image.naturalWidth || image.width;
      const sourceHeight = image.naturalHeight || image.height;

      if (sourceWidth <= 0 || sourceHeight <= 0) {
        return;
      }

      updateSelectedImageMetadata({
        width: sourceWidth,
        height: sourceHeight,
        aspectRatio: formatAspectRatio(sourceWidth, sourceHeight),
      });

      const targetAspectRatio = getTargetAspectRatio(displayImageProportion);
      const sourceAspectRatio = sourceWidth / sourceHeight;

      let cropX = 0;
      let cropY = 0;
      let cropWidth = sourceWidth;
      let cropHeight = sourceHeight;

      if (sourceAspectRatio > targetAspectRatio) {
        cropWidth = sourceHeight * targetAspectRatio;
        cropX = (sourceWidth - cropWidth) / 2;
      } else if (sourceAspectRatio < targetAspectRatio) {
        cropHeight = sourceWidth / targetAspectRatio;
        cropY = (sourceHeight - cropHeight) / 2;
      }

      const maxOutputSize = 1200;
      const outputScale = Math.min(
        1,
        maxOutputSize / cropWidth,
        maxOutputSize / cropHeight,
      );
      const outputWidth = Math.max(1, Math.round(cropWidth * outputScale));
      const outputHeight = Math.max(1, Math.round(cropHeight * outputScale));

      canvas.width = outputWidth;
      canvas.height = outputHeight;

      if (
        typeof HTMLImageElement !== "undefined" &&
        !(image instanceof HTMLImageElement)
      ) {
        return;
      }

      context.clearRect(0, 0, outputWidth, outputHeight);
      context.drawImage(
        image,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        outputWidth,
        outputHeight,
      );
    };

    image.src = previewUrl;
  }, [previewUrl, displayImageProportion, updateSelectedImageMetadata]);

  const handleRotate = useCallback((angle: number) => {
    setTransformations((prev) => ({
      ...prev,
      rotation: (prev.rotation + angle + 360) % 360,
    }));
  }, []);

  const handleFlipHorizontal = useCallback(() => {
    setTransformations((prev) => ({
      ...prev,
      flipHorizontal: !prev.flipHorizontal,
    }));
  }, []);

  const handleFlipVertical = useCallback(() => {
    setTransformations((prev) => ({
      ...prev,
      flipVertical: !prev.flipVertical,
    }));
  }, []);

  const handleReset = useCallback(() => {
    setTransformations(DEFAULT_TRANSFORMATIONS);
  }, []);

  const handleCropConfirm = useCallback(() => {
    // Ensure we have valid crop area and dimensions before switching to adjust step
    // This handles the case where the image hasn't loaded properly (e.g., in test environment)
    if (cropArea.width === 0 || cropArea.height === 0) {
      // Set default crop area if it's still not set
      const defaultWidth = 400;
      const defaultHeight = 400;
      setCropArea({
        x: 0,
        y: 0,
        width: defaultWidth,
        height: defaultHeight,
      });
      setImageDimensions({
        width: defaultWidth,
        height: defaultHeight,
      });
    }
    setStep("adjust");
  }, [cropArea.width, cropArea.height]);

  // Render cropped image to canvas when in adjust step
  useEffect(() => {
    if (
      step === "adjust" &&
      previewUrl &&
      cropArea.width > 0 &&
      cropArea.height > 0 &&
      centerCanvasRef.current
    ) {
      const centerCanvas = centerCanvasRef.current;
      const centerCtx = centerCanvas.getContext("2d");
      if (!centerCtx) return;

      // Set canvas size to match the crop area (capped at 600px for better quality on larger displays)
      const maxWidth = 600;
      const maxHeight = 600;
      const scale = Math.min(
        maxWidth / cropArea.width,
        maxHeight / cropArea.height,
        1, // Don't upscale if crop area is larger than 600px
      );
      const canvasWidth = cropArea.width * scale;
      const canvasHeight = cropArea.height * scale;

      // Set center canvas dimensions
      centerCanvas.width = canvasWidth;
      centerCanvas.height = canvasHeight;

      // Load the original image
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        // Calculate the scale between displayed dimensions and natural dimensions
        const scaleX = img.naturalWidth / imageDimensions.width;
        const scaleY = img.naturalHeight / imageDimensions.height;

        // Calculate crop area in natural image coordinates
        const cropX = cropArea.x * scaleX;
        const cropY = cropArea.y * scaleY;
        const cropWidth = cropArea.width * scaleX;
        const cropHeight = cropArea.height * scaleY;

        centerCtx.save();
        centerCtx.clearRect(0, 0, canvasWidth, canvasHeight);
        centerCtx.translate(canvasWidth / 2, canvasHeight / 2);
        centerCtx.rotate((transformations.rotation * Math.PI) / 180);
        centerCtx.scale(
          transformations.flipHorizontal ? -1 : 1,
          transformations.flipVertical ? -1 : 1,
        );
        centerCtx.filter = `grayscale(${transformations.grayscale}%) blur(${transformations.blur}px) brightness(${100 + transformations.brightness}%) contrast(${100 + transformations.contrast}%)`;
        centerCtx.drawImage(
          img,
          cropX,
          cropY,
          cropWidth,
          cropHeight,
          -canvasWidth / 2,
          -canvasHeight / 2,
          canvasWidth,
          canvasHeight,
        );
        centerCtx.restore();
      };
      img.onerror = () => {
        console.error("Failed to load image for canvas rendering");
      };
      img.src = previewUrl;
    }
  }, [step, previewUrl, cropArea, imageDimensions, transformations]);

  // Cleanup blob URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // If no file is selected, show the upload button
  if (!selectedFile || !previewUrl) {
    return (
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "text-center transition-all duration-200 w-full h-full min-h-0 flex items-center justify-center bg-transparent",
          className,
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />
        {showIcons ? (
          <UploadActionButtons
            onUploadClick={() => fileInputRef.current?.click()}
            onCameraClick={() => cameraInputRef.current?.click()}
          />
        ) : (
          <button
            type="button"
            onClick={() => !isUploading && setShowIcons(true)}
            className="border-2 border-dashed rounded-lg p-6 border-muted-foreground/25 hover:border-muted-foreground/50 transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer"
          >
            <Upload className="h-12 w-12 text-muted-foreground" />
            <span className="text-muted-foreground font-medium">
              {t("upload.clickToUpload")}
            </span>
          </button>
        )}
      </div>
    );
  }

  // Show selected image preview and proportions (controls hidden)
  return (
    <Card className="w-full max-w-2xl mx-auto h-full bg-transparent! flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{t("uploader.adjustImage")}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="text-destructive hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col space-y-4 overflow-hidden">
        <div className="flex-1 flex justify-center bg-transparent rounded-lg p-4 min-h-0">
          <div
            className="relative w-full overflow-hidden rounded-lg border border-border/40 flex items-center justify-center"
            style={{ aspectRatio: previewAspectRatio }}
            data-testid="selected-image-preview-frame"
          >
            <canvas
              ref={previewCanvasRef}
              role="img"
              aria-label="Preview"
              data-testid="selected-image-preview-canvas"
              className="w-full h-full"
              style={{
                userSelect: "none",
                WebkitUserSelect: "none",
              }}
            />
          </div>
        </div>

        <div className="flex justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-testid="image-proportions-dropdown-trigger"
              >
                Image proportions
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              <DropdownMenuItem
                onSelect={() => setDisplayImageProportion("vertical")}
              >
                Vertical
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => setDisplayImageProportion("horizontal")}
              >
                Horizontal
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => setDisplayImageProportion("square")}
              >
                Square
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {selectedImageMetadata && (
          <div
            className="text-center text-sm text-muted-foreground"
            data-testid="image-proportions"
          >
            {selectedImageMetadata.width} × {selectedImageMetadata.height} •{" "}
            {selectedImageMetadata.aspectRatio}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
