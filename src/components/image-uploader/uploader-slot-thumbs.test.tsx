import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import UploaderSlotSwitcher from "./uploader-slot-switcher";
import type { SelectedImageItem } from "./image-uploader";

const createItem = (name: string): SelectedImageItem => ({
  file: new File([name], `${name}.jpg`, { type: "image/jpeg" }),
  previewUrl: `blob:${name}`,
  metadata: null,
  displayImageProportion: "horizontal",
  autoSelectOptimalPending: false,
  previewEffects: { brightness: 0, contrast: 0, grayscale: 0 },
  previewTransform: { rotation: 0, flipHorizontal: false, flipVertical: false },
});

const renderThumbs = (overrides: {
  slots?: Array<SelectedImageItem | null>;
  activeSlotIndex?: number | null;
  onSelectSlot?: (index: number) => void;
  getSlotPreviewUrl?: (image: SelectedImageItem) => string;
  hidden?: boolean;
} = {}) => {
  const slots = overrides.slots ?? [createItem("a"), createItem("b"), null];

  return render(
    <UploaderSlotSwitcher
      testIdPrefix="uploader-slot-thumb"
      slots={slots}
      activeSlotIndex={overrides.activeSlotIndex ?? 0}
      onSelectSlot={overrides.onSelectSlot ?? vi.fn()}
      getSlotPreviewUrl={overrides.getSlotPreviewUrl}
      hidden={overrides.hidden}
    />,
  );
};

describe("UploaderSlotSwitcher thumbnail strip", () => {
  it("renders one tile per slot under the thumb test id prefix", () => {
    renderThumbs();

    expect(screen.getByTestId("uploader-slot-thumb-dots")).toBeInTheDocument();
    expect(screen.getByTestId("uploader-slot-thumb-dot-0")).toBeInTheDocument();
    expect(screen.getByTestId("uploader-slot-thumb-dot-1")).toBeInTheDocument();
    expect(screen.getByTestId("uploader-slot-thumb-dot-2")).toBeInTheDocument();
  });

  it("renders a preview surface for filled slots and an add icon for empty slots", () => {
    renderThumbs();

    expect(
      screen.getByTestId("uploader-slot-thumb-dot-0").querySelector("canvas"),
    ).not.toBeNull();
    expect(
      screen.getByTestId("uploader-slot-thumb-dot-2").querySelector("canvas"),
    ).toBeNull();
    expect(
      screen.getByTestId("uploader-slot-thumb-dot-2").querySelector("svg"),
    ).not.toBeNull();
  });

  it("resolves filled tile urls through getSlotPreviewUrl", () => {
    const getSlotPreviewUrl = vi.fn((image: SelectedImageItem) =>
      `transformed:${image.previewUrl}`,
    );

    renderThumbs({ getSlotPreviewUrl });

    expect(getSlotPreviewUrl).toHaveBeenCalledWith(
      expect.objectContaining({ previewUrl: "blob:a" }),
    );
    expect(
      screen.getByTestId("uploader-slot-thumb-canvas-0"),
    ).toBeInTheDocument();
  });

  it("marks the active slot tile as aria-pressed and highlights it", () => {
    renderThumbs({ slots: [createItem("a"), createItem("b"), createItem("c")], activeSlotIndex: 1 });

    expect(screen.getByTestId("uploader-slot-thumb-dot-0")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByTestId("uploader-slot-thumb-dot-1")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByTestId("uploader-slot-thumb-dot-1").className).toContain(
      "ring-2",
    );
  });

  it("calls onSelectSlot with the clicked index", () => {
    const onSelectSlot = vi.fn();

    renderThumbs({ onSelectSlot });

    fireEvent.click(screen.getByTestId("uploader-slot-thumb-dot-2"));

    expect(onSelectSlot).toHaveBeenCalledWith(2);
  });

  it("hides the strip when the hidden prop is true", () => {
    renderThumbs({ hidden: true });

    expect(screen.getByTestId("uploader-slot-thumb-dots")).toHaveAttribute(
      "hidden",
    );
  });
});
