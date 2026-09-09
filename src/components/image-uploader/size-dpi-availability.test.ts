import { describe, it, expect, afterEach } from "vitest";
import {
  computeSizesDpiAvailability,
  getUnprintablePhotoInfo,
  isSlotPrintable,
  resolveRecommendedPaintingSize,
} from "./size-dpi-availability";
import { applyDpiRulesOverride, resetDpiRules } from "./image-dpi-rules";
import type { DpiQuality } from "./image-dpi-calculator";
import type { PaintingSizeIndex } from "./painting-size";

const size = (
  sizeIndex: PaintingSizeIndex,
  dpi: number,
  quality: DpiQuality,
  isAvailable: boolean,
) => ({ sizeIndex, dpi, quality, isAvailable });

afterEach(() => {
  resetDpiRules();
});

describe("resolveRecommendedPaintingSize", () => {
  it("returns the biggest size that meets the minimum DPI", () => {
    const sizes = [
      size(0, 300, "excellent", true),
      size(1, 200, "good", true),
      size(2, 100, "acceptable", true),
      size(3, 60, "low", false),
      size(4, 40, "low", false),
    ];

    expect(resolveRecommendedPaintingSize(sizes)).toBe(2);
  });

  it("returns the smallest size when no size meets the minimum DPI", () => {
    const sizes = [
      size(0, 60, "low", false),
      size(1, 40, "low", false),
      size(2, 20, "low", false),
    ];

    expect(resolveRecommendedPaintingSize(sizes)).toBe(0);
  });

  it("honors a raised minimum DPI threshold", () => {
    applyDpiRulesOverride({ minDpi: 150 });

    const sizes = [
      size(0, 300, "excellent", true),
      size(1, 200, "good", true),
      size(2, 100, "acceptable", true),
      size(3, 60, "low", false),
    ];

    expect(resolveRecommendedPaintingSize(sizes)).toBe(1);
  });
});

describe("recommended default derived from DPI availability", () => {
  it("recommends the smallest size for a low-resolution image when the guard is off", () => {
    applyDpiRulesOverride({ guardEnabled: false });

    const sizes = computeSizesDpiAvailability(1000, 700, "rectangular");

    expect(resolveRecommendedPaintingSize(sizes)).toBe(0);
  });

  it("recommends the biggest acceptable size for a high-resolution image", () => {
    applyDpiRulesOverride({ guardEnabled: false });

    const sizes = computeSizesDpiAvailability(6000, 4000, "rectangular");

    expect(resolveRecommendedPaintingSize(sizes)).toBe(4);
  });
});

describe("isSlotPrintable", () => {
  it("returns null while metadata has not resolved", () => {
    expect(
      isSlotPrintable({
        metadata: null,
        displayImageProportion: "square",
        clientRotation: 0,
      }),
    ).toBeNull();
  });

  it("returns true for a printable square photo", () => {
    // 40x40 cm at 1200 px per side -> ~76 DPI >= 72.
    expect(
      isSlotPrintable({
        metadata: { width: 1200, height: 1200 },
        displayImageProportion: "square",
        clientRotation: 0,
      }),
    ).toBe(true);
  });

  it("returns false when no square size passes the guard", () => {
    // 40x40 cm at 800 px per side -> ~50 DPI < 72.
    expect(
      isSlotPrintable({
        metadata: { width: 800, height: 800 },
        displayImageProportion: "square",
        clientRotation: 0,
      }),
    ).toBe(false);
  });

  it("projects a 90° rotation from the rotated shape", () => {
    // Landscape 4000x2000 shown in a vertical (2:3) frame after a quarter
    // turn: the printed crop is 2000x3000 -> ~127 DPI at 40x60 cm.
    expect(
      isSlotPrintable({
        metadata: { width: 4000, height: 2000 },
        displayImageProportion: "vertical",
        clientRotation: 90,
      }),
    ).toBe(true);

    // Without the rotation the same source yields a 1333x2000 crop (~84
    // DPI) — still printable, but a different projection.
    expect(
      isSlotPrintable({
        metadata: { width: 4000, height: 2000 },
        displayImageProportion: "vertical",
        clientRotation: 0,
      }),
    ).toBe(true);
  });

  it("projects triptych window slots from the window crop, not the full source", () => {
    // 1200x2000 in a vertical frame: the resting crop alone would be
    // printable (~76 DPI), but the 3-window band must fit the 1200 px
    // width, which shrinks each window to 400x600 (~25 DPI).
    expect(
      isSlotPrintable({
        metadata: { width: 1200, height: 2000 },
        displayImageProportion: "vertical",
        clientRotation: 0,
        triptychWindowIndex: 1,
      }),
    ).toBe(false);

    expect(
      isSlotPrintable({
        metadata: { width: 1200, height: 2000 },
        displayImageProportion: "vertical",
        clientRotation: 0,
      }),
    ).toBe(true);
  });

  it("returns true for any photo when the guard is disabled", () => {
    applyDpiRulesOverride({ guardEnabled: false });

    expect(
      isSlotPrintable({
        metadata: { width: 300, height: 300 },
        displayImageProportion: "square",
        clientRotation: 0,
      }),
    ).toBe(true);
  });
});

describe("getUnprintablePhotoInfo", () => {
  it("returns null for a printable photo", () => {
    expect(getUnprintablePhotoInfo(1200, 1200, "square")).toBeNull();
  });

  it("returns null when the guard is disabled", () => {
    applyDpiRulesOverride({ guardEnabled: false });

    expect(getUnprintablePhotoInfo(300, 300, "square")).toBeNull();
  });

  it("describes an unprintable square photo against the smallest size", () => {
    expect(getUnprintablePhotoInfo(800, 800, "square")).toEqual({
      width: 800,
      height: 800,
      dpi: 50,
      sizeLabel: "40 x 40",
      minWidth: 1134,
      minHeight: 1134,
    });
  });

  it("orientation-matches the smallest rectangular size for portrait photos", () => {
    expect(getUnprintablePhotoInfo(800, 1200, "rectangular")).toEqual({
      width: 800,
      height: 1200,
      dpi: 50,
      sizeLabel: "40 x 60",
      minWidth: 1134,
      minHeight: 1701,
    });
  });
});
