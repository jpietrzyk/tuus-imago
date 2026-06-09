import { describe, expect, it } from "vitest";
import {
  calculateAllProportions,
  calculateMaxCenteredCrop,
  formatAspectRatio,
  getFrameAspectRatioClassName,
  getTargetAspectRatio,
} from "./image-proportion-calculator";
import { getPaintingSizeOptions } from "./painting-size";

describe("image-proportion-calculator", () => {
  it("calculates horizontal max-area centered crop", () => {
    const result = calculateMaxCenteredCrop({
      sourceWidth: 1200,
      sourceHeight: 900,
      proportion: "horizontal",
    });

    expect(result.outputWidth).toBe(1200);
    expect(result.outputHeight).toBe(800);
    expect(result.cropX).toBe(0);
    expect(result.cropY).toBeCloseTo(50, 2);
    expect(result.coveragePercent).toBeCloseTo(88.89, 2);
  });

  it("calculates vertical max-area centered crop", () => {
    const result = calculateMaxCenteredCrop({
      sourceWidth: 1200,
      sourceHeight: 800,
      proportion: "vertical",
    });

    expect(result.outputWidth).toBe(533);
    expect(result.outputHeight).toBe(800);
    expect(result.cropX).toBeCloseTo(333.33, 2);
    expect(result.cropY).toBe(0);
    expect(result.coveragePercent).toBeCloseTo(44.44, 2);
  });

  it("calculates square max-area centered crop", () => {
    const result = calculateMaxCenteredCrop({
      sourceWidth: 1200,
      sourceHeight: 800,
      proportion: "square",
    });

    expect(result.outputWidth).toBe(800);
    expect(result.outputHeight).toBe(800);
    expect(result.cropX).toBe(200);
    expect(result.cropY).toBe(0);
    expect(result.coveragePercent).toBeCloseTo(66.67, 2);
  });

  it("returns all options coverage in one call", () => {
    const result = calculateAllProportions(1200, 800);

    expect(result.horizontal.coveragePercent).toBeCloseTo(100, 2);
    expect(result.vertical.coveragePercent).toBeCloseTo(44.44, 2);
    expect(result.square.coveragePercent).toBeCloseTo(66.67, 2);
  });

  it("formats aspect ratios", () => {
    expect(formatAspectRatio(1200, 800)).toBe("3:2");
    expect(formatAspectRatio(1920, 1080)).toBe("16:9");
  });

  it("derives horizontal/vertical target ratios from the rectangular product base size", () => {
    const [base] = getPaintingSizeOptions("rectangular");
    const baseRatio = base.widthCm / base.heightCm;

    expect(getTargetAspectRatio("horizontal")).toBeCloseTo(baseRatio, 10);
    expect(getTargetAspectRatio("vertical")).toBeCloseTo(1 / baseRatio, 10);
    expect(getTargetAspectRatio("square")).toBe(1);
  });

  it("maps each proportion to a stable frame aspect class", () => {
    expect(getFrameAspectRatioClassName("horizontal")).toBe("aspect-[3/2]");
    expect(getFrameAspectRatioClassName("vertical")).toBe("aspect-[2/3]");
    expect(getFrameAspectRatioClassName("square")).toBe("aspect-square");
    expect(getFrameAspectRatioClassName("rectangle")).toBe("aspect-square");
  });
});
