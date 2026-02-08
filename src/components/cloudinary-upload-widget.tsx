import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import {
  Upload,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  RefreshCw,
  Check,
  X,
} from "lucide-react";
import { cloudinaryConfig } from "@/lib/cloudinary";

declare global {
  interface Window {
    cloudinary: {
      createUploadWidget: (
        options: Record<string, unknown>,
        callback: (error: Error | null, result: UploadResult | null) => void,
      ) => {
        open: () => void;
      };
    };
  }
}

export interface UploadResult {
  event: string;
  info: {
    public_id: string;
    secure_url: string;
    url: string;
    bytes: number;
    width: number;
    height: number;
    format: string;
    resource_type: string;
    created_at: string;
    [key: string]: unknown;
  };
}

export interface ImageTransformations {
  rotation: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
  brightness: number;
  contrast: number;
}

interface CloudinaryUploadWidgetProps {
  onUploadSuccess?: (
    result: UploadResult,
    transformations: ImageTransformations,
  ) => void;
  onUploadError?: (error: string) => void;
  buttonText?: string;
  className?: string;
}

const DEFAULT_TRANSFORMATIONS: ImageTransformations = {
  rotation: 0,
  flipHorizontal: false,
  flipVertical: false,
  brightness: 0,
  contrast: 0,
};

export function CloudinaryUploadWidget({
  onUploadSuccess,
  onUploadError,
  buttonText = "Upload Photo",
  className,
}: CloudinaryUploadWidgetProps) {
  const [isWidgetLoaded, setIsWidgetLoaded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<UploadResult | null>(null);
  const [transformations, setTransformations] = useState<ImageTransformations>(
    DEFAULT_TRANSFORMATIONS,
  );

  useEffect(() => {
    // Load Cloudinary upload widget script
    const script = document.createElement("script");
    script.src = "https://upload-widget.cloudinary.com/global/all.js";
    script.async = true;
    script.onload = () => setIsWidgetLoaded(true);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const openWidget = useCallback(() => {
    if (!isWidgetLoaded || !window.cloudinary) {
      onUploadError?.("Widget not loaded yet");
      return;
    }

    setIsUploading(true);

    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: cloudinaryConfig.cloudName,
        uploadPreset: cloudinaryConfig.uploadPreset,
        sources: ["local", "url", "camera"],
        multiple: false,
        maxFiles: 1,
        maxFileSize: 10000000, // 10MB
        cropping: true,
        croppingAspectRatio: 1,
        showSkipCropButton: false,
        croppingCoordinatesMode: "custom",
        folder: "tuus-imago",
        resourceType: "image",
        clientAllowedFormats: ["jpg", "jpeg", "png", "webp"],
        styles: {
          palette: {
            window: "#ffffff",
            sourceBg: "#f4f4f5",
            windowBorder: "#90a0b3",
            tabIcon: "#0078FF",
            inactiveTabIcon: "#69778A",
            menuIcons: "#5A616A",
            link: "#0078FF",
            action: "#339933",
            inProgress: "#0078FF",
            complete: "#339933",
            error: "#cc0000",
            textDark: "#000000",
            textLight: "#ffffff",
          },
        },
      },
      (error: Error | null, result: UploadResult | null) => {
        setIsUploading(false);
        console.log("Cloudinary widget callback:", { error, result });

        if (error) {
          console.error("Upload error:", error);
          onUploadError?.(error.message || "Upload failed");
          return;
        }

        if (result?.event === "success") {
          console.log("Upload successful, setting image:", result);
          setUploadedImage(result);
          setTransformations(DEFAULT_TRANSFORMATIONS);
        } else if (result?.event === "close") {
          console.log("Widget closed without upload");
          // Widget closed without upload
        }
      },
    );

    widget.open();
  }, [isWidgetLoaded, onUploadError]);

  const getTransformedUrl = useCallback(
    (baseUrl: string, trans: ImageTransformations): string => {
      const parts: string[] = [];

      // Apply rotation if not 0
      if (trans.rotation !== 0) {
        parts.push(`a_${trans.rotation}`);
      }

      // Apply flip transformations
      if (trans.flipHorizontal) {
        parts.push("h_flip");
      }
      if (trans.flipVertical) {
        parts.push("v_flip");
      }

      // Apply brightness if not 0
      if (trans.brightness !== 0) {
        parts.push(`e_brightness:${trans.brightness}`);
      }

      // Apply contrast if not 0
      if (trans.contrast !== 0) {
        parts.push(`e_contrast:${trans.contrast}`);
      }

      // If no transformations, return original URL
      if (parts.length === 0) {
        return baseUrl;
      }

      // Insert transformations into Cloudinary URL
      const urlParts = baseUrl.split("/upload/");
      if (urlParts.length === 2) {
        return `${urlParts[0]}/upload/${parts.join("/")}/${urlParts[1]}`;
      }

      return baseUrl;
    },
    [],
  );

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

  const handleConfirm = useCallback(() => {
    if (uploadedImage) {
      onUploadSuccess?.(uploadedImage, transformations);
      setUploadedImage(null);
      setTransformations(DEFAULT_TRANSFORMATIONS);
    }
  }, [uploadedImage, transformations, onUploadSuccess]);

  const handleCancel = useCallback(() => {
    setUploadedImage(null);
    setTransformations(DEFAULT_TRANSFORMATIONS);
  }, []);

  const hasTransformations = Object.values(transformations).some(
    (val) =>
      val !==
      DEFAULT_TRANSFORMATIONS[
        (Object.keys(transformations) as (keyof ImageTransformations)[])[0]
      ],
  );

  if (uploadedImage) {
    const transformedUrl = getTransformedUrl(
      uploadedImage.info.secure_url,
      transformations,
    );

    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Adjust Image</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Image Preview */}
          <div className="flex justify-center">
            <img
              src={transformedUrl}
              alt="Preview"
              className="max-w-full max-h-96 object-contain rounded-lg border"
              style={{
                transform: `rotate(${transformations.rotation}deg) scaleX(${transformations.flipHorizontal ? -1 : 1}) scaleY(${transformations.flipVertical ? -1 : 1})`,
              }}
            />
          </div>

          <Separator />

          {/* Transformation Controls */}
          <div className="space-y-4">
            {/* Rotation Controls */}
            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <RotateCw className="h-4 w-4" />
                  Rotation
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
                    setTransformations((prev) => ({ ...prev, rotation: value }))
                  }
                  className="flex-1"
                />
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleRotate(-90)}
                    title="Rotate -90°"
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
                    title="Rotate +90°"
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Flip Controls */}
            <div className="space-y-2">
              <Label>Flip</Label>
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
                  Horizontal
                </Button>
                <Button
                  type="button"
                  variant={transformations.flipVertical ? "default" : "outline"}
                  size="sm"
                  onClick={handleFlipVertical}
                  className="flex-1"
                >
                  <FlipVertical className="mr-2 h-4 w-4" />
                  Vertical
                </Button>
              </div>
            </div>

            {/* Brightness Control */}
            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span>Brightness</span>
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
                  setTransformations((prev) => ({ ...prev, brightness: value }))
                }
              />
            </div>

            {/* Contrast Control */}
            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span>Contrast</span>
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
                  setTransformations((prev) => ({ ...prev, contrast: value }))
                }
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2 justify-between">
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleCancel}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            {hasTransformations && (
              <Button type="button" variant="outline" onClick={handleReset}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            )}
          </div>
          <Button type="button" onClick={handleConfirm}>
            <Check className="mr-2 h-4 w-4" />
            Apply & Continue
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Button
      onClick={openWidget}
      disabled={!isWidgetLoaded || isUploading}
      className={className}
    >
      {isUploading ? (
        <>
          <span className="animate-spin mr-2">⏳</span>
          Uploading...
        </>
      ) : (
        <>
          <Upload className="mr-2 h-4 w-4" />
          {buttonText}
        </>
      )}
    </Button>
  );
}
