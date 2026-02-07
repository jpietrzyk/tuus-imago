import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
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

interface CloudinaryUploadWidgetProps {
  onUploadSuccess?: (result: UploadResult) => void;
  onUploadError?: (error: string) => void;
  buttonText?: string;
  className?: string;
}

export function CloudinaryUploadWidget({
  onUploadSuccess,
  onUploadError,
  buttonText = "Upload Photo",
  className,
}: CloudinaryUploadWidgetProps) {
  const [isWidgetLoaded, setIsWidgetLoaded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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

        if (error) {
          onUploadError?.(error.message || "Upload failed");
          return;
        }

        if (result?.event === "success") {
          onUploadSuccess?.(result);
        } else if (result?.event === "close") {
          // Widget closed without upload
        }
      },
    );

    widget.open();
  }, [isWidgetLoaded, onUploadSuccess, onUploadError]);

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
