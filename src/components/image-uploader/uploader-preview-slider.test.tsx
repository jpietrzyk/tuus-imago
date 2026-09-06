import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import UploaderPreviewSlider, {
  PREVIEW_SLIDER_BOTTOM_RESERVE_PX,
} from "./uploader-preview-slider";
import { computeSidePanelCrop } from "./side-panel-crop";
import type {
  SelectedImageItem,
  SelectedImageMetadata,
} from "./image-uploader";
import type { ImageDisplayProportion } from "./image-proportion-calculator";
import type { CropAdjust } from "./use-crop-adjust";

const canvasDrawMock = vi.hoisted(() => vi.fn(() => true));
const loadImageElementMock = vi.hoisted(() =>
  vi.fn(() =>
    Promise.resolve({
      naturalWidth: 1000,
      naturalHeight: 1000,
    } as HTMLImageElement),
  ),
);

vi.mock("./preview-canvas-utils", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  loadImageElement: loadImageElementMock,
  drawCroppedImageToCanvas: canvasDrawMock,
}));

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
  default: ({
    children,
    bottomReservePx,
  }: {
    children: React.ReactNode;
    bottomReservePx?: number;
  }) => (
    <div
      data-testid="mock-painting-size-overlay"
      data-bottom-reserve={
        bottomReservePx !== undefined ? String(bottomReservePx) : undefined
      }
    >
      {children}
    </div>
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
  previewFrameAspectRatio: 3 / 2,
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

  it("renders single-slot layout when not in desktop triptych mode", () => {
    const props = createProps();

    render(<UploaderPreviewSlider {...props} isDesktopTriptych={false} />);

    expect(screen.getByTestId("uploader-preview-slider")).not.toHaveAttribute(
      "data-triptych-layout",
    );
  });

  it("renders all three slots side-by-side in desktop triptych mode", () => {
    const props = createProps();
    const slots: Array<SelectedImageItem | null> = [
      createItem("left"),
      createItem("center"),
      createItem("right"),
    ];

    render(
      <UploaderPreviewSlider
        {...props}
        slots={slots}
        onSelectSlot={vi.fn()}
        getSlotPreviewUrl={(image) => image.previewUrl}
        isDesktopTriptych={true}
      />,
    );

    const slider = screen.getByTestId("uploader-preview-slider");
    expect(slider).toHaveAttribute("data-triptych-layout", "desktop");
    expect(screen.getByTestId("mock-painting-slot")).toBeInTheDocument();
    expect(
      screen.getByTestId("triptych-side-panel-0"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("triptych-side-panel-2"),
    ).toBeInTheDocument();
  });

  it("places the active slot at its positional column", () => {
    const props = { ...createProps(), activeImageIndex: 0 };
    const slots: Array<SelectedImageItem | null> = [
      createItem("left"),
      createItem("center"),
      createItem("right"),
    ];

    render(
      <UploaderPreviewSlider
        {...props}
        slots={slots}
        onSelectSlot={vi.fn()}
        getSlotPreviewUrl={(image) => image.previewUrl}
        isDesktopTriptych={true}
      />,
    );

    expect(screen.getByTestId("mock-painting-slot")).toBeInTheDocument();
    expect(
      screen.getByTestId("triptych-side-panel-1"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("triptych-side-panel-2"),
    ).toBeInTheDocument();
  });

  it("ignores desktop triptych when slots are not provided", () => {
    const props = createProps();

    render(
      <UploaderPreviewSlider
        {...props}
        onSelectSlot={vi.fn()}
        isDesktopTriptych={true}
      />,
    );

    expect(screen.getByTestId("uploader-preview-slider")).not.toHaveAttribute(
      "data-triptych-layout",
    );
  });

  it("scales panel content to 100% at the largest size so panels touch", () => {
    const props = createProps();
    const slots: Array<SelectedImageItem | null> = [
      createItem("left"),
      createItem("center"),
      createItem("right"),
    ];

    render(
      <UploaderPreviewSlider
        {...props}
        slots={slots}
        onSelectSlot={vi.fn()}
        getSlotPreviewUrl={(image) => image.previewUrl}
        isDesktopTriptych={true}
        selectedPaintingSize={5}
      />,
    );

    const contents = screen.getAllByTestId("triptych-panel-content");
    for (const content of contents) {
      expect(content).toHaveStyle({ width: "100%", height: "100%" });
    }
  });

  it("scales panel content below 100% for smaller sizes (no overflow)", () => {
    const props = createProps();
    const slots: Array<SelectedImageItem | null> = [
      createItem("left"),
      createItem("center"),
      createItem("right"),
    ];

    render(
      <UploaderPreviewSlider
        {...props}
        slots={slots}
        onSelectSlot={vi.fn()}
        getSlotPreviewUrl={(image) => image.previewUrl}
        isDesktopTriptych={true}
        selectedPaintingSize={2}
      />,
    );

    // Index 2 scale (1.0) relative to the largest (2.0) = 50%.
    const contents = screen.getAllByTestId("triptych-panel-content");
    for (const content of contents) {
      expect(content).toHaveStyle({ width: "50%", height: "50%" });
    }
  });

  it("mirrors the slot zoom/pan onto the side panel canvas crop", async () => {
    const props = createProps();
    const left = createItem("left");
    left.metadata = { width: 1000, height: 1000, aspectRatio: "1:1" };
    left.displayImageProportion = "square";
    left.previewCropAdjust = { zoom: 2, panX: 0.5, panY: 0 };
    const slots: Array<SelectedImageItem | null> = [
      left,
      createItem("center"),
      createItem("right"),
    ];

    render(
      <UploaderPreviewSlider
        {...props}
        slots={slots}
        onSelectSlot={vi.fn()}
        getSlotPreviewUrl={(image) => image.previewUrl}
        isDesktopTriptych={true}
      />,
    );

    // Local previews render through a canvas, not an oversized <img>.
    const sideCanvas = screen
      .getByTestId("triptych-side-panel-0")
      .querySelector("canvas");
    expect(sideCanvas).not.toBeNull();

    // The drawn crop is the zoom/pan-adjusted centered crop.
    await waitFor(() => {
      expect(canvasDrawMock).toHaveBeenCalledWith(
        expect.objectContaining({
          crop: expect.objectContaining({
            cropX: 375,
            cropY: 250,
            cropWidth: 500,
            cropHeight: 500,
          }),
        }),
      );
    });
  });

  it("draws the overflowing vertical crop so panning reveals masked edges (triptych)", () => {
    const left = createItem("left");
    left.metadata = { width: 333, height: 1000, aspectRatio: "333:1000" };
    left.displayImageProportion = "vertical";
    left.previewCropAdjust = { zoom: 1, panX: 0, panY: -0.5 };

    // The source is taller than the portrait frame: the adjusted crop is the
    // centered 2:3 window shifted up by half the vertical overflow.
    const crop = computeSidePanelCrop(left, left.metadata);
    expect(crop).not.toBeNull();
    expect(crop?.cropWidth).toBeCloseTo(333, 0);
    expect(crop?.cropHeight).toBeCloseTo(499.5, 0);
    expect(crop?.cropY).toBeCloseTo(125.125, 2);
  });

  it("renders seamless contiguous window crops for a wide-panorama triptych (no gaps)", async () => {
    const props = createProps();
    // 3:1 panorama; each window is 2/3 * 1000 = 666.67 wide, 3 windows = 2000
    // (1000px of panorama scroll left over).
    const pano = { width: 3000, height: 1000, aspectRatio: "3:1" };
    const makeWindow = (windowIndex: number): SelectedImageItem => ({
      ...createItem(`w${windowIndex}`),
      metadata: pano,
      displayImageProportion: "vertical",
      triptychWindowIndex: windowIndex,
      previewCropAdjust: { zoom: 1, panX: 0, panY: 0 },
    });
    const slots: Array<SelectedImageItem | null> = [
      makeWindow(0),
      makeWindow(1),
      makeWindow(2),
    ];

    render(
      <UploaderPreviewSlider
        {...props}
        slots={slots}
        onSelectSlot={vi.fn()}
        getSlotPreviewUrl={(image) => image.previewUrl}
        isDesktopTriptych={true}
      />,
    );

    for (const idx of [0, 2] as const) {
      expect(
        screen
          .getByTestId(`triptych-side-panel-${idx}`)
          .querySelector("canvas"),
      ).not.toBeNull();
    }

    // Windows are contiguous source crops: panel N's right edge is panel
    // N+1's left edge, and the band is centered (window 0 at x=500).
    const [crop0, crop1, crop2] = [0, 1, 2].map((i) =>
      computeSidePanelCrop(slots[i]!, pano),
    );
    expect(crop0).not.toBeNull();
    expect(crop1).not.toBeNull();
    expect(crop2).not.toBeNull();
    expect(crop0!.cropX).toBeCloseTo(500, 0);
    expect(crop0!.cropX + crop0!.cropWidth).toBeCloseTo(crop1!.cropX, 4);
    expect(crop1!.cropX + crop1!.cropWidth).toBeCloseTo(crop2!.cropX, 4);
    expect(crop2!.cropX + crop2!.cropWidth).toBeCloseTo(2500, 0);

    // The drawn canvas crop for the left panel matches window 0.
    await waitFor(() => {
      expect(canvasDrawMock).toHaveBeenCalledWith(
        expect.objectContaining({
          crop: expect.objectContaining({
            cropX: crop0!.cropX,
            cropWidth: crop0!.cropWidth,
          }),
        }),
      );
    });
  });

  it("passes the slot rotation into the side panel canvas draw", async () => {
    const props = createProps();
    const left = createItem("left");
    left.metadata = { width: 1000, height: 1000, aspectRatio: "1:1" };
    left.previewTransform = {
      rotation: 90,
      flipHorizontal: false,
      flipVertical: false,
    };
    const slots: Array<SelectedImageItem | null> = [
      left,
      createItem("center"),
      createItem("right"),
    ];

    render(
      <UploaderPreviewSlider
        {...props}
        slots={slots}
        onSelectSlot={vi.fn()}
        getSlotPreviewUrl={(image) => image.previewUrl}
        isDesktopTriptych={true}
      />,
    );

    await waitFor(() => {
      expect(canvasDrawMock).toHaveBeenCalledWith(
        expect.objectContaining({
          transform: {
            rotation: 90,
            flipHorizontal: false,
            flipVertical: false,
          },
        }),
      );
    });
  });

  it("caps the slider max height and top-aligns the desktop triptych row", () => {
    const props = createProps();
    const slots: Array<SelectedImageItem | null> = [
      createItem("left"),
      createItem("center"),
      createItem("right"),
    ];

    render(
      <UploaderPreviewSlider
        {...props}
        slots={slots}
        onSelectSlot={vi.fn()}
        getSlotPreviewUrl={(image) => image.previewUrl}
        isDesktopTriptych={true}
      />,
    );

    expect(screen.getByTestId("uploader-preview-slider")).toHaveClass(
      "items-start",
    );
  });

  it("passes the bottom reserve to the single-slot painting size overlay", () => {
    const props = createProps();

    render(<UploaderPreviewSlider {...props} />);

    expect(screen.getByTestId("mock-painting-size-overlay")).toHaveAttribute(
      "data-bottom-reserve",
      String(PREVIEW_SLIDER_BOTTOM_RESERVE_PX),
    );
  });

  it("marks side panels with the linked state", () => {
    const props = createProps();
    const slots: Array<SelectedImageItem | null> = [
      createItem("left"),
      createItem("center"),
      createItem("right"),
    ];

    const { rerender } = render(
      <UploaderPreviewSlider
        {...props}
        slots={slots}
        onSelectSlot={vi.fn()}
        getSlotPreviewUrl={(image) => image.previewUrl}
        isDesktopTriptych={true}
        isTriptychLinked={true}
      />,
    );

    expect(screen.getByTestId("triptych-side-panel-0")).toHaveAttribute(
      "data-triptych-linked",
      "true",
    );

    rerender(
      <UploaderPreviewSlider
        {...props}
        slots={slots}
        onSelectSlot={vi.fn()}
        getSlotPreviewUrl={(image) => image.previewUrl}
        isDesktopTriptych={true}
        isTriptychLinked={false}
      />,
    );

    expect(screen.getByTestId("triptych-side-panel-0")).not.toHaveAttribute(
      "data-triptych-linked",
    );
  });

  it("renders the swipe nav hint only in the single-preview slider", () => {
    const props = createProps();
    const slots: Array<SelectedImageItem | null> = [
      createItem("left"),
      createItem("center"),
      createItem("right"),
    ];
    const swipeNav = {
      hasPrevious: true,
      hasNext: true,
      onPrevious: vi.fn(),
      onNext: vi.fn(),
      showHint: true,
    };

    const { rerender } = render(
      <UploaderPreviewSlider {...props} swipeNav={swipeNav} />,
    );
    expect(
      screen.getByTestId("uploader-swipe-nav-hint"),
    ).toBeInTheDocument();

    rerender(
      <UploaderPreviewSlider
        {...props}
        slots={slots}
        onSelectSlot={vi.fn()}
        getSlotPreviewUrl={(image) => image.previewUrl}
        isDesktopTriptych={true}
        swipeNav={swipeNav}
      />,
    );
    expect(
      screen.queryByTestId("uploader-swipe-nav-hint"),
    ).not.toBeInTheDocument();
  });

  it("renders no swipe nav hint by default", () => {
    const props = createProps();

    render(<UploaderPreviewSlider {...props} />);

    expect(
      screen.queryByTestId("uploader-swipe-nav-hint"),
    ).not.toBeInTheDocument();
  });
});
