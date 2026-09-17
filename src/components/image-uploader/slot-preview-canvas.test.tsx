import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import SlotPreviewCanvas from "./slot-preview-canvas";
import * as previewCanvasUtils from "./preview-canvas-utils";
import { computeSidePanelCrop } from "./side-panel-crop";
import type { SelectedImageItem } from "./image-uploader";

vi.mock("./preview-canvas-utils", () => ({
  loadImageElement: vi.fn(),
  resolveImageDimensions: vi.fn(),
  drawCroppedImageToCanvas: vi.fn(),
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

describe("SlotPreviewCanvas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("draws a local slot through a canvas using its committed crop", async () => {
    const image = createItem("left");
    image.metadata = { width: 1200, height: 800, aspectRatio: "3:2" };
    image.displayImageProportion = "vertical";
    image.previewCropAdjust = { zoom: 2, panX: 0.2, panY: 0 };

    const imageEl = document.createElement("img");
    vi.mocked(previewCanvasUtils.loadImageElement).mockResolvedValue(imageEl);
    vi.mocked(previewCanvasUtils.drawCroppedImageToCanvas).mockReturnValue(true);

    render(
      <SlotPreviewCanvas
        image={image}
        previewUrl="blob:cropped-left"
        useCloudPreview={false}
        testId="slot-preview-canvas"
        debugLabel="test-canvas"
      />,
    );

    const canvas = screen.getByTestId("slot-preview-canvas");
    const expectedCrop = computeSidePanelCrop(image, image.metadata);
    expect(expectedCrop).not.toBeNull();

    await waitFor(() => {
      expect(previewCanvasUtils.drawCroppedImageToCanvas).toHaveBeenCalledWith(
        expect.objectContaining({
          canvas,
          crop: expect.objectContaining({
            cropX: expectedCrop!.cropX,
            cropY: expectedCrop!.cropY,
            cropWidth: expectedCrop!.cropWidth,
            cropHeight: expectedCrop!.cropHeight,
          }),
        }),
      );
    });
  });

  it("renders a plain image for cloud-backed previews without drawing", () => {
    const image = createItem("right");
    image.uploadedAsset = {
      publicId: "demo/right",
      secureUrl: "https://res.cloudinary.com/demo/image/upload/v1/right.jpg",
      sourceFingerprint: "fingerprint",
    };

    const { container } = render(
      <SlotPreviewCanvas
        image={image}
        previewUrl="https://res.cloudinary.com/demo/image/upload/v1/right.jpg"
        useCloudPreview
        testId="slot-preview-canvas"
      />,
    );

    const img = container.querySelector("img");
    expect(img).toHaveAttribute(
      "src",
      "https://res.cloudinary.com/demo/image/upload/v1/right.jpg",
    );
    expect(screen.queryByTestId("slot-preview-canvas")).toBeNull();
    expect(
      previewCanvasUtils.drawCroppedImageToCanvas,
    ).not.toHaveBeenCalled();
  });
});
