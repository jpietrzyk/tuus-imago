import { type ChangeEvent, type DragEvent, type RefObject } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/locales/i18n";
import UploaderActionButtons from "./uploader-action-buttons";

interface UploaderDropAreaProps {
  showIcons: boolean;
  className?: string;
  fileInputRef: RefObject<HTMLInputElement | null>;
  cameraInputRef: RefObject<HTMLInputElement | null>;
  onFileSelect: (event: ChangeEvent<HTMLInputElement>) => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDragLeave: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onShowIcons: () => void;
}

export function UploaderDropArea({
  showIcons,
  className,
  fileInputRef,
  cameraInputRef,
  onFileSelect,
  onDragOver,
  onDragLeave,
  onDrop,
  onShowIcons,
}: UploaderDropAreaProps) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        "text-center transition-all duration-200 w-full h-full min-h-0 flex items-center justify-center bg-transparent",
        className,
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={onFileSelect}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onFileSelect}
        className="hidden"
      />
      {showIcons ? (
        <UploaderActionButtons
          onUploadClick={() => fileInputRef.current?.click()}
          onCameraClick={() => cameraInputRef.current?.click()}
        />
      ) : (
        <button
          type="button"
          onClick={onShowIcons}
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

export default UploaderDropArea;
