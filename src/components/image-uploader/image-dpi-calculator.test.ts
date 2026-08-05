import { describe, expect, it } from "vitest";
import {
  calculateEffectiveDpi,
  calculateDpiFromCrop,
  calculateOrientationMatchedDpi,
  getDpiQuality,
} from "./image-dpi-calculator";
import type { CropCalculationResult } from "./image-proportion-calculator";

describe("calculateEffectiveDpi", () => {
  it("calculates DPI for a known image at 30cm", () => {
    const result = calculateEffectiveDpi(3000, 3000, 30, 30);
    expect(result.dpi).toBe(254);
    expect(result.dpiX).toBe(254);
    expect(result.dpiY).toBe(254);
    expect(result.quality).toBe("good");
  });

  it("uses the bottleneck dimension for effective DPI", () => {
    const result = calculateEffectiveDpi(4000, 2000, 90, 60);
    expect(result.dpiX).toBe(112);
    expect(result.dpiY).toBe(84);
    expect(result.dpi).toBe(84);
  });

  it("returns excellent quality for high-resolution images", () => {
    const result = calculateEffectiveDpi(12000, 8000, 60, 40);
    expect(result.dpi).toBe(508);
    expect(result.quality).toBe("excellent");
  });

  it("returns low quality for very small images at large print", () => {
    const result = calculateEffectiveDpi(800, 600, 150, 100);
    expect(result.dpi).toBe(13);
    expect(result.quality).toBe("low");
  });

  it("calculates DPI for default reference print size (90x60)", () => {
    const result = calculateEffectiveDpi(1920, 1080, 90, 60);
    expect(result.dpiX).toBe(54);
    expect(result.dpiY).toBe(45);
    expect(result.dpi).toBe(45);
    expect(result.quality).toBe("low");
  });

  it("handles square print sizes", () => {
    const result = calculateEffectiveDpi(2400, 2400, 60, 60);
    expect(result.dpi).toBe(101);
    expect(result.quality).toBe("acceptable");
  });
});

describe("calculateOrientationMatchedDpi", () => {
  it("keeps landscape image against landscape print unchanged", () => {
    const result = calculateOrientationMatchedDpi(3000, 2000, 90, 60);
    expect(result.dpi).toBe(84);
  });

  it("rotates a landscape print for a portrait image", () => {
    const result = calculateOrientationMatchedDpi(2000, 3000, 90, 60);
    expect(result.dpi).toBe(84);
  });

  it("gives the same DPI for a portrait image and its landscape equivalent", () => {
    const portrait = calculateOrientationMatchedDpi(2000, 3000, 90, 60);
    const landscape = calculateOrientationMatchedDpi(3000, 2000, 90, 60);
    expect(portrait.dpi).toBe(landscape.dpi);
  });

  it("leaves square image and square print unchanged", () => {
    const result = calculateOrientationMatchedDpi(2000, 2000, 60, 60);
    expect(result.dpi).toBe(84);
  });
});

describe("calculateDpiFromCrop", () => {
  it("calculates DPI from a crop result and painting size", () => {
    const crop: CropCalculationResult = {
      cropX: 0,
      cropY: 62.5,
      cropWidth: 1200,
      cropHeight: 675,
      outputWidth: 1200,
      outputHeight: 675,
      sourceArea: 960000,
      cropArea: 810000,
      coverageRatio: 0.84375,
      coveragePercent: 84.38,
      widthScale: 1,
      heightScale: 0.84375,
    };

    const result = calculateDpiFromCrop(crop, {
      key: 2,
      label: "90 x 60",
      widthCm: 90,
      heightCm: 60,
    });

    expect(result.dpiX).toBe(33);
    expect(result.dpiY).toBe(28);
    expect(result.dpi).toBe(28);
    expect(result.quality).toBe("low");
  });
});

describe("getDpiQuality", () => {
  it("returns 'excellent' for DPI >= 300", () => {
    expect(getDpiQuality(300)).toBe("excellent");
    expect(getDpiQuality(600)).toBe("excellent");
  });

  it("returns 'good' for DPI >= 150", () => {
    expect(getDpiQuality(150)).toBe("good");
    expect(getDpiQuality(299)).toBe("good");
  });

  it("returns 'acceptable' for DPI >= 72", () => {
    expect(getDpiQuality(72)).toBe("acceptable");
    expect(getDpiQuality(149)).toBe("acceptable");
  });

  it("returns 'low' for DPI < 72", () => {
    expect(getDpiQuality(71)).toBe("low");
    expect(getDpiQuality(1)).toBe("low");
    expect(getDpiQuality(0)).toBe("low");
  });
});
