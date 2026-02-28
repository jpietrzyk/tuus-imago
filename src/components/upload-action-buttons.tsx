import { cn } from "@/lib/utils";
import { Upload, Camera } from "lucide-react";

interface UploadActionButtonsProps {
  onUploadClick: () => void;
  onCameraClick: () => void;
  className?: string;
}

export function UploadActionButtons({
  onUploadClick,
  onCameraClick,
  className,
}: UploadActionButtonsProps) {
  return (
    <div className={cn("w-full h-full", className)}>
      <div className="h-full w-full p-6 m-2">
        <div className="flex h-full w-full flex-col gap-6">
          <button
            type="button"
            aria-label="Upload from device"
            className="flex-1 w-full flex items-center justify-center cursor-pointer text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 p-6"
            onClick={(e) => {
              e.stopPropagation();
              onUploadClick();
            }}
          >
            <Upload className="h-28 w-28" />
          </button>
          <button
            type="button"
            aria-label="Open camera"
            className="flex-1 w-full flex items-center justify-center cursor-pointer text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 p-6"
            onClick={(e) => {
              e.stopPropagation();
              onCameraClick();
            }}
          >
            <Camera className="h-28 w-28" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default UploadActionButtons;
