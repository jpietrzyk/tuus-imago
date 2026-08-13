import { describe, expect, it } from "vitest";
import {
  computeTriptychWindowCrop,
  isWidePanoramaForTriptych,
} from "./triptych-window-crop";

// Portrait frame aspect (vertical proportion) = 2/3.
const FRAME = 2 / 3;

describe("isWidePanoramaForTriptych", () => {
  it("is false when thirds fit the portrait frame (aspect <= 3 * frame)", () => {
    // aspect 2.0 == 3 * (2/3): boundary, thirds exactly fit.
    expect(isWidePanoramaForTriptych(2000, 1000, FRAME)).toBe(false);
    expect(isWidePanoramaForTriptych(1500, 1000, FRAME)).toBe(false); // square-ish
  });

  it("is true when equal-width thirds would be cropped (aspect > 3 * frame)", () => {
    expect(isWidePanoramaForTriptych(3000, 1000, FRAME)).toBe(true); // 3:1
    expect(isWidePanoramaForTriptych(4500, 1000, FRAME)).toBe(true); // 4.5:1
  });

  it("is safe for invalid dimensions", () => {
    expect(isWidePanoramaForTriptych(0, 0, FRAME)).toBe(false);
    expect(isWidePanoramaForTriptych(3000, 0, FRAME)).toBe(false);
    expect(isWidePanoramaForTriptych(3000, 1000, 0)).toBe(false);
  });
});

describe("computeTriptychWindowCrop", () => {
  it("produces three contiguous windows that exactly tile a band", () => {
    // 3:1 panorama, 3 windows of 2/3 * 1000 = 666.67 -> total 2000, overflow 1000.
    const w = 3000;
    const h = 1000;
    const crops = [0, 1, 2].map((i) =>
      computeTriptychWindowCrop({
        sourceWidth: w,
        sourceHeight: h,
        frameAspectRatio: FRAME,
        windowIndex: i,
        panX: 0,
      }),
    );

    // Each window has the frame aspect ratio (portrait), full height.
    for (const c of crops) {
      expect(c.cropWidth / c.cropHeight).toBeCloseTo(FRAME, 4);
      expect(c.cropHeight).toBe(h);
    }

    // Windows are contiguous: panel N right edge == panel N+1 left edge.
    expect(crops[0].cropX + crops[0].cropWidth).toBeCloseTo(crops[1].cropX, 4);
    expect(crops[1].cropX + crops[1].cropWidth).toBeCloseTo(crops[2].cropX, 4);

    // The band is centered at panX = 0 (1000px overflow -> 500px each side).
    expect(crops[0].cropX).toBeCloseTo((w - crops[0].cropWidth * 3) / 2, 4);
  });

  it("keeps windows contiguous and within source bounds across the full pan range", () => {
    const w = 4500;
    const h = 900;
    for (const panX of [-1, -0.5, 0, 0.5, 1]) {
      const crops = [0, 1, 2].map((i) =>
        computeTriptychWindowCrop({
          sourceWidth: w,
          sourceHeight: h,
          frameAspectRatio: FRAME,
          windowIndex: i,
          panX,
        }),
      );

      // Contiguity holds at every pan position.
      expect(crops[0].cropX + crops[0].cropWidth).toBeCloseTo(
        crops[1].cropX,
        4,
      );
      expect(crops[1].cropX + crops[1].cropWidth).toBeCloseTo(
        crops[2].cropX,
        4,
      );

      // Every window stays fully inside the source.
      for (const c of crops) {
        expect(c.cropX).toBeGreaterThanOrEqual(-1e-6);
        expect(c.cropX + c.cropWidth).toBeLessThanOrEqual(w + 1e-6);
      }
    }
  });

  it("reaches the source edges at the pan extremes (nothing left empty)", () => {
    const w = 3000;
    const h = 1000;

    const left = [0, 1, 2].map((i) =>
      computeTriptychWindowCrop({
        sourceWidth: w,
        sourceHeight: h,
        frameAspectRatio: FRAME,
        windowIndex: i,
        panX: -1,
      }),
    );
    // Fully panned left: panel 0 starts at the panorama's left edge.
    expect(left[0].cropX).toBeCloseTo(0, 4);
    expect(left[2].cropX + left[2].cropWidth).toBeLessThanOrEqual(w);

    const right = [0, 1, 2].map((i) =>
      computeTriptychWindowCrop({
        sourceWidth: w,
        sourceHeight: h,
        frameAspectRatio: FRAME,
        windowIndex: i,
        panX: 1,
      }),
    );
    // Fully panned right: panel 2 ends at the panorama's right edge.
    expect(right[2].cropX + right[2].cropWidth).toBeCloseTo(w, 4);
    expect(right[0].cropX).toBeGreaterThanOrEqual(0);
  });

  it("clamps panX outside [-1, 1]", () => {
    const over = computeTriptychWindowCrop({
      sourceWidth: 3000,
      sourceHeight: 1000,
      frameAspectRatio: FRAME,
      windowIndex: 2,
      panX: 5,
    });
    const atMax = computeTriptychWindowCrop({
      sourceWidth: 3000,
      sourceHeight: 1000,
      frameAspectRatio: FRAME,
      windowIndex: 2,
      panX: 1,
    });
    expect(over.cropX).toBeCloseTo(atMax.cropX, 4);
  });
});
