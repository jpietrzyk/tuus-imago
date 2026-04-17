import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import PaintingPreviewSlot from "./painting-preview-slot";
import type {
  SelectedImageItem,
  SelectedImageMetadata,
} from "./image-uploader";
import type { ImageDisplayProportion } from "./image-proportion-calculator";
import type { CropAdjust } from "./use-crop-adjust";
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
  autoSelectOptimalPending: true,
  previewEffects: { brightness: 0, contrast: 0 },
});

const createProps = () => ({
  selectedImage: createImageItem("selected"),
  activeSlotIndex: 1,
  selectedImageMetadata: null as SelectedImageMetadata | null,
  bestProportion: null as ImageDisplayProportion | null,
  userSelectedProportion: "horizontal" as ImageDisplayProportion,
  previewFrameAspectRatio: 16 / 9,
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

  it("skips local canvas effects when cloud preview is enabled", async () => {
    const props = {
      ...createProps(),
      selectedImage: {
        ...createImageItem("selected"),
        previewEffects: { brightness: 35, contrast: -20 },
      },
      useCloudPreview: true,
      previewUrl:
        "https://res.cloudinary.com/demo/image/upload/e_brightness:35,e_contrast:-20/sample.jpg",
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
      expect(previewCanvasUtils.drawCroppedImageToCanvas).toHaveBeenCalledWith(
        expect.objectContaining({ effects: null }),
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

  it("does not render clear or navigation controls inside painting slot", () => {
    render(<PaintingPreviewSlot {...createProps()} />);

    expect(
      screen.queryByTestId("uploader-remove-active-image"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("uploader-slider-prev"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("uploader-slider-next"),
    ).not.toBeInTheDocument();
  });

  it("renders remove button when onClearSlot is provided and image is present", () => {
    render(<PaintingPreviewSlot {...createProps()} onClearSlot={vi.fn()} />);

    expect(
      screen.getByTestId("uploader-remove-active-image"),
    ).toBeInTheDocument();
  });

  it("hides remove button when isEditMode is true", () => {
    render(
      <PaintingPreviewSlot
        {...createProps()}
        onClearSlot={vi.fn()}
        isEditMode={true}
      />,
    );

    expect(
      screen.queryByTestId("uploader-remove-active-image"),
    ).not.toBeInTheDocument();
  });

  it("shows remove button when isEditMode is false", () => {
    render(
      <PaintingPreviewSlot
        {...createProps()}
        onClearSlot={vi.fn()}
        isEditMode={false}
      />,
    );

    expect(
      screen.getByTestId("uploader-remove-active-image"),
    ).toBeInTheDocument();
  });

  it("hides remove button when isEditMode is true even without explicit onClearSlot", () => {
    render(
      <PaintingPreviewSlot {...createProps()} isEditMode={true} />,
    );

    expect(
      screen.queryByTestId("uploader-remove-active-image"),
    ).not.toBeInTheDocument();
  });

  it("renders placeholder when active center slot has no image", () => {
    render(<PaintingPreviewSlot {...createProps()} selectedImage={null} />);

    expect(
      screen.getByTestId("selected-image-preview-placeholder"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "Preview" })).toBeNull();
  });

  it("applies vertical frame aspect when vertical proportion is selected", () => {
    const props = {
      ...createProps(),
      userSelectedProportion: "vertical" as ImageDisplayProportion,
    };

    render(<PaintingPreviewSlot {...props} />);

    const frame = screen.getByTestId("selected-image-preview-frame");
    expect(frame).toHaveClass("aspect-[2/3]");
    expect(frame).toHaveClass("h-full");
    expect(frame).toHaveClass("max-w-full");
  });

  it.each([
    {
      proportion: "horizontal" as ImageDisplayProportion,
      aspectClass: "aspect-[16/9]",
    },
    {
      proportion: "square" as ImageDisplayProportion,
      aspectClass: "aspect-square",
    },
  ])(
    "applies stable frame aspect class for $proportion proportion",
    ({ proportion, aspectClass }) => {
      const props = {
        ...createProps(),
        userSelectedProportion: proportion,
      };

      render(<PaintingPreviewSlot {...props} />);

      expect(screen.getByTestId("selected-image-preview-frame")).toHaveClass(
        aspectClass,
      );
    },
  );

  it("passes previewCropAdjust to canvas render pipeline", async () => {
    const props = {
      ...createProps(),
      selectedImageMetadata: {
        width: 1200,
        height: 800,
        aspectRatio: "3:2",
      },
      previewCropAdjust: { zoom: 2, panX: 0, panY: 0 } as CropAdjust,
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
      expect(previewCanvasUtils.drawCroppedImageToCanvas).toHaveBeenCalledWith(
        expect.objectContaining({
          crop: expect.objectContaining({
            cropWidth: expect.any(Number),
          }),
        }),
      );
    });

    const drawCall = vi.mocked(previewCanvasUtils.drawCroppedImageToCanvas).mock
      .calls[0][0] as { crop: { cropWidth: number; cropHeight: number } };
    expect(drawCall.crop.cropWidth).toBeLessThan(1200);
    expect(drawCall.crop.cropHeight).toBeLessThan(800);
  });

  it("applies grab cursor when isEditMode is true", () => {
    render(
      <PaintingPreviewSlot {...createProps()} isEditMode={true} />,
    );

    const canvas = screen.getByTestId("selected-image-preview-canvas");
    expect(canvas.style.cursor).toBe("grab");
  });

  it("does not apply grab cursor when isEditMode is false", () => {
    render(
      <PaintingPreviewSlot {...createProps()} isEditMode={false} />,
    );

    const canvas = screen.getByTestId("selected-image-preview-canvas");
    expect(canvas.style.cursor).not.toBe("grab");
  });

  it("renders canvas without crop adjust when previewCropAdjust is undefined", async () => {
    const props = {
      ...createProps(),
      selectedImageMetadata: {
        width: 1200,
        height: 800,
        aspectRatio: "3:2",
      },
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
      expect(previewCanvasUtils.drawCroppedImageToCanvas).toHaveBeenCalled();
    });

    const drawCall = vi.mocked(previewCanvasUtils.drawCroppedImageToCanvas).mock
      .calls[0][0] as { crop: { cropWidth: number } };
    expect(drawCall.crop.cropWidth).toBe(1200);
  });
});
