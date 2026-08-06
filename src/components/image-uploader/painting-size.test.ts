import { describe, it, expect } from "vitest";
import {
  formatPaintingSizeLabel,
  getOrientedPaintingDimensions,
  getPaintingOrientation,
  getPaintingSizeOptions,
} from "./painting-size";

describe("getPaintingOrientation", () => {
  it("maps vertical to portrait", () => {
    expect(getPaintingOrientation("vertical")).toBe("portrait");
  });

  it("maps non-vertical proportions to landscape", () => {
    expect(getPaintingOrientation("horizontal")).toBe("landscape");
    expect(getPaintingOrientation("rectangle")).toBe("landscape");
    expect(getPaintingOrientation("square")).toBe("landscape");
  });
});

describe("getOrientedPaintingDimensions", () => {
  it("keeps canonical dimensions for landscape", () => {
    const [option] = getPaintingSizeOptions("rectangular");
    expect(getOrientedPaintingDimensions(option, "landscape")).toEqual({
      widthCm: option.widthCm,
      heightCm: option.heightCm,
    });
  });

  it("swaps dimensions for portrait on rectangular options", () => {
    const [option] = getPaintingSizeOptions("rectangular");
    expect(getOrientedPaintingDimensions(option, "portrait")).toEqual({
      widthCm: option.heightCm,
      heightCm: option.widthCm,
    });
  });

  it("does not swap dimensions for square options", () => {
    const option = getPaintingSizeOptions("square")[2];
    expect(getOrientedPaintingDimensions(option, "portrait")).toEqual({
      widthCm: option.widthCm,
      heightCm: option.heightCm,
    });
  });
});

describe("formatPaintingSizeLabel", () => {
  it("returns the landscape label for landscape orientation", () => {
    const [option] = getPaintingSizeOptions("rectangular");
    expect(formatPaintingSizeLabel(option, "landscape")).toBe("60 x 40");
  });

  it("swaps dimensions for portrait orientation on rectangular options", () => {
    const [option] = getPaintingSizeOptions("rectangular");
    expect(formatPaintingSizeLabel(option, "portrait")).toBe("40 x 60");
  });

  it("keeps the larger rectangular option swapped for portrait", () => {
    const options = getPaintingSizeOptions("rectangular");
    const largest = options[options.length - 1];
    expect(formatPaintingSizeLabel(largest, "portrait")).toBe("100 x 150");
  });

  it("does not swap dimensions for square options", () => {
    const option = getPaintingSizeOptions("square")[2];
    expect(formatPaintingSizeLabel(option, "portrait")).toBe("60 x 60");
  });
});
