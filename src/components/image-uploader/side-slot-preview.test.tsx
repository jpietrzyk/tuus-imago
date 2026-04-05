import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import SideSlotPreview from "./side-slot-preview";
import { t } from "@/locales/i18n";
import type { SelectedImageItem } from "./image-uploader";
import type { ImageDisplayProportion } from "./image-proportion-calculator";

const createImageItem = (name: string): SelectedImageItem => ({
  file: new File([name], `${name}.jpg`, { type: "image/jpeg" }),
  previewUrl: `blob:${name}`,
  metadata: null,
  displayImageProportion: "horizontal",
  autoSelectOptimalPending: false,
  previewEffects: { brightness: 0, contrast: 0 },
});

const createProps = () => ({
  position: "left" as const,
  slotIndex: 1,
  image: null as SelectedImageItem | null,
  selectedProportion: "horizontal" as ImageDisplayProportion,
  isNavigable: false,
  onSelectSlot: vi.fn(),
});

describe("SideSlotPreview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls onSelectSlot when slot index is provided", () => {
    const props = {
      ...createProps(),
      slotIndex: 2,
      position: "right" as const,
    };

    render(<SideSlotPreview {...props} />);

    fireEvent.click(screen.getByTestId("uploader-slider-side-right"));

    expect(props.onSelectSlot).toHaveBeenCalledWith(2);
  });

  it("does not call onSelectSlot when slot index is null", () => {
    const props = {
      ...createProps(),
      slotIndex: null,
    };

    render(<SideSlotPreview {...props} />);

    const button = screen.getByTestId("uploader-slider-side-left");
    expect(button).toBeDisabled();

    fireEvent.click(button);

    expect(props.onSelectSlot).not.toHaveBeenCalled();
  });

  it("applies empty opacity classes when slot has no image", () => {
    render(<SideSlotPreview {...createProps()} />);

    expect(
      screen.getByTestId("uploader-slider-side-left-preview-frame"),
    ).toHaveClass(
      "opacity-95",
      "border",
      "border-dashed",
      "border-primary/70",
      "bg-primary/5",
    );
  });

  it("renders image and applies filled opacity classes when slot has image", () => {
    const props = {
      ...createProps(),
      image: createImageItem("filled"),
      isNavigable: true,
    };

    render(<SideSlotPreview {...props} />);

    expect(
      screen.getByTestId("uploader-slider-side-left-preview-frame"),
    ).toHaveClass("opacity-95", "md:opacity-92");
    expect(screen.getByRole("img")).toBeInTheDocument();
  });

  it("uses add image aria-label for empty selectable slot", () => {
    const props = {
      ...createProps(),
      slotIndex: 3,
      image: null,
    };

    render(<SideSlotPreview {...props} />);

    expect(screen.getByTestId("uploader-slider-side-left")).toHaveAttribute(
      "aria-label",
      t("uploader.addImageSlot", { index: "4" }),
    );
  });

  it("keeps navigation aria-label for filled slot", () => {
    const props = {
      ...createProps(),
      position: "right" as const,
      image: createImageItem("filled"),
    };

    render(<SideSlotPreview {...props} />);

    expect(screen.getByTestId("uploader-slider-side-right")).toHaveAttribute(
      "aria-label",
      t("uploader.nextImage"),
    );
  });

  it("de-emphasizes filled side slot when it is not navigable", () => {
    const props = {
      ...createProps(),
      image: createImageItem("filled"),
      isNavigable: false,
    };

    render(<SideSlotPreview {...props} />);

    expect(
      screen.getByTestId("uploader-slider-side-left-preview-frame"),
    ).toHaveClass("opacity-80", "md:opacity-75");
    expect(screen.getByTestId("uploader-slider-side-left")).toHaveClass(
      "scale-[0.965]",
      "md:scale-[0.985]",
    );
  });

  it("emphasizes side slot when it is a navigable target", () => {
    const props = {
      ...createProps(),
      image: createImageItem("filled"),
      isNavigable: true,
    };

    render(<SideSlotPreview {...props} />);

    expect(screen.getByTestId("uploader-slider-side-left")).toHaveClass(
      "scale-[0.985]",
      "md:scale-[0.995]",
    );
  });

  it("applies vertical aspect ratio classes for vertical proportion", () => {
    const props = {
      ...createProps(),
      selectedProportion: "vertical" as ImageDisplayProportion,
    };

    render(<SideSlotPreview {...props} />);

    expect(
      screen.getByTestId("uploader-slider-side-left-preview-frame"),
    ).toHaveClass("aspect-[2/3]");
    expect(
      screen.getByTestId("uploader-slider-side-left-preview-frame"),
    ).toHaveStyle({ aspectRatio: String(2 / 3) });
  });

  it("uses square aspect ratio when rectangle proportion is selected", () => {
    const props = {
      ...createProps(),
      selectedProportion: "rectangle" as ImageDisplayProportion,
    };

    render(<SideSlotPreview {...props} />);

    expect(
      screen.getByTestId("uploader-slider-side-left-preview-frame"),
    ).toHaveClass("aspect-square");
    expect(
      screen.getByTestId("uploader-slider-side-left-preview-frame"),
    ).toHaveStyle({ aspectRatio: "1" });
  });
});
