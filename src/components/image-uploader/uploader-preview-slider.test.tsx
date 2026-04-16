import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import UploaderPreviewSlider from "./uploader-preview-slider";
import type {
  SelectedImageItem,
  SelectedImageMetadata,
} from "./image-uploader";
import type { ImageDisplayProportion } from "./image-proportion-calculator";

vi.mock("./side-slot-preview", () => ({
  default: ({
    position,
    onSelectSlot,
    slotIndex,
  }: {
    position: string;
    onSelectSlot: (index: number) => void;
    slotIndex: number | null;
  }) => (
    <button
      type="button"
      data-testid={`mock-side-${position}`}
      onClick={() => {
        if (typeof slotIndex === "number") {
          onSelectSlot(slotIndex);
        }
      }}
    >
      {position}
    </button>
  ),
}));

vi.mock("./painting-preview-slot", () => ({
  default: ({
    swipeDisabled,
  }: {
    swipeDisabled?: boolean;
  }) => (
    <div
      data-testid="mock-painting-slot"
      data-swipe-disabled={swipeDisabled ? "true" : undefined}
    />
  ),
}));

const createItem = (name: string): SelectedImageItem => ({
  file: new File([name], `${name}.jpg`, { type: "image/jpeg" }),
  previewUrl: `blob:${name}`,
  metadata: null,
  displayImageProportion: "horizontal",
  autoSelectOptimalPending: false,
  previewEffects: { brightness: 0, contrast: 0 },
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
  canMovePrevious: true,
  canMoveNext: true,
  leftSlotIndex: 0,
  rightSlotIndex: 2,
  leftSlotImage: createItem("left"),
  rightSlotImage: createItem("right"),
  onSelectSlot: vi.fn(),
  onTouchStart: vi.fn(),
  onTouchEnd: vi.fn(),
  onMetadataResolved: vi.fn(),
});

describe("UploaderPreviewSlider", () => {
  it("renders side previews and center painting slot", () => {
    const props = createProps();

    render(<UploaderPreviewSlider {...props} />);

    expect(screen.getByTestId("uploader-preview-slider")).toBeInTheDocument();
    expect(screen.getByTestId("mock-side-left")).toBeInTheDocument();
    expect(screen.getByTestId("mock-painting-slot")).toBeInTheDocument();
    expect(screen.getByTestId("mock-side-right")).toBeInTheDocument();
  });

  it("forwards slot selection callbacks via side slots", () => {
    const props = createProps();

    render(<UploaderPreviewSlider {...props} />);

    fireEvent.click(screen.getByTestId("mock-side-left"));

    expect(props.onSelectSlot).toHaveBeenCalledWith(0);
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
});
