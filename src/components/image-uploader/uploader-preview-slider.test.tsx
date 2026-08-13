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

  it("mirrors the slot zoom/pan onto the side panel image sizing", () => {
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

    const sideImg = screen
      .getByTestId("triptych-side-panel-0")
      .querySelector("img");

    expect(sideImg).not.toBeNull();
    const style = sideImg?.getAttribute("style") ?? "";
    // Zoom is expressed as the image growing beyond the frame (200% at zoom 2)
    // rather than a transform scale, so the frame is always fully covered.
    expect(style).toMatch(/width:\s*200%/);
    expect(style).toMatch(/height:\s*200%/);
    // Pan shifts the image within the fixed clip window (no translate).
    expect(style).not.toMatch(/translate\(/);
    expect(style).toMatch(/left:\s*-75%/);
  });

  it("sizes the side panel image to overflow the frame so panning reveals edges (triptych)", () => {
    const props = createProps();
    const left = createItem("left");
    left.metadata = { width: 333, height: 1000, aspectRatio: "333:1000" };
    left.displayImageProportion = "vertical";
    left.previewCropAdjust = { zoom: 1, panX: 0, panY: -0.5 };
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

    const sideImg = screen
      .getByTestId("triptych-side-panel-0")
      .querySelector("img");

    expect(sideImg).not.toBeNull();
    const style = sideImg?.getAttribute("style") ?? "";
    // The source is taller than the portrait frame, so the image overflows
    // vertically (height ~200%) and is shifted up to reveal the masked edge.
    expect(style).toMatch(/height:\s*200\.\d+%/);
    expect(style).toMatch(/width:\s*100%/);
    // Panning repositions the overflowing image — never a translate (which
    // would drag the clip box and leave the frame blank).
    expect(style).not.toMatch(/translate\(/);
    expect(style).toMatch(/top:\s*-25\.\d+%/);
  });

  it("renders seamless contiguous windows for a wide-panorama triptych (no gaps)", () => {
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

    // Windows 0 and 2 are side panels; window 1 is the (mocked) center.
    const parse = (style: string, prop: string) =>
      parseFloat(
        (style.match(new RegExp(`${prop}:\\s*(-?[\\d.]+)%`)) || [])[1] ?? "0",
      );

    for (const idx of [0, 2] as const) {
      const img = screen
        .getByTestId(`triptych-side-panel-${idx}`)
        .querySelector("img");
      const style = img?.getAttribute("style") ?? "";
      const w = parse(style, "width");
      const l = parse(style, "left");
      // The <img> always covers the frame — never a gap, even at the pan edges.
      expect(l).toBeLessThanOrEqual(0);
      expect(l + w).toBeGreaterThanOrEqual(100);
      // No translate (the image is sized, not transformed, to fill the frame).
      expect(style).not.toMatch(/translate\(/);
    }

    // Window 0 starts at panorama x=500 (centered band), window 2 at x=1833:
    // the band is centered so 500px of panorama sits on each side.
    const left0 = parse(
      screen.getByTestId("triptych-side-panel-0").querySelector("img")?.getAttribute("style") ?? "",
      "left",
    );
    const width0 = parse(
      screen.getByTestId("triptych-side-panel-0").querySelector("img")?.getAttribute("style") ?? "",
      "width",
    );
    // cropX / cropWidth = 500 / 666.67 -> left = -75%.
    expect(left0).toBeCloseTo(-75, 0);
    // sourceWidth / cropWidth = 3000 / 666.67 -> width = 450%.
    expect(width0).toBeCloseTo(450, 0);
  });

  it("mirrors the slot rotation onto the side panel image transform", () => {
    const props = createProps();
    const left = createItem("left");
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

    const sideImg = screen
      .getByTestId("triptych-side-panel-0")
      .querySelector("img");

    expect(sideImg?.getAttribute("style") ?? "").toMatch(/rotate\(90deg\)/);
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
});
