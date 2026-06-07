import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import UploaderPreviewSlider from "./uploader-preview-slider";
import type {
  SelectedImageItem,
  SelectedImageMetadata,
} from "./image-uploader";
import type { ImageDisplayProportion } from "./image-proportion-calculator";
import type { CropAdjust } from "./use-crop-adjust";

vi.mock("./painting-preview-slot", () => ({
  default: ({
    swipeDisabled,
    isEditMode,
    previewCropAdjust,
    onCropAdjustChange,
  }: {
    swipeDisabled?: boolean;
    isEditMode?: boolean;
    previewCropAdjust?: CropAdjust;
    onCropAdjustChange?: (adjust: CropAdjust | undefined) => void;
  }) => (
    <div
      data-testid="mock-painting-slot"
      data-swipe-disabled={swipeDisabled ? "true" : undefined}
      data-is-edit-mode={isEditMode ? "true" : undefined}
      data-crop-adjust={previewCropAdjust ? JSON.stringify(previewCropAdjust) : undefined}
      data-has-crop-adjust-callback={onCropAdjustChange ? "true" : undefined}
    />
  ),
}));

vi.mock("./painting-size-helper-overlay", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-painting-size-overlay">{children}</div>
  ),
}));

const createItem = (name: string): SelectedImageItem => ({
  file: new File([name], `${name}.jpg`, { type: "image/jpeg" }),
  previewUrl: `blob:${name}`,
  metadata: null,
  displayImageProportion: "horizontal",
  autoSelectOptimalPending: false,
  previewEffects: { brightness: 0, contrast: 0, grayscale: 0 },
  previewTransform: { rotation: 0, flipHorizontal: false, flipVertical: false },
});

const metadata: SelectedImageMetadata = {
  width: 1200,
  height: 800,
  aspectRatio: "3:2",
};

const createProps = () => ({
  activeImage: createItem("center"),
  activeImageIndex: 1,
  selectedImageMetadata: metadata,
  bestProportion: "horizontal" as ImageDisplayProportion,
  userSelectedProportion: "horizontal" as ImageDisplayProportion,
  previewFrameAspectRatio: 16 / 9,
  onTouchStart: vi.fn(),
  onTouchEnd: vi.fn(),
  onMetadataResolved: vi.fn(),
});

describe("UploaderPreviewSlider", () => {
  it("renders painting size overlay with painting slot", () => {
    const props = createProps();

    render(<UploaderPreviewSlider {...props} />);

    expect(screen.getByTestId("uploader-preview-slider")).toBeInTheDocument();
    expect(screen.getByTestId("mock-painting-size-overlay")).toBeInTheDocument();
    expect(screen.getByTestId("mock-painting-slot")).toBeInTheDocument();
  });

  it("passes swipeDisabled to painting preview slot", () => {
    const props = createProps();

    render(<UploaderPreviewSlider {...props} swipeDisabled={true} />);

    expect(screen.getByTestId("mock-painting-slot")).toHaveAttribute(
      "data-swipe-disabled",
      "true",
    );
  });

  it("does not set swipe-disabled attribute when swipeDisabled is false", () => {
    const props = createProps();

    render(<UploaderPreviewSlider {...props} swipeDisabled={false} />);

    expect(screen.getByTestId("mock-painting-slot")).not.toHaveAttribute(
      "data-swipe-disabled",
    );
  });

  it("passes isEditMode to painting preview slot", () => {
    const props = createProps();

    render(<UploaderPreviewSlider {...props} isEditMode={true} />);

    expect(screen.getByTestId("mock-painting-slot")).toHaveAttribute(
      "data-is-edit-mode",
      "true",
    );
  });

  it("does not set is-edit-mode attribute when isEditMode is false", () => {
    const props = createProps();

    render(<UploaderPreviewSlider {...props} isEditMode={false} />);

    expect(screen.getByTestId("mock-painting-slot")).not.toHaveAttribute(
      "data-is-edit-mode",
    );
  });

  it("passes previewCropAdjust to painting preview slot", () => {
    const props = createProps();
    const cropAdjust: CropAdjust = { zoom: 2, panX: 0.5, panY: -0.3 };

    render(
      <UploaderPreviewSlider
        {...props}
        previewCropAdjust={cropAdjust}
        onCropAdjustChange={vi.fn()}
      />,
    );

    const slot = screen.getByTestId("mock-painting-slot");
    expect(slot).toHaveAttribute(
      "data-crop-adjust",
      JSON.stringify(cropAdjust),
    );
  });

  it("does not set crop-adjust attribute when previewCropAdjust is undefined", () => {
    const props = createProps();

    render(<UploaderPreviewSlider {...props} />);

    expect(screen.getByTestId("mock-painting-slot")).not.toHaveAttribute(
      "data-crop-adjust",
    );
  });

  it("passes onCropAdjustChange callback to painting preview slot", () => {
    const props = createProps();
    const onCropAdjustChange = vi.fn();

    render(
      <UploaderPreviewSlider
        {...props}
        onCropAdjustChange={onCropAdjustChange}
      />,
    );

    expect(screen.getByTestId("mock-painting-slot")).toHaveAttribute(
      "data-has-crop-adjust-callback",
      "true",
    );
  });

  it("does not set crop-adjust-callback when onCropAdjustChange is undefined", () => {
    const props = createProps();

    render(<UploaderPreviewSlider {...props} />);

    expect(screen.getByTestId("mock-painting-slot")).not.toHaveAttribute(
      "data-has-crop-adjust-callback",
    );
  });
});
