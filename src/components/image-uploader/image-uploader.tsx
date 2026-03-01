import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";
import { t } from "@/locales/i18n";
import UploaderDropArea from "./uploader-drop-area";
import UploaderTools from "./uploader-tools";

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
    useState<DisplayImageProportion>("horizontal");
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

      const outputWidth = Math.max(1, Math.round(cropWidth));
      const outputHeight = Math.max(1, Math.round(cropHeight));

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
        <div className="flex-1 flex justify-center bg-transparent rounded-lg p-4 min-h-0">
          <div
            className="relative w-full overflow-hidden rounded-lg border border-border/40 flex items-center justify-center"
            data-testid="selected-image-preview-frame"
          >
            <canvas
              ref={previewCanvasRef}
              role="img"
              aria-label="Preview"
              data-testid="selected-image-preview-canvas"
              className="max-w-none max-h-none"
              style={{
                userSelect: "none",
                WebkitUserSelect: "none",
              }}
            />
          </div>
        </div>

        <UploaderTools onSelectProportion={setDisplayImageProportion} />

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
