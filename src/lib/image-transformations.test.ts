import { describe, expect, it } from "vitest";
import {
  getCloudinaryThumbnailUrl,
  getTransformedPreviewUrl,
  DEFAULT_AI_ADJUSTMENTS,
  AI_ADJUSTMENT_OPTIONS,
} from "./image-transformations";
import type {
  ImageTransformations,
  AiAdjustments,
} from "./image-transformations";

const BASE_URL =
  "https://res.cloudinary.com/demo/image/upload/v1234567/sample.jpg";

describe("image-transformations", () => {
  describe("getCloudinaryThumbnailUrl", () => {
    it("inserts thumbnail transformation before version segment", () => {
      const result = getCloudinaryThumbnailUrl(BASE_URL, 200, 150);
      expect(result).toBe(
        "https://res.cloudinary.com/demo/image/upload/c_fill,g_auto,h_150,w_200/f_auto/q_auto/v1234567/sample.jpg",
      );
    });

    it("works with a URL that has no version segment", () => {
      const url = "https://res.cloudinary.com/demo/image/upload/sample.jpg";
      const result = getCloudinaryThumbnailUrl(url, 100, 100);
      expect(result).toContain("c_fill,g_auto,h_100,w_100");
    });
  });

  describe("getTransformedPreviewUrl", () => {
    it("returns original URL when no transformations are provided", () => {
      expect(getTransformedPreviewUrl(BASE_URL, null)).toBe(BASE_URL);
    });

    it("returns original URL when all transformation values are default", () => {
      const trans: ImageTransformations = {
        rotation: 0,
        flipHorizontal: false,
        flipVertical: false,
        brightness: 0,
        contrast: 0,
        grayscale: 0,
        blur: 0,
      };
      expect(getTransformedPreviewUrl(BASE_URL, trans)).toBe(BASE_URL);
    });

    it("applies rotation transformation", () => {
      const trans: ImageTransformations = {
        rotation: 90,
        flipHorizontal: false,
        flipVertical: false,
        brightness: 0,
        contrast: 0,
        grayscale: 0,
        blur: 0,
      };
      const result = getTransformedPreviewUrl(BASE_URL, trans);
      expect(result).toContain("a_90");
    });

    it("applies horizontal flip", () => {
      const trans: ImageTransformations = {
        rotation: 0,
        flipHorizontal: true,
        flipVertical: false,
        brightness: 0,
        contrast: 0,
        grayscale: 0,
        blur: 0,
      };
      const result = getTransformedPreviewUrl(BASE_URL, trans);
      expect(result).toContain("a_hflip");
    });

    it("applies vertical flip", () => {
      const trans: ImageTransformations = {
        rotation: 0,
        flipHorizontal: false,
        flipVertical: true,
        brightness: 0,
        contrast: 0,
        grayscale: 0,
        blur: 0,
      };
      const result = getTransformedPreviewUrl(BASE_URL, trans);
      expect(result).toContain("a_vflip");
    });

    it("applies brightness transformation", () => {
      const trans: ImageTransformations = {
        rotation: 0,
        flipHorizontal: false,
        flipVertical: false,
        brightness: 50,
        contrast: 0,
        grayscale: 0,
        blur: 0,
      };
      const result = getTransformedPreviewUrl(BASE_URL, trans);
      expect(result).toContain("e_brightness:50");
    });

    it("applies contrast transformation", () => {
      const trans: ImageTransformations = {
        rotation: 0,
        flipHorizontal: false,
        flipVertical: false,
        brightness: 0,
        contrast: -30,
        grayscale: 0,
        blur: 0,
      };
      const result = getTransformedPreviewUrl(BASE_URL, trans);
      expect(result).toContain("e_contrast:-30");
    });

    it("applies grayscale transformation", () => {
      const trans: ImageTransformations = {
        rotation: 0,
        flipHorizontal: false,
        flipVertical: false,
        brightness: 0,
        contrast: 0,
        grayscale: 80,
        blur: 0,
      };
      const result = getTransformedPreviewUrl(BASE_URL, trans);
      expect(result).toContain("e_grayscale:80");
    });

    it("applies blur transformation", () => {
      const trans: ImageTransformations = {
        rotation: 0,
        flipHorizontal: false,
        flipVertical: false,
        brightness: 0,
        contrast: 0,
        grayscale: 0,
        blur: 100,
      };
      const result = getTransformedPreviewUrl(BASE_URL, trans);
      expect(result).toContain("e_blur:100");
    });

    it("applies multiple transformations together", () => {
      const trans: ImageTransformations = {
        rotation: 180,
        flipHorizontal: true,
        flipVertical: false,
        brightness: 20,
        contrast: 10,
        grayscale: 0,
        blur: 0,
      };
      const result = getTransformedPreviewUrl(BASE_URL, trans);
      expect(result).toContain("a_180");
      expect(result).toContain("a_hflip");
      expect(result).toContain("e_brightness:20");
      expect(result).toContain("e_contrast:10");
    });

    it("applies custom crop coordinates", () => {
      const result = getTransformedPreviewUrl(
        BASE_URL,
        null,
        "10,20,300,400",
      );
      expect(result).toContain("c_crop,x_10,y_20,w_300,h_400");
    });

    it("ignores incomplete crop coordinates", () => {
      const result = getTransformedPreviewUrl(BASE_URL, null, "10,20");
      expect(result).toBe(BASE_URL);
    });

    it("applies auto crop", () => {
      const result = getTransformedPreviewUrl(
        BASE_URL,
        null,
        undefined,
        null,
        undefined,
        true,
      );
      expect(result).toContain("c_fill,g_auto,ar_1:1");
    });

    it("prefers auto crop over custom coordinates", () => {
      const result = getTransformedPreviewUrl(
        BASE_URL,
        null,
        "10,20,300,400",
        null,
        undefined,
        true,
      );
      expect(result).toContain("c_fill,g_auto,ar_1:1");
      expect(result).not.toContain("c_crop");
    });

    it("applies AI adjustments with template", () => {
      const ai: AiAdjustments = {
        enhance: true,
        removeBackground: false,
        upscale: false,
        restore: false,
      };
      const result = getTransformedPreviewUrl(
        BASE_URL,
        null,
        undefined,
        ai,
        "my_template",
      );
      expect(result).toContain("t_my_template");
      expect(result).toContain("e_enhance");
    });

    it("applies all active AI adjustments", () => {
      const ai: AiAdjustments = {
        enhance: true,
        removeBackground: true,
        upscale: true,
        restore: true,
      };
      const result = getTransformedPreviewUrl(
        BASE_URL,
        null,
        undefined,
        ai,
      );
      expect(result).toContain("e_enhance");
      expect(result).toContain("e_background_removal");
      expect(result).toContain("e_upscale");
      expect(result).toContain("e_gen_restore");
    });

    it("skips inactive AI adjustments", () => {
      const ai: AiAdjustments = {
        enhance: false,
        removeBackground: false,
        upscale: false,
        restore: false,
      };
      const result = getTransformedPreviewUrl(
        BASE_URL,
        null,
        undefined,
        ai,
      );
      expect(result).toBe(BASE_URL);
    });
  });

  describe("applyCloudinaryTransformations (via getCloudinaryThumbnailUrl)", () => {
    it("inserts transformations before version segment", () => {
      const result = getCloudinaryThumbnailUrl(BASE_URL, 200, 150);
      const uploadIdx = result.indexOf("/upload/");
      const versionIdx = result.indexOf("/v1234567/");
      const transformIdx = result.indexOf("c_fill");
      expect(transformIdx).toBeGreaterThan(uploadIdx);
      expect(transformIdx).toBeLessThan(versionIdx);
    });

    it("appends after existing transformations", () => {
      const urlWithExistingTransforms =
        "https://res.cloudinary.com/demo/image/upload/e_enhance/v1234567/sample.jpg";
      const result = getCloudinaryThumbnailUrl(urlWithExistingTransforms, 200, 150);
      const parts = result.split("/upload/")[1];
      expect(parts.startsWith("e_enhance/")).toBe(true);
      expect(parts).toContain("c_fill,g_auto");
    });

    it("returns original URL when no /upload/ marker exists", () => {
      const badUrl = "https://example.com/images/photo.jpg";
      const result = getCloudinaryThumbnailUrl(badUrl, 200, 150);
      expect(result).toBe(badUrl);
    });
  });

  describe("DEFAULT_AI_ADJUSTMENTS", () => {
    it("has enhance enabled by default", () => {
      expect(DEFAULT_AI_ADJUSTMENTS.enhance).toBe(true);
    });

    it("has other adjustments disabled by default", () => {
      expect(DEFAULT_AI_ADJUSTMENTS.removeBackground).toBe(false);
      expect(DEFAULT_AI_ADJUSTMENTS.upscale).toBe(false);
      expect(DEFAULT_AI_ADJUSTMENTS.restore).toBe(false);
    });
  });

  describe("AI_ADJUSTMENT_OPTIONS", () => {
    it("contains 4 options", () => {
      expect(AI_ADJUSTMENT_OPTIONS).toHaveLength(4);
    });

    it("has correct transformation strings", () => {
      const transformations = AI_ADJUSTMENT_OPTIONS.map((o) => o.transformation);
      expect(transformations).toContain("e_enhance");
      expect(transformations).toContain("e_background_removal");
      expect(transformations).toContain("e_upscale");
      expect(transformations).toContain("e_gen_restore");
    });
  });
});
