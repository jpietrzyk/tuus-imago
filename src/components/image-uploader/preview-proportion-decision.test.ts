import { beforeEach, describe, expect, it, vi } from "vitest";
import { resolvePreviewProportionDecision } from "./preview-proportion-decision";
import * as proportionCalculator from "./image-proportion-calculator";
import type { ImageDisplayProportion } from "./image-proportion-calculator";

describe("resolvePreviewProportionDecision", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("auto-selects optimal proportion for first-time horizontal selection", () => {
    vi.spyOn(proportionCalculator, "getOptimalDisplayProportion").mockReturnValue(
      "vertical",
    );

    const result = resolvePreviewProportionDecision({
      sourceWidth: 1200,
      sourceHeight: 800,
      selectedImageMetadata: null,
      bestProportion: null,
      userSelectedProportion: "horizontal",
    });

    expect(result).toEqual({
      nextDisplayImageProportion: "vertical",
      shouldAutoSelectOptimalProportion: true,
    });
  });

  it("uses provided best proportion without recalculating optimal", () => {
    const optimalSpy = vi.spyOn(
      proportionCalculator,
      "getOptimalDisplayProportion",
    );

    const result = resolvePreviewProportionDecision({
      sourceWidth: 1200,
      sourceHeight: 800,
      selectedImageMetadata: null,
      bestProportion: "square" as ImageDisplayProportion,
      userSelectedProportion: "horizontal",
    });

    expect(result).toEqual({
      nextDisplayImageProportion: "square",
      shouldAutoSelectOptimalProportion: true,
    });
    expect(optimalSpy).not.toHaveBeenCalled();
  });

  it("keeps user-selected proportion when metadata already exists", () => {
    vi.spyOn(proportionCalculator, "getOptimalDisplayProportion").mockReturnValue(
      "horizontal",
    );

    const result = resolvePreviewProportionDecision({
      sourceWidth: 1200,
      sourceHeight: 800,
      selectedImageMetadata: {
        width: 1200,
        height: 800,
        aspectRatio: "3:2",
      },
      bestProportion: null,
      userSelectedProportion: "vertical",
    });

    expect(result).toEqual({
      nextDisplayImageProportion: "vertical",
      shouldAutoSelectOptimalProportion: false,
    });
  });
});
