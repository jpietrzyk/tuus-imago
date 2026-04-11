interface UploadProgressOverlayProps {
  isVisible: boolean;
  progress: number; // 0-100
  label?: string;
  isIndeterminate?: boolean;
}

export function UploadProgressOverlay({
  isVisible,
  progress,
  label,
  isIndeterminate = false,
}: UploadProgressOverlayProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/40 backdrop-blur-sm rounded-lg p-4 z-40 pointer-events-none">
      <div className="flex flex-col items-center gap-2">
        <div className="text-sm font-medium text-white">
          {label || "Uploading..."}
        </div>
        {!isIndeterminate && progress !== undefined && (
          <div className="text-xs text-white/80">{Math.round(progress)}%</div>
        )}
      </div>
      <div className="w-32 h-1.5 bg-white/20 rounded-full overflow-hidden">
        {isIndeterminate ? (
          <div className="h-full w-1/3 bg-white/80 rounded-full animate-[indeterminate-slide_1.2s_ease-in-out_infinite]" />
        ) : (
          <div
            className="h-full bg-white/80 rounded-full transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        )}
      </div>
    </div>
  );
}
