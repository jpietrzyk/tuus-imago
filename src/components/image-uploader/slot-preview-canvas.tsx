import { useSlotPreviewCanvas } from "./use-slot-preview-canvas";
import type { SelectedImageItem } from "./image-uploader";

interface SlotPreviewCanvasProps {
  image: SelectedImageItem;
  /** Source preview URL (cloud-transformed URL or local object URL). */
  previewUrl: string;
  /**
   * Cloud-backed previews already have effects and rotation baked into the
   * URL, so they render as a plain <img>; local previews render through a
   * canvas that applies the slot's crop, effects and rotation.
   */
  useCloudPreview: boolean;
  className?: string;
  testId?: string;
  ariaLabel?: string;
  debugLabel?: string;
  onCloudLoad?: () => void;
  onCloudError?: () => void;
}

/**
 * Renders one slot's preview surface. Local sources are drawn through a canvas
 * so the visible window always matches the slot's crop (zoom/pan and triptych
 * window), which a raw <img> cannot do.
 */
export function SlotPreviewCanvas({
  image,
  previewUrl,
  useCloudPreview,
  className,
  testId,
  ariaLabel,
  debugLabel,
  onCloudLoad,
  onCloudError,
}: SlotPreviewCanvasProps) {
  const canvasRef = useSlotPreviewCanvas({
    image,
    previewUrl,
    enabled: !useCloudPreview,
    debugLabel,
  });

  if (useCloudPreview) {
    return (
      <img
        src={previewUrl}
        alt=""
        className={className}
        draggable={false}
        onLoad={onCloudLoad}
        onError={onCloudError}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      data-testid={testId}
      aria-label={ariaLabel}
      className={className}
    />
  );
}

export default SlotPreviewCanvas;
