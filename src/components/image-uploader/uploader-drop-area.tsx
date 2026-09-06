import { type ChangeEvent, type DragEvent, type RefObject } from "react";
import { Upload, AlertCircle, X } from "lucide-react";
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
  error?: string | null;
  onDismissError?: () => void;
  onCaptureStart?: (source: "camera" | "gallery") => void;
}

interface SelectionErrorBannerProps {
  error: string;
  onDismiss?: () => void;
  className?: string;
}

export function SelectionErrorBanner({
  error,
  onDismiss,
  className,
}: SelectionErrorBannerProps) {
  return (
    <div
      role="alert"
      data-testid="uploader-selection-error"
      aria-live="assertive"
      className={cn(
        "flex w-full items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-left text-red-700",
        className,
      )}
    >
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <span className="min-w-0 flex-1 break-words text-sm font-medium">
        {error}
      </span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={t("uploader.dismissError")}
          className="shrink-0 rounded-md p-0.5 text-red-500 transition-colors hover:bg-red-100 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
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
  error,
  onDismissError,
  onCaptureStart,
}: UploaderDropAreaProps) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        "text-center transition-all duration-200 w-full h-full min-h-0 flex flex-col items-center justify-center bg-transparent",
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
      {error && (
        <SelectionErrorBanner
          error={error}
          onDismiss={onDismissError}
          className="mb-3"
        />
      )}
      <div className="flex min-h-0 w-full flex-1 items-center justify-center">
        {showIcons ? (
          <UploaderActionButtons
            onUploadClick={() => {
              // Persist the picker session before backgrounding the page —
              // the renderer may be killed while the native picker is open.
              onCaptureStart?.("gallery");
              fileInputRef.current?.click();
            }}
            onCameraClick={() => {
              onCaptureStart?.("camera");
              cameraInputRef.current?.click();
            }}
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
    </div>
  );
}

export default UploaderDropArea;
