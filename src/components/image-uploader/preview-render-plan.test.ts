import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildPreviewRenderPlan } from "./preview-render-plan";
import * as metadataModule from "./preview-image-metadata";
import * as proportionDecisionModule from "./preview-proportion-decision";
import * as cropModule from "./image-proportion-calculator";

describe("buildPreviewRenderPlan", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("combines metadata, proportion decision, and crop into one render plan", () => {
    vi.spyOn(metadataModule, "buildPreviewImageMetadata").mockReturnValue({
      width: 1200,
      height: 800,
      aspectRatio: "3:2",
    });
    vi.spyOn(
      proportionDecisionModule,
      "resolvePreviewProportionDecision",
    ).mockReturnValue({
      nextDisplayImageProportion: "vertical",
      shouldAutoSelectOptimalProportion: true,
    });
    vi.spyOn(cropModule, "calculateMaxCenteredCrop").mockReturnValue({
      cropX: 10,
      cropY: 20,
      cropWidth: 500,
      cropHeight: 700,
      outputWidth: 500,
      outputHeight: 700,
      sourceArea: 960000,
      cropArea: 350000,
      coverageRatio: 0.36,
      coveragePercent: 36,
      widthScale: 0.4,
      heightScale: 0.875,
    });

    const plan = buildPreviewRenderPlan({
      sourceWidth: 1200,
      sourceHeight: 800,
      selectedImageMetadata: null,
      bestProportion: null,
      userSelectedProportion: "horizontal",
    });

    expect(plan).toEqual({
      metadata: {
        width: 1200,
        height: 800,
        aspectRatio: "3:2",
      },
      nextDisplayImageProportion: "vertical",
      shouldAutoSelectOptimalProportion: true,
      crop: {
        cropX: 10,
        cropY: 20,
        cropWidth: 500,
        cropHeight: 700,
        outputWidth: 500,
        outputHeight: 700,
        sourceArea: 960000,
        cropArea: 350000,
        coverageRatio: 0.36,
        coveragePercent: 36,
        widthScale: 0.4,
        heightScale: 0.875,
      },
    });
  });

  it("passes the chosen proportion into crop calculation", () => {
    vi.spyOn(metadataModule, "buildPreviewImageMetadata").mockReturnValue({
      width: 1000,
      height: 1000,
      aspectRatio: "1:1",
    });
    vi.spyOn(
      proportionDecisionModule,
      "resolvePreviewProportionDecision",
    ).mockReturnValue({
      nextDisplayImageProportion: "square",
      shouldAutoSelectOptimalProportion: false,
    });
    const cropSpy = vi.spyOn(cropModule, "calculateMaxCenteredCrop");

    buildPreviewRenderPlan({
      sourceWidth: 1000,
      sourceHeight: 1000,
      selectedImageMetadata: {
        width: 1000,
        height: 1000,
        aspectRatio: "1:1",
      },
      bestProportion: "square",
      userSelectedProportion: "vertical",
    });

    expect(cropSpy).toHaveBeenCalledWith({
      sourceWidth: 1000,
      sourceHeight: 1000,
      proportion: "square",
    });
  });
});
