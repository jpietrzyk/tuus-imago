import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { usePreviewSliderSlots } from "./use-preview-slider-slots";
import type { SelectedImageItem } from "./image-uploader";

interface HarnessProps {
  selectedImages: Array<SelectedImageItem | null>;
  activeImageIndex: number | null;
}

const createItem = (name: string): SelectedImageItem => ({
  file: new File([name], `${name}.jpg`, { type: "image/jpeg" }),
  previewUrl: `blob:${name}`,
  metadata: null,
  displayImageProportion: "horizontal",
  autoSelectOptimalPending: false,
});

function Harness({ selectedImages, activeImageIndex }: HarnessProps) {
  const { leftSlotIndex, rightSlotIndex, leftSlotImage, rightSlotImage } =
    usePreviewSliderSlots({
      selectedImages,
      activeImageIndex,
    });

  return (
    <div>
      <div data-testid="left-index">{String(leftSlotIndex)}</div>
      <div data-testid="right-index">{String(rightSlotIndex)}</div>
      <div data-testid="left-image">{leftSlotImage?.previewUrl ?? "null"}</div>
      <div data-testid="right-image">
        {rightSlotImage?.previewUrl ?? "null"}
      </div>
    </div>
  );
}

describe("usePreviewSliderSlots", () => {
  it("returns empty side slots when there is no active index", () => {
    render(
      <Harness
        selectedImages={[
          createItem("left"),
          createItem("center"),
          createItem("right"),
        ]}
        activeImageIndex={null}
      />,
    );

    expect(screen.getByTestId("left-index").textContent).toBe("null");
    expect(screen.getByTestId("right-index").textContent).toBe("null");
    expect(screen.getByTestId("left-image").textContent).toBe("null");
    expect(screen.getByTestId("right-image").textContent).toBe("null");
  });

  it("returns side slot indexes and images around active center", () => {
    render(
      <Harness
        selectedImages={[
          createItem("left"),
          createItem("center"),
          createItem("right"),
        ]}
        activeImageIndex={1}
      />,
    );

    expect(screen.getByTestId("left-index").textContent).toBe("0");
    expect(screen.getByTestId("right-index").textContent).toBe("2");
    expect(screen.getByTestId("left-image").textContent).toBe("blob:left");
    expect(screen.getByTestId("right-image").textContent).toBe("blob:right");
  });

  it("exposes only right slot when active image is first", () => {
    render(
      <Harness
        selectedImages={[createItem("first"), null, createItem("third")]}
        activeImageIndex={0}
      />,
    );

    expect(screen.getByTestId("left-index").textContent).toBe("null");
    expect(screen.getByTestId("right-index").textContent).toBe("1");
    expect(screen.getByTestId("left-image").textContent).toBe("null");
    expect(screen.getByTestId("right-image").textContent).toBe("null");
  });
});
