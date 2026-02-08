import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Crop,
  Sliders,
  Droplets,
  Zap,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cloudinaryConfig } from "@/lib/cloudinary";

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
    },
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
  grayscale: 0,
  blur: 0,
};

export function CustomImageUploader({
  onUploadSuccess,
  onUploadError,
  buttonText = "Upload Photo",
  className,
}: CustomImageUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [transformations, setTransformations] = useState<ImageTransformations>(
    DEFAULT_TRANSFORMATIONS,
  );
  const [isUploading, setIsUploading] = useState(false);
  const [step, setStep] = useState<"crop" | "adjust">("crop");
  const [cropArea, setCropArea] = useState<CropArea>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [collapsedSections, setCollapsedSections] = useState({
    rotation: true,
    flip: true,
    filters: true,
    brightness: true,
    contrast: true,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

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
          onUploadError?.("File size exceeds 10MB limit");
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

    setIsDragging(true);
    setDragStart({ x, y });
  }, []);

  const handleCropMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const dx = x - dragStart.x;
      const dy = y - dragStart.y;

      setCropArea((prev) => {
        let newX = prev.x + dx;
        let newY = prev.y + dy;

        // Clamp to image bounds
        newX = Math.max(0, Math.min(newX, imageDimensions.width - prev.width));
        newY = Math.max(
          0,
          Math.min(newY, imageDimensions.height - prev.height),
        );

        setDragStart({ x, y });
        return { ...prev, x: newX, y: newY };
      });
    },
    [isDragging, dragStart, imageDimensions],
  );

  const handleCropMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    setIsUploading(true);

    try {
      // Apply crop and transformations before uploading
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
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

      canvas.width = cropWidth;
      canvas.height = cropHeight;

      if (!ctx) throw new Error("Failed to create canvas context");

      // Apply transformations
      ctx.save();

      // Move to center for rotation
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((transformations.rotation * Math.PI) / 180);
      ctx.scale(
        transformations.flipHorizontal ? -1 : 1,
        transformations.flipVertical ? -1 : 1,
      );

      // Apply filters
      ctx.filter = `grayscale(${transformations.grayscale}%) blur(${transformations.blur}px) brightness(${100 + transformations.brightness}%) contrast(${100 + transformations.contrast}%)`;

      // Draw the cropped and transformed image
      ctx.drawImage(
        img,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        -canvas.width / 2,
        -canvas.height / 2,
        canvas.width,
        canvas.height,
      );

      ctx.restore();

      // Convert to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Failed to create blob"));
          },
          "image/jpeg",
          0.95,
        );
      });

      // Upload the processed image
      const formData = new FormData();
      formData.append("file", blob);
      formData.append("upload_preset", cloudinaryConfig.uploadPreset);
      formData.append("folder", "tuus-imago");

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || "Upload failed");
      }

      onUploadSuccess?.(
        {
          public_id: data.public_id,
          secure_url: data.secure_url,
          width: data.width,
          height: data.height,
          bytes: data.bytes,
          format: data.format,
          url: data.url,
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
    } catch (error) {
      onUploadError?.(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
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
  }, []);

  const handleCropConfirm = useCallback(() => {
    setStep("adjust");
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

  const toggleSection = useCallback(
    (section: keyof typeof collapsedSections) => {
      setCollapsedSections((prev) => ({
        ...prev,
        [section]: !prev[section],
      }));
    },
    [],
  );

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
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className={className}
        >
          {isUploading ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Processing...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              {buttonText}
            </>
          )}
        </Button>
      </div>
    );
  }

  // Show the upload/adjustment interface
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{step === "crop" ? "Crop Image" : "Adjust Image"}</span>
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
          <div
            className="flex justify-center bg-muted/50 rounded-lg p-4 relative select-none"
            onMouseUp={handleCropMouseUp}
            onMouseLeave={handleCropMouseUp}
          >
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
            {/* Crop Overlay */}
            {cropArea.width > 0 && cropArea.height > 0 && (
              <div
                className="absolute border-4 border-white border-opacity-90 shadow-2xl cursor-move bg-black bg-opacity-30"
                style={{
                  left: cropArea.x + 16,
                  top: cropArea.y + 16,
                  width: cropArea.width,
                  height: cropArea.height,
                }}
                onMouseDown={handleCropMouseDown}
                onMouseMove={handleCropMouseMove}
              >
                {/* Corner Handles */}
                <div className="absolute -top-1 -left-1 w-4 h-4 bg-white border-2 border-gray-400"></div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-white border-2 border-gray-400"></div>
                <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-white border-2 border-gray-400"></div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white border-2 border-gray-400"></div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex justify-center bg-muted/50 rounded-lg p-4">
            <img
              src={previewUrl}
              alt="Preview"
              className="max-w-full max-h-96 object-contain rounded-lg"
              style={{
                transform: `rotate(${transformations.rotation}deg) scaleX(${transformations.flipHorizontal ? -1 : 1}) scaleY(${transformations.flipVertical ? -1 : 1})`,
                filter: `grayscale(${transformations.grayscale}%) blur(${transformations.blur}px) brightness(${100 + transformations.brightness}%) contrast(${100 + transformations.contrast}%)`,
              }}
            />
          </div>
        )}

        {step === "crop" ? (
          <>
            <div className="text-center text-sm text-muted-foreground">
              <Crop className="h-4 w-4 inline mr-2" />
              Drag the crop area to select the region to keep
            </div>
            <Button
              type="button"
              onClick={handleCropConfirm}
              className="w-full"
            >
              <Check className="mr-2 h-4 w-4" />
              Confirm Crop
            </Button>
          </>
        ) : (
          <>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("crop")}
                className="flex-1"
              >
                <Crop className="mr-2 h-4 w-4" />
                Back to Crop
              </Button>
              <div className="flex-1" />
            </div>

            <Separator />

            {/* Transformation Controls */}
            <div className="space-y-3">
              {/* Rotation Controls */}
              <div className="border rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection("rotation")}
                  className="w-full px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors flex items-center justify-between"
                >
                  <Label className="flex items-center gap-2 cursor-pointer">
                    <RotateCw className="h-4 w-4" />
                    <span>Rotation</span>
                    <span className="text-sm text-muted-foreground">
                      {transformations.rotation}°
                    </span>
                  </Label>
                  {collapsedSections.rotation ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                </button>
                {!collapsedSections.rotation && (
                  <div className="p-4 space-y-3 bg-background">
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
                )}
              </div>

              {/* Flip Controls */}
              <div className="border rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection("flip")}
                  className="w-full px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors flex items-center justify-between"
                >
                  <Label className="cursor-pointer">Flip</Label>
                  {collapsedSections.flip ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                </button>
                {!collapsedSections.flip && (
                  <div className="p-4 space-y-3 bg-background">
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
                        variant={
                          transformations.flipVertical ? "default" : "outline"
                        }
                        size="sm"
                        onClick={handleFlipVertical}
                        className="flex-1"
                      >
                        <FlipVertical className="mr-2 h-4 w-4" />
                        Vertical
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Filters */}
              <div className="border rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection("filters")}
                  className="w-full px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors flex items-center justify-between"
                >
                  <Label className="flex items-center gap-2 cursor-pointer">
                    <Sliders className="h-4 w-4" />
                    <span>Filters</span>
                  </Label>
                  {collapsedSections.filters ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                </button>
                {!collapsedSections.filters && (
                  <div className="p-4 space-y-3 bg-background">
                    {/* Grayscale (Black and White) */}
                    <div className="space-y-2">
                      <Label className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          Black & White
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
                          Blur
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
                )}
              </div>

              {/* Brightness Control */}
              <div className="border rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection("brightness")}
                  className="w-full px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors flex items-center justify-between"
                >
                  <Label className="flex items-center justify-between cursor-pointer w-full">
                    <span>Brightness</span>
                    <span className="text-sm text-muted-foreground">
                      {transformations.brightness > 0
                        ? `+${transformations.brightness}`
                        : transformations.brightness}
                    </span>
                  </Label>
                  {collapsedSections.brightness ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                </button>
                {!collapsedSections.brightness && (
                  <div className="p-4 space-y-3 bg-background">
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
                )}
              </div>

              {/* Contrast Control */}
              <div className="border rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection("contrast")}
                  className="w-full px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors flex items-center justify-between"
                >
                  <Label className="flex items-center justify-between cursor-pointer w-full">
                    <span>Contrast</span>
                    <span className="text-sm text-muted-foreground">
                      {transformations.contrast > 0
                        ? `+${transformations.contrast}`
                        : transformations.contrast}
                    </span>
                  </Label>
                  {collapsedSections.contrast ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                </button>
                {!collapsedSections.contrast && (
                  <div className="p-4 space-y-3 bg-background">
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
                )}
              </div>

              {hasTransformations && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  className="w-full"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reset All Adjustments
                </Button>
              )}
            </div>

            <Separator />

            {/* Upload Buttons */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="flex-1"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
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
                    Uploading...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Upload Photo
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
