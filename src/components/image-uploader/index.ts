export { ImageUploader } from "./image-uploader";
export type {
  BatchUploadSummary,
  ImageUploaderHandle,
  ImageTransformations,
  OrderableSlotSummary,
  SelectedImageMetadata,
  UploadSlotKey,
  UploadedSlotResult,
} from "./image-uploader";

export { UploaderDropArea } from "./uploader-drop-area";
export { UploaderActionButtons } from "./uploader-action-buttons";
export { UploaderTools } from "./uploader-tools";
export { default as UploaderSlotSwitcher } from "./uploader-slot-switcher";
export { UploaderPreviewToolsPanel } from "./uploader-preview-tools-panel";
export { default as SideSlotPreview } from "./side-slot-preview";
export { default as UploaderPreviewSlider } from "./uploader-preview-slider";

export {
  calculateAllProportions,
  calculateMaxCenteredCrop,
  formatAspectRatio,
  getOptimalDisplayProportion,
  getTargetAspectRatio,
} from "./image-proportion-calculator";
export type {
  CropCalculationResult,
  ImageDisplayProportion,
} from "./image-proportion-calculator";

export {
  drawCroppedImageToCanvas,
  loadImageElement,
  resolveImageDimensions,
} from "./preview-canvas-utils";

export { buildPreviewImageMetadata } from "./preview-image-metadata";
export { buildPreviewRenderPlan } from "./preview-render-plan";

export { resolvePreviewProportionDecision } from "./preview-proportion-decision";

export { useImageSliderNavigation } from "./use-image-slider-navigation";
export { usePreviewCanvasRender } from "./use-preview-canvas-render";
export { usePreviewRenderConfig } from "./use-preview-render-config";
export { usePreviewSliderSlots } from "./use-preview-slider-slots";
export { useSliderSwipeNavigation } from "./use-slider-swipe-navigation";
