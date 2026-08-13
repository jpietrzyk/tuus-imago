import { describe, expect, it } from "vitest";
import {
  projectTriptychPrintability,
  resolveTriptychTargetSizeIndex,
  TRIPTYCH_PROJECTED_SHAPE,
} from "./split-printability-projection";

describe("projectTriptychPrintability", () => {
  it("projects center panel as one third of the source width against rectangular sizes", () => {
    const result = projectTriptychPrintability(7500, 5000, 2);

    expect(result.projectedSizesDpiInfo).toHaveLength(5);
    expect(result.noSizePrintable).toBe(false);
    // 90x60 (index 2) stays printable: a 2500px-wide portrait center panel
    // maps to the rotated 60x90 reference.
    expect(result.willSelectedSizeBeBlocked).toBe(false);
  });

  it("blocks the selected size when the center panel is too narrow but smaller sizes still print", () => {
    const result = projectTriptychPrintability(4500, 3000, 2);

    expect(result.noSizePrintable).toBe(false);
    expect(result.willSelectedSizeBeBlocked).toBe(true);
  });

  it("flags no printable size when the source is too small after split", () => {
    const result = projectTriptychPrintability(3000, 1500, 2);

    expect(result.noSizePrintable).toBe(true);
    expect(result.willSelectedSizeBeBlocked).toBe(true);
  });

  it("keeps the selected size available for a high-resolution source", () => {
    const result = projectTriptychPrintability(15000, 10000, 2);

    expect(result.willSelectedSizeBeBlocked).toBe(false);
    expect(result.noSizePrintable).toBe(false);
  });

  it("treats a square-only selected index as blocked for the rectangular projection", () => {
    const result = projectTriptychPrintability(15000, 15000, 5);

    expect(result.projectedSizesDpiInfo.find((i) => i.sizeIndex === 5)).toBeUndefined();
    expect(result.willSelectedSizeBeBlocked).toBe(true);
  });

  it("uses rectangular as the default projected shape", () => {
    expect(TRIPTYCH_PROJECTED_SHAPE).toBe("rectangular");
  });

  it("projects at the seamless window width for wide panoramas when frameAspectRatio is given", () => {
    // 7800x1800 panorama (4.33:1). Equal-third width = 2600, but a portrait
    // window is only 2/3 * 1800 = 1200 wide. Projecting at the window width
    // is more restrictive than the third width.
    const FRAME = 2 / 3;
    const byThird = projectTriptychPrintability(7800, 1800, 2);
    const byWindow = projectTriptychPrintability(7800, 1800, 2, TRIPTYCH_PROJECTED_SHAPE, FRAME);

    // Both still allow some size to print.
    expect(byThird.noSizePrintable).toBe(false);
    expect(byWindow.noSizePrintable).toBe(false);
    // The narrower window blocks more sizes than the wider third.
    const thirdAvailable = byThird.projectedSizesDpiInfo.filter((i) => i.isAvailable).length;
    const windowAvailable = byWindow.projectedSizesDpiInfo.filter((i) => i.isAvailable).length;
    expect(windowAvailable).toBeLessThanOrEqual(thirdAvailable);
  });

  it("matches the legacy third-width projection when the source is not wide", () => {
    // 1800x1800 (1:1): window width (2/3*1800=1200) is wider than a third
    // (1800/3=600), so the third width is the limiting one — identical to legacy.
    const FRAME = 2 / 3;
    const legacy = projectTriptychPrintability(1800, 1800, 2);
    const withFrame = projectTriptychPrintability(1800, 1800, 2, TRIPTYCH_PROJECTED_SHAPE, FRAME);
    expect(withFrame.willSelectedSizeBeBlocked).toBe(legacy.willSelectedSizeBeBlocked);
    expect(withFrame.noSizePrintable).toBe(legacy.noSizePrintable);
  });
});

describe("resolveTriptychTargetSizeIndex", () => {
  it("keeps the source size when it is still printable after split", () => {
    // 15000x10000: center panel 5000x10000, source index 2 (90x60) printable
    const projection = projectTriptychPrintability(15000, 10000, 2);
    expect(resolveTriptychTargetSizeIndex(2, projection)).toBe(2);
  });

  it("steps down to the largest printable size when the source is too large", () => {
    // 7500x5000: center panel 2500x5000, index 4 (150x100) blocked, index 3 printable
    const projection = projectTriptychPrintability(7500, 5000, 4);
    expect(resolveTriptychTargetSizeIndex(4, projection)).toBeLessThan(4);
    const result = resolveTriptychTargetSizeIndex(4, projection);
    expect(projection.projectedSizesDpiInfo.find((i) => i.sizeIndex === result)?.isAvailable).toBe(true);
  });

  it("never upgrades beyond the source size even when larger sizes are printable", () => {
    // Very high resolution: every rectangular size printable (largestAvailable = 4), but source is 2
    const projection = projectTriptychPrintability(16000, 10000, 2);
    const allAvailable = projection.projectedSizesDpiInfo.every((i) => i.isAvailable);
    expect(allAvailable).toBe(true);
    expect(resolveTriptychTargetSizeIndex(2, projection)).toBe(2);
  });

  it("returns the source index unchanged when no size is printable", () => {
    const projection = projectTriptychPrintability(3000, 1500, 2);
    expect(projection.noSizePrintable).toBe(true);
    expect(resolveTriptychTargetSizeIndex(2, projection)).toBe(2);
  });
});
