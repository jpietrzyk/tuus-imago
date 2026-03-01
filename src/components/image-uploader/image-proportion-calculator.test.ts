import { describe, expect, it } from "vitest";
import {
  calculateAllProportions,
  calculateMaxCenteredCrop,
  formatAspectRatio,
} from "./image-proportion-calculator";

describe("image-proportion-calculator", () => {
  it("calculates horizontal max-area centered crop", () => {
    const result = calculateMaxCenteredCrop({
      sourceWidth: 1200,
      sourceHeight: 800,
      proportion: "horizontal",
    });

    expect(result.outputWidth).toBe(1200);
    expect(result.outputHeight).toBe(675);
    expect(result.cropX).toBe(0);
    expect(result.cropY).toBeCloseTo(62.5);
    expect(result.coveragePercent).toBeCloseTo(84.38, 2);
  });

  it("calculates vertical max-area centered crop", () => {
    const result = calculateMaxCenteredCrop({
      sourceWidth: 1200,
      sourceHeight: 800,
      proportion: "vertical",
    });

    expect(result.outputWidth).toBe(600);
    expect(result.outputHeight).toBe(800);
    expect(result.cropX).toBe(300);
    expect(result.cropY).toBe(0);
    expect(result.coveragePercent).toBe(50);
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

    expect(result.horizontal.coveragePercent).toBeCloseTo(84.38, 2);
    expect(result.vertical.coveragePercent).toBeCloseTo(50, 2);
    expect(result.square.coveragePercent).toBeCloseTo(66.67, 2);
  });

  it("formats aspect ratios", () => {
    expect(formatAspectRatio(1200, 800)).toBe("3:2");
    expect(formatAspectRatio(1920, 1080)).toBe("16:9");
  });
});
