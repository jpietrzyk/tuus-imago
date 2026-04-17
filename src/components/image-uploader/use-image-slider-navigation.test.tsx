import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { useImageSliderNavigation } from "./use-image-slider-navigation";
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
  previewEffects: { brightness: 0, contrast: 0, grayscale: 0 },
  previewTransform: { rotation: 0, flipHorizontal: false, flipVertical: false },
});

function Harness({ selectedImages, activeImageIndex }: HarnessProps) {
  const {
    previousFilledSlotIndex,
    nextFilledSlotIndex,
    canMovePrevious,
    canMoveNext,
  } = useImageSliderNavigation({
    selectedImages,
    activeImageIndex,
  });

  return (
    <div>
      <div data-testid="prev-index">{String(previousFilledSlotIndex)}</div>
      <div data-testid="next-index">{String(nextFilledSlotIndex)}</div>
      <div data-testid="can-prev">{String(canMovePrevious)}</div>
      <div data-testid="can-next">{String(canMoveNext)}</div>
    </div>
  );
}

describe("useImageSliderNavigation", () => {
  it("returns no navigation when active image is null", () => {
    render(
      <Harness
        selectedImages={[createItem("a"), null, createItem("c")]}
        activeImageIndex={null}
      />,
    );

    expect(screen.getByTestId("prev-index").textContent).toBe("null");
    expect(screen.getByTestId("next-index").textContent).toBe("null");
    expect(screen.getByTestId("can-prev").textContent).toBe("false");
    expect(screen.getByTestId("can-next").textContent).toBe("false");
  });

  it("resolves previous and next filled slots for center active image", () => {
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

    expect(screen.getByTestId("prev-index").textContent).toBe("0");
    expect(screen.getByTestId("next-index").textContent).toBe("2");
    expect(screen.getByTestId("can-prev").textContent).toBe("true");
    expect(screen.getByTestId("can-next").textContent).toBe("true");
  });

  it("skips empty slots when looking for next filled slot", () => {
    render(
      <Harness
        selectedImages={[createItem("left"), null, createItem("right")]}
        activeImageIndex={0}
      />,
    );

    expect(screen.getByTestId("prev-index").textContent).toBe("null");
    expect(screen.getByTestId("next-index").textContent).toBe("2");
    expect(screen.getByTestId("can-prev").textContent).toBe("false");
    expect(screen.getByTestId("can-next").textContent).toBe("true");
  });
});
