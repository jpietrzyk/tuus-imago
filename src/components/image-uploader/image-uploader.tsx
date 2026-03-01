import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";
import { t } from "@/locales/i18n";
import UploaderDropArea from "./uploader-drop-area";
import UploaderTools from "./uploader-tools";
import {
  calculateAllProportions,
  calculateMaxCenteredCrop,
  formatAspectRatio,
  getTargetAspectRatio,
  type ImageDisplayProportion,
} from "./image-proportion-calculator";

export interface ImageTransformations {
  rotation: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
  brightness: number;
  contrast: number;
  grayscale: number;
  blur: number;
}

export interface SelectedImageMetadata {
  width: number;
  height: number;
  aspectRatio: string;
}

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

export function ImageUploader({
  onUploadError,
  onImageMetadataChange,
  className,
  defaultShowIcons = false,
}: ImageUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showIcons, setShowIcons] = useState(defaultShowIcons);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedImageMetadata, setSelectedImageMetadata] =
    useState<SelectedImageMetadata | null>(null);
  const [displayImageProportion, setDisplayImageProportion] =
    useState<ImageDisplayProportion>("horizontal");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

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
      }
    },
    [onUploadError],
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
      }
    },
    [onUploadError],
  );

  const handleCancel = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
    updateSelectedImageMetadata(null);
    setDisplayImageProportion("horizontal");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
  }, [updateSelectedImageMetadata]);

  const coveragePercent = useMemo(() => {
    if (!selectedImageMetadata) {
      return undefined;
    }

    const proportions = calculateAllProportions(
      selectedImageMetadata.width,
      selectedImageMetadata.height,
    );

    return {
      horizontal: proportions.horizontal.coveragePercent,
      vertical: proportions.vertical.coveragePercent,
      rectangle: proportions.square.coveragePercent,
    };
  }, [selectedImageMetadata]);

  const previewFrameAspectRatio = useMemo(
    () => getTargetAspectRatio(displayImageProportion),
    [displayImageProportion],
  );

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

      const crop = calculateMaxCenteredCrop({
        sourceWidth,
        sourceHeight,
        proportion: displayImageProportion,
      });

      canvas.width = crop.outputWidth;
      canvas.height = crop.outputHeight;

      if (
        typeof HTMLImageElement !== "undefined" &&
        !(image instanceof HTMLImageElement)
      ) {
        return;
      }

      context.clearRect(0, 0, crop.outputWidth, crop.outputHeight);
      context.drawImage(
        image,
        crop.cropX,
        crop.cropY,
        crop.cropWidth,
        crop.cropHeight,
        0,
        0,
        crop.outputWidth,
        crop.outputHeight,
      );
    };

    image.src = previewUrl;
  }, [previewUrl, displayImageProportion, updateSelectedImageMetadata]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  if (!selectedFile || !previewUrl) {
    return (
      <UploaderDropArea
        showIcons={showIcons}
        className={className}
        fileInputRef={fileInputRef}
        cameraInputRef={cameraInputRef}
        onFileSelect={handleFileSelect}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onShowIcons={() => setShowIcons(true)}
      />
    );
  }

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
        <div className="flex-1 flex justify-center items-center bg-transparent rounded-lg p-4 min-h-0">
          <div
            className="relative w-full max-w-full max-h-full overflow-hidden rounded-lg border border-border/40 flex items-center justify-center"
            data-testid="selected-image-preview-frame"
            style={{ aspectRatio: String(previewFrameAspectRatio) }}
          >
            <canvas
              ref={previewCanvasRef}
              role="img"
              aria-label="Preview"
              data-testid="selected-image-preview-canvas"
              className="max-w-full max-h-full w-auto h-auto"
              style={{
                userSelect: "none",
                WebkitUserSelect: "none",
              }}
            />
          </div>
        </div>

        <UploaderTools
          onSelectProportion={setDisplayImageProportion}
          coveragePercent={coveragePercent}
          selectedProportion={
            displayImageProportion === "square"
              ? "rectangle"
              : displayImageProportion
          }
        />

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
