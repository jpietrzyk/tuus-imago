import { cn } from "@/lib/utils";
import { t } from "@/Locales/i18n";
import { Upload, Camera } from "lucide-react";

interface UploaderActionButtonsProps {
  onUploadClick: () => void;
  onCameraClick: () => void;
  className?: string;
  uploadText?: string;
  cameraText?: string;
}

export function UploaderActionButtons({
  onUploadClick,
  onCameraClick,
  className,
  uploadText = t("upload.uploadFromDevice"),
  cameraText = t("upload.takePhoto"),
}: UploaderActionButtonsProps) {
  return (
    <div className={cn("w-full h-full", className)}>
      <div className="h-full w-full p-6 m-2">
        <div className="flex h-full w-full flex-col gap-6">
          <button
            type="button"
            aria-label={t("upload.uploadFromDevice")}
            className="flex-1 w-full flex flex-col items-center justify-center cursor-pointer text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 p-6"
            onClick={(e) => {
              e.stopPropagation();
              onUploadClick();
            }}
          >
            <Upload className="h-28 w-28" />
            <span className="text-xs font-medium mt-2">{uploadText}</span>
          </button>
          <button
            type="button"
            aria-label={t("upload.openCamera")}
            className="flex-1 w-full flex flex-col items-center justify-center cursor-pointer text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 p-6"
            onClick={(e) => {
              e.stopPropagation();
              onCameraClick();
            }}
          >
            <Camera className="h-28 w-28" />
            <span className="text-xs font-medium mt-2">{cameraText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default UploaderActionButtons;
