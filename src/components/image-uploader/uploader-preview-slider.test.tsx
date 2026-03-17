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
    onMovePrevious,
    onMoveNext,
    onRemoveImage,
  }: {
    onMovePrevious: () => void;
    onMoveNext: () => void;
    onRemoveImage: () => void;
  }) => (
    <div data-testid="mock-painting-slot">
      <button type="button" data-testid="mock-prev" onClick={onMovePrevious}>
        prev
      </button>
      <button type="button" data-testid="mock-next" onClick={onMoveNext}>
        next
      </button>
      <button type="button" data-testid="mock-remove" onClick={onRemoveImage}>
        remove
      </button>
    </div>
  ),
}));

const createItem = (name: string): SelectedImageItem => ({
  file: new File([name], `${name}.jpg`, { type: "image/jpeg" }),
  previewUrl: `blob:${name}`,
  metadata: null,
  displayImageProportion: "horizontal",
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
  hasMultipleImages: true,
  canMovePrevious: true,
  canMoveNext: true,
  leftSlotIndex: 0,
  rightSlotIndex: 2,
  leftSlotImage: createItem("left"),
  rightSlotImage: createItem("right"),
  onSelectSlot: vi.fn(),
  onMovePrevious: vi.fn(),
  onMoveNext: vi.fn(),
  onRemoveActiveImage: vi.fn(),
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

  it("forwards interaction callbacks to composed children", () => {
    const props = createProps();

    render(<UploaderPreviewSlider {...props} />);

    fireEvent.click(screen.getByTestId("mock-side-left"));
    fireEvent.click(screen.getByTestId("mock-prev"));
    fireEvent.click(screen.getByTestId("mock-next"));
    fireEvent.click(screen.getByTestId("mock-remove"));

    expect(props.onSelectSlot).toHaveBeenCalledWith(0);
    expect(props.onMovePrevious).toHaveBeenCalledTimes(1);
    expect(props.onMoveNext).toHaveBeenCalledTimes(1);
    expect(props.onRemoveActiveImage).toHaveBeenCalledTimes(1);
  });
});
