import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import PaintingPreviewSlot from "./painting-preview-slot";
import type {
  SelectedImageItem,
  SelectedImageMetadata,
} from "./image-uploader";
import type { ImageDisplayProportion } from "./image-proportion-calculator";
import * as proportionCalculator from "./image-proportion-calculator";
import * as previewCanvasUtils from "./preview-canvas-utils";

vi.mock("./preview-canvas-utils", () => ({
  loadImageElement: vi.fn(),
  resolveImageDimensions: vi.fn(),
  drawCroppedImageToCanvas: vi.fn(),
}));

const createImageItem = (name: string): SelectedImageItem => ({
  file: new File([name], `${name}.jpg`, { type: "image/jpeg" }),
  previewUrl: `blob:${name}`,
  metadata: null,
  displayImageProportion: "horizontal",
});

const createProps = () => ({
  selectedImage: createImageItem("selected"),
  activeSlotIndex: 1,
  selectedImageMetadata: null as SelectedImageMetadata | null,
  bestProportion: null as ImageDisplayProportion | null,
  userSelectedProportion: "horizontal" as ImageDisplayProportion,
  previewFrameAspectRatio: 16 / 9,
  hasMultipleImages: true,
  canMovePrevious: true,
  canMoveNext: true,
  onMovePrevious: vi.fn(),
  onMoveNext: vi.fn(),
  onRemoveImage: vi.fn(),
  onTouchStart: vi.fn(),
  onTouchEnd: vi.fn(),
  onMetadataResolved: vi.fn(),
});

describe("PaintingPreviewSlot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("auto-selects optimal proportion for first-time horizontal default", async () => {
    const props = createProps();
    const image = document.createElement("img");

    vi.spyOn(
      proportionCalculator,
      "getOptimalDisplayProportion",
    ).mockReturnValue("vertical");
    vi.mocked(previewCanvasUtils.loadImageElement).mockResolvedValue(image);
    vi.mocked(previewCanvasUtils.resolveImageDimensions).mockReturnValue({
      sourceWidth: 1200,
      sourceHeight: 800,
    });
    vi.mocked(previewCanvasUtils.drawCroppedImageToCanvas).mockReturnValue(
      true,
    );

    render(<PaintingPreviewSlot {...props} />);

    await waitFor(() => {
      expect(props.onMetadataResolved).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: {
            width: 1200,
            height: 800,
            aspectRatio: "3:2",
          },
          nextDisplayImageProportion: "vertical",
          shouldAutoSelectOptimalProportion: true,
        }),
      );
    });

    expect(previewCanvasUtils.drawCroppedImageToCanvas).toHaveBeenCalledTimes(
      1,
    );
  });

  it("keeps user selected proportion when metadata already exists", async () => {
    const props = {
      ...createProps(),
      selectedImageMetadata: {
        width: 1200,
        height: 800,
        aspectRatio: "3:2",
      },
      userSelectedProportion: "vertical" as ImageDisplayProportion,
      bestProportion: "horizontal" as ImageDisplayProportion,
    };
    const image = document.createElement("img");

    vi.mocked(previewCanvasUtils.loadImageElement).mockResolvedValue(image);
    vi.mocked(previewCanvasUtils.resolveImageDimensions).mockReturnValue({
      sourceWidth: 1200,
      sourceHeight: 800,
    });
    vi.mocked(previewCanvasUtils.drawCroppedImageToCanvas).mockReturnValue(
      true,
    );

    render(<PaintingPreviewSlot {...props} />);

    await waitFor(() => {
      expect(props.onMetadataResolved).toHaveBeenCalledWith(
        expect.objectContaining({
          nextDisplayImageProportion: "vertical",
          shouldAutoSelectOptimalProportion: false,
        }),
      );
    });
  });

  it("does not emit metadata if effect is cleaned up before image load resolves", async () => {
    const props = createProps();
    const image = document.createElement("img");

    let resolveLoad: (img: HTMLImageElement) => void = () => {};
    const deferred = new Promise<HTMLImageElement>((resolve) => {
      resolveLoad = resolve;
    });

    vi.mocked(previewCanvasUtils.loadImageElement).mockReturnValue(deferred);
    vi.mocked(previewCanvasUtils.resolveImageDimensions).mockReturnValue({
      sourceWidth: 1200,
      sourceHeight: 800,
    });

    const { rerender } = render(<PaintingPreviewSlot {...props} />);

    rerender(<PaintingPreviewSlot {...props} selectedImage={null} />);

    resolveLoad(image);

    await waitFor(() => {
      expect(previewCanvasUtils.loadImageElement).toHaveBeenCalledTimes(1);
    });

    expect(props.onMetadataResolved).not.toHaveBeenCalled();
    expect(previewCanvasUtils.drawCroppedImageToCanvas).not.toHaveBeenCalled();
  });

  it("renders remove button always and navigation arrows only when multiple images", () => {
    const props = {
      ...createProps(),
      hasMultipleImages: false,
    };

    render(<PaintingPreviewSlot {...props} />);

    expect(
      screen.getByTestId("uploader-remove-active-image"),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("uploader-slider-prev"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("uploader-slider-next"),
    ).not.toBeInTheDocument();
  });

  it("applies vertical fixed frame preset when vertical proportion is selected", () => {
    const props = {
      ...createProps(),
      userSelectedProportion: "vertical" as ImageDisplayProportion,
    };

    render(<PaintingPreviewSlot {...props} />);

    expect(screen.getByTestId("selected-image-preview-frame")).toHaveClass(
      "w-full",
      "max-w-[40rem]",
      "md:max-w-[48rem]",
    );
  });
});
