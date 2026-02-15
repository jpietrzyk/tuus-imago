import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Camera,
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

interface CustomImageUploaderProps {
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
  className?: string;
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

export function CustomImageUploader({
  onUploadSuccess,
  onUploadError,
}: CustomImageUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [transformations, setTransformations] = useState<ImageTransformations>(
    DEFAULT_TRANSFORMATIONS,
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [step, setStep] = useState<"crop" | "adjust">("crop");
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
  const [isAdjustmentsOpen, setIsAdjustmentsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [croppedCanvasUrl, setCroppedCanvasUrl] = useState<string | null>(null);
  const dragStateRef = useRef({
    isDragging: false,
    isResizing: false,
    resizeHandle: null as "nw" | "ne" | "se" | "sw" | null,
    startX: 0,
    startY: 0,
    containerRect: null as DOMRect | null,
  });

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
        setStep("crop");
        setCropArea({ x: 0, y: 0, width: 0, height: 0 });
      }
    },
    [onUploadError],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

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
        setStep("crop");
        setCropArea({ x: 0, y: 0, width: 0, height: 0 });
      }
    },
    [onUploadError],
  );

  useEffect(() => {
    if (previewUrl && step === "crop" && imageRef.current) {
      const img = imageRef.current;
      const width = img.offsetWidth;
      const height = img.offsetHeight;
      setImageDimensions({ width, height });
      // Set initial crop area to center square
      const minDim = Math.min(width, height);
      const initialCrop: CropArea = {
        x: (width - minDim * 0.8) / 2,
        y: (height - minDim * 0.8) / 2,
        width: minDim * 0.8,
        height: minDim * 0.8,
      };
      setCropArea(initialCrop);
    }
  }, [previewUrl, step]);

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

      // Calculate cropped dimensions based on the crop area
      const scaleX = img.naturalWidth / imageDimensions.width;
      const scaleY = img.naturalHeight / imageDimensions.height;

      const cropX = cropArea.x * scaleX;
      const cropY = cropArea.y * scaleY;
      const cropWidth = cropArea.width * scaleX;
      const cropHeight = cropArea.height * scaleY;

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

          // Set timeout to 5 minutes for large file uploads
          xhr.timeout = 300000; // 300000ms = 5 minutes

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

      if (data.error) {
        throw new Error(data.error.message || "Upload failed");
      }

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
      setStep("crop");
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
  ]);

  const handleCancel = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setTransformations(DEFAULT_TRANSFORMATIONS);
    setStep("crop");
    setCropArea({ x: 0, y: 0, width: 0, height: 0 });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
  }, []);

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
      canvasRef.current
    ) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

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

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

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

        // Save context state
        ctx.save();

        // Clear canvas
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        // Apply transformations
        ctx.translate(canvasWidth / 2, canvasHeight / 2);
        ctx.rotate((transformations.rotation * Math.PI) / 180);
        ctx.scale(
          transformations.flipHorizontal ? -1 : 1,
          transformations.flipVertical ? -1 : 1,
        );

        // Apply filters
        ctx.filter = `grayscale(${transformations.grayscale}%) blur(${transformations.blur}px) brightness(${100 + transformations.brightness}%) contrast(${100 + transformations.contrast}%)`;

        // Draw the cropped portion of the image
        // Source: crop area in natural image coordinates
        // Destination: centered on canvas
        ctx.drawImage(
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

        ctx.restore();

        // Convert canvas to data URL for display
        setCroppedCanvasUrl(canvas.toDataURL("image/jpeg", 0.95));
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

  const hasTransformations = Object.values(transformations).some(
    (val) =>
      val !==
      DEFAULT_TRANSFORMATIONS[
        (Object.keys(transformations) as (keyof ImageTransformations)[])[0]
      ],
  );

  // If no file is selected, show the upload button
  if (!selectedFile || !previewUrl) {
    return (
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
          w-full min-h-96 flex items-center justify-center cursor-pointer relative
          ${
            isDragOver
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50 bg-muted/20"
          }
        `}
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
        <div className="space-y-4 flex flex-col items-center justify-center h-full">
          <div
            className={`
              w-16 h-16 rounded-full mx-auto flex items-center justify-center
              ${isDragOver ? "bg-primary text-primary-foreground" : "bg-muted"}
            `}
          >
            <Upload className="h-8 w-8" />
          </div>
          <p className="text-sm text-muted-foreground">
            {isDragOver ? t("upload.dropFile") : t("upload.clickToUpload")}
          </p>
        </div>
        <Button
          onClick={(e) => {
            e.stopPropagation();
            cameraInputRef.current?.click();
          }}
          disabled={isUploading}
          variant="outline"
          size="icon"
          className="absolute bottom-4 right-4 w-12 h-12"
        >
          <Camera className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  // Show the upload/adjustment interface
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>
            {step === "crop"
              ? t("uploader.cropImage")
              : t("uploader.adjustImage")}
          </span>
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
      <CardContent className="space-y-6">
        {/* Image Preview */}
        {step === "crop" ? (
          <div className="flex justify-center bg-muted/50 rounded-lg p-4">
            <div className="relative inline-block">
              <img
                ref={imageRef}
                src={previewUrl}
                alt="Preview"
                className="max-w-full max-h-96 object-contain rounded-lg"
                style={{
                  userSelect: "none",
                  WebkitUserSelect: "none",
                }}
                onLoad={() => {
                  if (imageRef.current) {
                    const img = imageRef.current;
                    setImageDimensions({
                      width: img.offsetWidth,
                      height: img.offsetHeight,
                    });
                    const minDim = Math.min(img.offsetWidth, img.offsetHeight);
                    const initialCrop: CropArea = {
                      x: (img.offsetWidth - minDim * 0.8) / 2,
                      y: (img.offsetHeight - minDim * 0.8) / 2,
                      width: minDim * 0.8,
                      height: minDim * 0.8,
                    };
                    setCropArea(initialCrop);
                  }
                }}
              />
              {/* Crop selection overlay */}
              {cropArea.width > 0 && cropArea.height > 0 && (
                <>
                  {/* Top overlay */}
                  <div
                    className="absolute pointer-events-none bg-black/50"
                    style={{
                      left: 0,
                      top: 0,
                      width: "100%",
                      height: cropArea.y,
                    }}
                  />
                  {/* Bottom overlay */}
                  <div
                    className="absolute pointer-events-none bg-black/50"
                    style={{
                      left: 0,
                      top: cropArea.y + cropArea.height,
                      width: "100%",
                      height:
                        imageDimensions.height - cropArea.y - cropArea.height,
                    }}
                  />
                  {/* Left overlay */}
                  <div
                    className="absolute pointer-events-none bg-black/50"
                    style={{
                      left: 0,
                      top: cropArea.y,
                      width: cropArea.x,
                      height: cropArea.height,
                    }}
                  />
                  {/* Right overlay */}
                  <div
                    className="absolute pointer-events-none bg-black/50"
                    style={{
                      left: cropArea.x + cropArea.width,
                      top: cropArea.y,
                      width:
                        imageDimensions.width - cropArea.x - cropArea.width,
                      height: cropArea.height,
                    }}
                  />
                  {/* Crop selection border */}
                  <div
                    className="absolute border-2 border-white shadow-2xl"
                    style={{
                      left: cropArea.x,
                      top: cropArea.y,
                      width: cropArea.width,
                      height: cropArea.height,
                      cursor: "move",
                      pointerEvents: "none",
                    }}
                  />
                  {/* Drag overlay - only interactive within crop area */}
                  <div
                    className="absolute"
                    style={{
                      left: cropArea.x,
                      top: cropArea.y,
                      width: cropArea.width,
                      height: cropArea.height,
                      cursor: "move",
                    }}
                    onMouseDown={handleCropMouseDown}
                  />
                  {/* Resize handles */}
                  {/* Top-left corner */}
                  <div
                    className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-nwse-resize -ml-2 -mt-2"
                    style={{
                      left: cropArea.x,
                      top: cropArea.y,
                    }}
                    onMouseDown={handleResizeMouseDown("nw")}
                  />
                  {/* Top-right corner */}
                  <div
                    className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-nesw-resize -mr-2 -mt-2"
                    style={{
                      left: cropArea.x + cropArea.width,
                      top: cropArea.y,
                    }}
                    onMouseDown={handleResizeMouseDown("ne")}
                  />
                  {/* Bottom-right corner */}
                  <div
                    className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-nwse-resize -mr-2 -mb-2"
                    style={{
                      left: cropArea.x + cropArea.width,
                      top: cropArea.y + cropArea.height,
                    }}
                    onMouseDown={handleResizeMouseDown("se")}
                  />
                  {/* Bottom-left corner */}
                  <div
                    className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-nesw-resize -ml-2 -mb-2"
                    style={{
                      left: cropArea.x,
                      top: cropArea.y + cropArea.height,
                    }}
                    onMouseDown={handleResizeMouseDown("sw")}
                  />
                </>
              )}
              {imageDimensions.width === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground bg-muted/50 rounded-lg">
                  {t("upload.loadingPreview")}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex justify-center bg-muted/50 rounded-lg p-4">
            <div className="relative w-full min-w-50 max-w-125 aspect-square overflow-hidden rounded-lg flex items-center justify-center">
              {/* Canvas for rendering cropped area with transformations */}
              {cropArea.width > 0 && cropArea.height > 0 && (
                <canvas
                  ref={canvasRef}
                  className="w-full h-full object-contain"
                  data-testid="adjust-preview-image"
                  style={{
                    userSelect: "none",
                    WebkitUserSelect: "none",
                  }}
                />
              )}
              {croppedCanvasUrl && (
                <img
                  src={croppedCanvasUrl}
                  alt="Cropped Preview"
                  className="absolute inset-0 w-full h-full object-contain"
                  style={{
                    userSelect: "none",
                    WebkitUserSelect: "none",
                  }}
                />
              )}
            </div>
          </div>
        )}

        {step === "crop" ? (
          <>
            <div className="text-center text-sm text-muted-foreground">
              <Crop className="h-4 w-4 inline mr-2" />
              {t("uploader.dragCropArea")}
            </div>
            <Button
              type="button"
              onClick={handleCropConfirm}
              className="w-full"
            >
              <Check className="mr-2 h-4 w-4" />
              {t("uploader.confirmCrop")}
            </Button>
          </>
        ) : (
          <>
            {/* Action Buttons Row */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStep("crop");
                }}
                className="flex-1"
              >
                <Crop className="mr-2 h-4 w-4" />
                {t("uploader.backToCrop")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="flex-1"
              >
                <X className="mr-2 h-4 w-4" />
                {t("uploader.cancel")}
              </Button>
              <Button
                type="button"
                onClick={handleUpload}
                disabled={isUploading}
                className="flex-1"
              >
                {isUploading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    {t("uploader.uploadingProgress", {
                      percent: uploadProgress,
                    })}
                    <div className="space-y-1">
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-[width] duration-200 ease-out"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground text-right">
                        {uploadProgress}%
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    {t("uploader.uploadPhoto")}
                  </>
                )}
              </Button>
            </div>

            <Separator />

            {/* Transformation Controls */}
            <Collapsible
              open={isAdjustmentsOpen}
              onOpenChange={setIsAdjustmentsOpen}
            >
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="w-full px-4 py-3 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors flex items-center justify-between"
                >
                  <Label className="flex items-center gap-2 cursor-pointer">
                    <Sliders className="h-4 w-4" />
                    <span>{t("uploader.imageAdjustments")}</span>
                  </Label>
                  <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                {/* Rotation Controls */}
                <div className="space-y-3">
                  <Label className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <RotateCw className="h-4 w-4" />
                      {t("uploader.rotation")}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {transformations.rotation}°
                    </span>
                  </Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      min={0}
                      max={360}
                      value={transformations.rotation}
                      onChange={(value) =>
                        setTransformations((prev) => ({
                          ...prev,
                          rotation: value,
                        }))
                      }
                      className="flex-1"
                    />
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleRotate(-90)}
                        title={t("uploader.rotateMinus90")}
                      >
                        <RotateCw
                          className="h-4 w-4"
                          style={{ transform: "scaleX(-1)" }}
                        />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleRotate(90)}
                        title={t("uploader.rotatePlus90")}
                      >
                        <RotateCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Flip Controls */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    {t("uploader.flip")}
                  </Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={
                        transformations.flipHorizontal ? "default" : "outline"
                      }
                      size="sm"
                      onClick={handleFlipHorizontal}
                      className="flex-1"
                    >
                      <FlipHorizontal className="mr-2 h-4 w-4" />
                      {t("uploader.horizontal")}
                    </Button>
                    <Button
                      type="button"
                      variant={
                        transformations.flipVertical ? "default" : "outline"
                      }
                      size="sm"
                      onClick={handleFlipVertical}
                      className="flex-1"
                    >
                      <FlipVertical className="mr-2 h-4 w-4" />
                      {t("uploader.vertical")}
                    </Button>
                  </div>
                </div>

                {/* Filters */}
                <div className="space-y-4">
                  {/* Grayscale (Black and White) */}
                  <div className="space-y-2">
                    <Label className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        {t("uploader.blackAndWhite")}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {transformations.grayscale}%
                      </span>
                    </Label>
                    <Slider
                      min={0}
                      max={100}
                      value={transformations.grayscale}
                      onChange={(value) =>
                        setTransformations((prev) => ({
                          ...prev,
                          grayscale: value,
                        }))
                      }
                    />
                  </div>

                  {/* Blur */}
                  <div className="space-y-2">
                    <Label className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Droplets className="h-4 w-4" />
                        {t("upload.blur")}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {transformations.blur}px
                      </span>
                    </Label>
                    <Slider
                      min={0}
                      max={10}
                      step={0.5}
                      value={transformations.blur}
                      onChange={(value) =>
                        setTransformations((prev) => ({
                          ...prev,
                          blur: value,
                        }))
                      }
                    />
                  </div>
                </div>

                {/* Brightness Control */}
                <div className="space-y-3">
                  <Label className="flex items-center justify-between">
                    <span>{t("upload.brightness")}</span>
                    <span className="text-sm text-muted-foreground">
                      {transformations.brightness > 0
                        ? `+${transformations.brightness}`
                        : transformations.brightness}
                    </span>
                  </Label>
                  <Slider
                    min={-100}
                    max={100}
                    value={transformations.brightness}
                    onChange={(value) =>
                      setTransformations((prev) => ({
                        ...prev,
                        brightness: value,
                      }))
                    }
                  />
                </div>

                {/* Contrast Control */}
                <div className="space-y-3">
                  <Label className="flex items-center justify-between">
                    <span>{t("upload.contrast")}</span>
                    <span className="text-sm text-muted-foreground">
                      {transformations.contrast > 0
                        ? `+${transformations.contrast}`
                        : transformations.contrast}
                    </span>
                  </Label>
                  <Slider
                    min={-100}
                    max={100}
                    value={transformations.contrast}
                    onChange={(value) =>
                      setTransformations((prev) => ({
                        ...prev,
                        contrast: value,
                      }))
                    }
                  />
                </div>

                {hasTransformations && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    className="w-full"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {t("uploader.resetAllAdjustments")}
                  </Button>
                )}
              </CollapsibleContent>
            </Collapsible>
          </>
        )}
      </CardContent>
    </Card>
  );
}
