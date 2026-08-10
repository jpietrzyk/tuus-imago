import { describe, expect, it } from "vitest";
import { adjustCropForZoomPan, resolvePanAvailability } from "./use-crop-adjust";
import { calculateMaxCenteredCrop } from "./image-proportion-calculator";
import type { CropCalculationResult } from "./image-proportion-calculator";
function createBaseCrop(
  sourceWidth: number,
  sourceHeight: number,
  proportion: "horizontal" | "vertical" | "square" = "horizontal",
): CropCalculationResult {
  return calculateMaxCenteredCrop({ sourceWidth, sourceHeight, proportion });
}

describe("adjustCropForZoomPan", () => {
  it("returns base crop unchanged when zoom is 1", () => {
    const baseCrop = createBaseCrop(1200, 800);
    const result = adjustCropForZoomPan(baseCrop, 1, 0, 0);
    expect(result).toBe(baseCrop);
  });

  it("returns base crop unchanged when zoom is less than 1", () => {
    const baseCrop = createBaseCrop(1200, 800);
    const result = adjustCropForZoomPan(baseCrop, 0.5, 0, 0);
    expect(result).toBe(baseCrop);
  });

  it("zooms in even when horizontal image fits exactly (100% coverage)", () => {
    const baseCrop = createBaseCrop(1600, 900, "horizontal");
    const result = adjustCropForZoomPan(baseCrop, 2, 0, 0);
    expect(result).not.toBe(baseCrop);
    expect(result.cropWidth).toBeCloseTo(baseCrop.cropWidth / 2, 1);
    expect(result.cropHeight).toBeCloseTo(baseCrop.cropHeight / 2, 1);
  });

  it("zooms in even when vertical image fits exactly (100% coverage)", () => {
    const baseCrop = createBaseCrop(800, 1200, "vertical");
    expect(baseCrop.coveragePercent).toBeGreaterThanOrEqual(99.9);
    const result = adjustCropForZoomPan(baseCrop, 2, 0, 0);
    expect(result).not.toBe(baseCrop);
    expect(result.cropWidth).toBeCloseTo(baseCrop.cropWidth / 2, 1);
    expect(result.cropHeight).toBeCloseTo(baseCrop.cropHeight / 2, 1);
  });

  it("zooms in even when square image fits exactly (100% coverage)", () => {
    const baseCrop = createBaseCrop(1000, 1000, "square");
    expect(baseCrop.coveragePercent).toBeGreaterThanOrEqual(99.9);
    const result = adjustCropForZoomPan(baseCrop, 2, 0, 0);
    expect(result).not.toBe(baseCrop);
    expect(result.cropWidth).toBeCloseTo(baseCrop.cropWidth / 2, 1);
    expect(result.cropHeight).toBeCloseTo(baseCrop.cropHeight / 2, 1);
  });

  it("clamps vertical full-coverage zoom within source bounds", () => {
    const baseCrop = createBaseCrop(800, 1200, "vertical");
    const result = adjustCropForZoomPan(baseCrop, 2, 1, 1);
    const sourceWidth = baseCrop.cropWidth / baseCrop.widthScale;
    const sourceHeight = baseCrop.cropHeight / baseCrop.heightScale;
    expect(result.cropX).toBeGreaterThanOrEqual(-0.5);
    expect(result.cropY).toBeGreaterThanOrEqual(-0.5);
    expect(result.cropX + result.cropWidth).toBeLessThanOrEqual(sourceWidth + 0.5);
    expect(result.cropY + result.cropHeight).toBeLessThanOrEqual(sourceHeight + 0.5);
  });

  it("allows panning on vertical full-coverage zoom", () => {
    const baseCrop = createBaseCrop(800, 1200, "vertical");
    const centered = adjustCropForZoomPan(baseCrop, 2, 0, 0);
    const pannedDown = adjustCropForZoomPan(baseCrop, 2, 0, 1);
    const pannedUp = adjustCropForZoomPan(baseCrop, 2, 0, -1);
    expect(pannedDown.cropY).toBeGreaterThan(centered.cropY);
    expect(pannedUp.cropY).toBeLessThan(centered.cropY);
  });

  it("shrinks crop dimensions when zoomed in", () => {
    const baseCrop = createBaseCrop(1200, 800);
    const result = adjustCropForZoomPan(baseCrop, 2, 0, 0);
    expect(result).not.toBe(baseCrop);
    expect(result.cropWidth).toBeLessThan(baseCrop.cropWidth);
    expect(result.cropHeight).toBeLessThan(baseCrop.cropHeight);
  });

  it("zoom 2x halves the crop dimensions", () => {
    const baseCrop = createBaseCrop(1200, 800);
    const result = adjustCropForZoomPan(baseCrop, 2, 0, 0);
    expect(result.cropWidth).toBeCloseTo(baseCrop.cropWidth / 2, 1);
    expect(result.cropHeight).toBeCloseTo(baseCrop.cropHeight / 2, 1);
  });

  it("centers the zoomed crop by default (pan 0,0)", () => {
    const baseCrop = createBaseCrop(1200, 800);
    const result = adjustCropForZoomPan(baseCrop, 2, 0, 0);
    const expectedX = baseCrop.cropX + (baseCrop.cropWidth - result.cropWidth) / 2;
    const expectedY = baseCrop.cropY + (baseCrop.cropHeight - result.cropHeight) / 2;
    expect(result.cropX).toBeCloseTo(expectedX, 1);
    expect(result.cropY).toBeCloseTo(expectedY, 1);
  });

  it("shifts crop right when panX is positive", () => {
    const baseCrop = createBaseCrop(1200, 800);
    const centered = adjustCropForZoomPan(baseCrop, 2, 0, 0);
    const panned = adjustCropForZoomPan(baseCrop, 2, 1, 0);
    expect(panned.cropX).toBeGreaterThan(centered.cropX);
  });

  it("shifts crop left when panX is negative", () => {
    const baseCrop = createBaseCrop(1200, 800);
    const centered = adjustCropForZoomPan(baseCrop, 2, 0, 0);
    const panned = adjustCropForZoomPan(baseCrop, 2, -1, 0);
    expect(panned.cropX).toBeLessThan(centered.cropX);
  });

  it("shifts crop down when panY is positive", () => {
    const baseCrop = createBaseCrop(1200, 800);
    const centered = adjustCropForZoomPan(baseCrop, 2, 0, 0);
    const panned = adjustCropForZoomPan(baseCrop, 2, 0, 1);
    expect(panned.cropY).toBeGreaterThan(centered.cropY);
  });

  it("shifts crop up when panY is negative", () => {
    const baseCrop = createBaseCrop(1200, 800);
    const centered = adjustCropForZoomPan(baseCrop, 2, 0, 0);
    const panned = adjustCropForZoomPan(baseCrop, 2, 0, -1);
    expect(panned.cropY).toBeLessThan(centered.cropY);
  });

  it("clamps crop to source bounds at max pan", () => {
    const baseCrop = createBaseCrop(1200, 800);
    const result = adjustCropForZoomPan(baseCrop, 2, 1, 1);
    const sourceWidth = baseCrop.cropWidth / baseCrop.widthScale;
    const sourceHeight = baseCrop.cropHeight / baseCrop.heightScale;
    expect(result.cropX + result.cropWidth).toBeLessThanOrEqual(sourceWidth + 0.5);
    expect(result.cropY + result.cropHeight).toBeLessThanOrEqual(sourceHeight + 0.5);
    expect(result.cropX).toBeGreaterThanOrEqual(-0.5);
    expect(result.cropY).toBeGreaterThanOrEqual(-0.5);
  });

  it("clamps crop to source bounds at negative max pan", () => {
    const baseCrop = createBaseCrop(1200, 800);
    const result = adjustCropForZoomPan(baseCrop, 2, -1, -1);
    const sourceWidth = baseCrop.cropWidth / baseCrop.widthScale;
    const sourceHeight = baseCrop.cropHeight / baseCrop.heightScale;
    expect(result.cropX).toBeGreaterThanOrEqual(-0.5);
    expect(result.cropY).toBeGreaterThanOrEqual(-0.5);
    expect(result.cropX + result.cropWidth).toBeLessThanOrEqual(sourceWidth + 0.5);
    expect(result.cropY + result.cropHeight).toBeLessThanOrEqual(sourceHeight + 0.5);
  });

  it("recalculates coverage to be smaller when zoomed in", () => {
    const baseCrop = createBaseCrop(1200, 800);
    const result = adjustCropForZoomPan(baseCrop, 2, 0, 0);
    expect(result.coveragePercent).toBeLessThan(baseCrop.coveragePercent);
  });

  it("recalculates sourceArea to match base crop", () => {
    const baseCrop = createBaseCrop(1200, 800);
    const result = adjustCropForZoomPan(baseCrop, 2, 0, 0);
    expect(result.sourceArea).toBe(baseCrop.sourceArea);
  });

  it("handles max zoom of 3x", () => {
    const baseCrop = createBaseCrop(1200, 800);
    const result = adjustCropForZoomPan(baseCrop, 3, 0, 0);
    expect(result.cropWidth).toBeCloseTo(baseCrop.cropWidth / 3, 1);
    expect(result.cropHeight).toBeCloseTo(baseCrop.cropHeight / 3, 1);
  });

  it("works with vertical proportion", () => {
    const baseCrop = createBaseCrop(1200, 800, "vertical");
    const result = adjustCropForZoomPan(baseCrop, 2, 0, 0);
    expect(result.cropWidth).toBeLessThan(baseCrop.cropWidth);
    expect(result.cropHeight).toBeLessThan(baseCrop.cropHeight);
    expect(result.cropX).toBeGreaterThanOrEqual(-0.5);
    expect(result.cropY).toBeGreaterThanOrEqual(-0.5);
  });

  it("works with square proportion", () => {
    const baseCrop = createBaseCrop(1200, 800, "square");
    const result = adjustCropForZoomPan(baseCrop, 2, 0, 0);
    expect(result.cropWidth).toBeLessThan(baseCrop.cropWidth);
    expect(result.cropHeight).toBeLessThan(baseCrop.cropHeight);
  });

  it("computes correct output dimensions", () => {
    const baseCrop = createBaseCrop(1200, 800);
    const result = adjustCropForZoomPan(baseCrop, 2, 0, 0);
    expect(result.outputWidth).toBe(Math.max(1, Math.round(result.cropWidth)));
    expect(result.outputHeight).toBe(Math.max(1, Math.round(result.cropHeight)));
  });

  it("preserves crop within source bounds for extreme pan values beyond [-1,1]", () => {
    const baseCrop = createBaseCrop(1200, 800);
    const result = adjustCropForZoomPan(baseCrop, 2, 5, -5);
    const sourceWidth = baseCrop.cropWidth / baseCrop.widthScale;
    const sourceHeight = baseCrop.cropHeight / baseCrop.heightScale;
    expect(result.cropX).toBeGreaterThanOrEqual(-0.5);
    expect(result.cropY).toBeGreaterThanOrEqual(-0.5);
    expect(result.cropX + result.cropWidth).toBeLessThanOrEqual(sourceWidth + 0.5);
    expect(result.cropY + result.cropHeight).toBeLessThanOrEqual(sourceHeight + 0.5);
  });

  // --- Overflow pan at zoom 1 (triptych / aspect-mismatched images) ---

  it("returns base crop unchanged at zoom 1 when source matches crop (no overflow)", () => {
    const baseCrop = createBaseCrop(800, 1200, "vertical");
    const result = adjustCropForZoomPan(baseCrop, 1, 0.5, -0.5);
    expect(result).toBe(baseCrop);
  });

  it("allows vertical panning at zoom 1 when source overflows the crop", () => {
    // A vertical third (e.g. 333 x 1000) shown in a portrait frame overflows
    // vertically: the centered crop is shorter than the source.
    const baseCrop = createBaseCrop(333, 1000, "vertical");
    const sourceHeight = 1000;
    expect(baseCrop.cropHeight).toBeLessThan(sourceHeight);

    const centered = adjustCropForZoomPan(baseCrop, 1, 0, 0);
    const pannedDown = adjustCropForZoomPan(baseCrop, 1, 0, 1);
    const pannedUp = adjustCropForZoomPan(baseCrop, 1, 0, -1);

    // Centered crop stays centered.
    expect(centered.cropY).toBeCloseTo(baseCrop.cropY, 0);
    // Panning reveals different vertical regions.
    expect(pannedDown.cropY).toBeGreaterThan(centered.cropY);
    expect(pannedUp.cropY).toBeLessThan(centered.cropY);
    // Full range: top edge reaches source top, bottom edge reaches source bottom.
    expect(pannedUp.cropY).toBeGreaterThanOrEqual(-0.5);
    expect(pannedDown.cropY + pannedDown.cropHeight).toBeLessThanOrEqual(
      sourceHeight + 0.5,
    );
  });

  it("does not distort crop dimensions at zoom 1 overflow pan", () => {
    const baseCrop = createBaseCrop(333, 1000, "vertical");
    const result = adjustCropForZoomPan(baseCrop, 1, 0, 1);
    expect(result.cropWidth).toBeCloseTo(baseCrop.cropWidth, 1);
    expect(result.cropHeight).toBeCloseTo(baseCrop.cropHeight, 1);
  });

  it("allows horizontal panning at zoom 1 when source overflows the crop", () => {
    // A landscape image in a vertical frame overflows horizontally.
    const baseCrop = createBaseCrop(1600, 400, "vertical");
    const sourceWidth = 1600;
    expect(baseCrop.cropWidth).toBeLessThan(sourceWidth);

    const centered = adjustCropForZoomPan(baseCrop, 1, 0, 0);
    const pannedRight = adjustCropForZoomPan(baseCrop, 1, 1, 0);
    const pannedLeft = adjustCropForZoomPan(baseCrop, 1, -1, 0);

    expect(pannedRight.cropX).toBeGreaterThan(centered.cropX);
    expect(pannedLeft.cropX).toBeLessThan(centered.cropX);
    expect(pannedLeft.cropX).toBeGreaterThanOrEqual(-0.5);
    expect(pannedRight.cropX + pannedRight.cropWidth).toBeLessThanOrEqual(
      sourceWidth + 0.5,
    );
  });

  it("combines zoom and overflow pan seamlessly", () => {
    const baseCrop = createBaseCrop(333, 1000, "vertical");
    const atZoom1 = adjustCropForZoomPan(baseCrop, 1, 0, 0.5);
    const atZoom105 = adjustCropForZoomPan(baseCrop, 1.05, 0, 0.5);
    // The pan offset should change smoothly across the zoom=1 boundary.
    expect(Math.abs(atZoom105.cropY - atZoom1.cropY)).toBeLessThan(30);
  });

  it("clamps overflow pan at zoom 1 within source bounds", () => {
    const baseCrop = createBaseCrop(333, 1000, "vertical");
    const result = adjustCropForZoomPan(baseCrop, 1, 0, 5);
    expect(result.cropY).toBeGreaterThanOrEqual(-0.5);
    expect(result.cropY + result.cropHeight).toBeLessThanOrEqual(1000.5);
  });
});

describe("resolvePanAvailability", () => {
  it("returns no pan for aspect-matched source and proportion", () => {
    const result = resolvePanAvailability({
      sourceWidth: 800,
      sourceHeight: 1200,
      proportion: "vertical",
    });
    expect(result.canPanX).toBe(false);
    expect(result.canPanY).toBe(false);
  });

  it("returns vertical pan for a tall source in a portrait frame", () => {
    const result = resolvePanAvailability({
      sourceWidth: 333,
      sourceHeight: 1000,
      proportion: "vertical",
    });
    expect(result.canPanY).toBe(true);
  });

  it("returns horizontal pan for a wide source in a vertical frame", () => {
    const result = resolvePanAvailability({
      sourceWidth: 1600,
      sourceHeight: 400,
      proportion: "vertical",
    });
    expect(result.canPanX).toBe(true);
  });

  it("returns no pan for invalid dimensions", () => {
    const result = resolvePanAvailability({
      sourceWidth: 0,
      sourceHeight: 0,
      proportion: "vertical",
    });
    expect(result.canPanX).toBe(false);
    expect(result.canPanY).toBe(false);
  });
});
