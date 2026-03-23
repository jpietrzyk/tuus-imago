interface UploadProgressOverlayProps {
  isVisible: boolean;
  progress: number; // 0-100
  label?: string;
}

export function UploadProgressOverlay({
  isVisible,
  progress,
  label,
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
        {progress !== undefined && (
          <div className="text-xs text-white/80">{Math.round(progress)}%</div>
        )}
      </div>
      {/* Inline Progress Bar */}
      <div className="w-32 h-1.5 bg-white/20 rounded-full overflow-hidden">
        <div
          className="h-full bg-white/80 rounded-full transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
