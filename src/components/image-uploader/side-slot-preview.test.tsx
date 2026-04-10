import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import SideSlotPreview from "./side-slot-preview";
import { t } from "@/locales/i18n";
import { resolveSlotFramePreset } from "./slot-frame-presets";
import type { SelectedImageItem } from "./image-uploader";

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

  it("renders invisible spacer when slot index is null", () => {
    const props = {
      ...createProps(),
      slotIndex: null,
    };

    render(<SideSlotPreview {...props} />);

    expect(
      screen.queryByTestId("uploader-slider-side-left"),
    ).not.toBeInTheDocument();
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
  });

  it("emphasizes side slot when it is a navigable target", () => {
    const props = {
      ...createProps(),
      image: createImageItem("filled"),
      isNavigable: true,
    };

    render(<SideSlotPreview {...props} />);

    expect(
      screen.getByTestId("uploader-slider-side-left-preview-frame"),
    ).toHaveClass("opacity-95", "md:opacity-92");
  });

  it("applies vertical side preset min-width classes", () => {
    const image: SelectedImageItem = {
      ...createImageItem("vertical"),
      displayImageProportion: "vertical",
    };
    const props = {
      ...createProps(),
      image,
    };

    render(<SideSlotPreview {...props} />);

    const firstVerticalClass =
      resolveSlotFramePreset("vertical").sideFrameMinWidthClassName.split(
        " ",
      )[0];

    expect(
      screen.getByTestId("uploader-slider-side-left-preview-frame"),
    ).toHaveClass(firstVerticalClass);
    expect(
      screen.getByTestId("uploader-slider-side-left-preview-frame"),
    ).toHaveClass("aspect-[2/3]");
  });

  it("uses square side preset when rectangle proportion is selected", () => {
    const image: SelectedImageItem = {
      ...createImageItem("rectangle"),
      displayImageProportion: "rectangle",
    };
    const props = {
      ...createProps(),
      image,
    };

    render(<SideSlotPreview {...props} />);

    const firstSquareClass =
      resolveSlotFramePreset("square").sideFrameMinWidthClassName.split(" ")[0];

    expect(
      screen.getByTestId("uploader-slider-side-left-preview-frame"),
    ).toHaveClass(firstSquareClass);
    expect(
      screen.getByTestId("uploader-slider-side-left-preview-frame"),
    ).toHaveClass("aspect-square");
  });
});
