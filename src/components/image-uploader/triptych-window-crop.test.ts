import { describe, expect, it } from "vitest";
import {
  computeTriptychWindowCrop,
  resolveTriptychSlotCrop,
} from "./triptych-window-crop";

// Portrait frame aspect (vertical proportion) = 2/3.
const FRAME = 2 / 3;

describe("computeTriptychWindowCrop", () => {
  it("tiles a 2:1 source exactly with no pan room at rest (boundary aspect)", () => {
    // Aspect 2.0 == 3 × frame: the three full-height windows tile the source
    // width exactly, matching the legacy centered per-third split at rest —
    // but zoom/pan stays shared so the panels remain glued.
    const w = 2400;
    const h = 1200;
    const crops = [0, 1, 2].map((i) =>
      computeTriptychWindowCrop({
        sourceWidth: w,
        sourceHeight: h,
        frameAspectRatio: FRAME,
        windowIndex: i,
        panX: 0,
      }),
    );

    for (const c of crops) {
      expect(c.cropWidth / c.cropHeight).toBeCloseTo(FRAME, 4);
      expect(c.cropHeight).toBe(h);
      expect(c.cropWidth).toBeCloseTo(w / 3, 4);
    }
    expect(crops[0].cropX).toBeCloseTo(0, 4);
    expect(crops[0].cropX + crops[0].cropWidth).toBeCloseTo(crops[1].cropX, 4);
    expect(crops[1].cropX + crops[1].cropWidth).toBeCloseTo(crops[2].cropX, 4);
    expect(crops[2].cropX + crops[2].cropWidth).toBeCloseTo(w, 4);
    expect(crops[0].panRange).toBe(0);
    expect(crops[0].panRangeY).toBe(0);
  });

  it("keeps 2:1 windows glued and centered while zooming (shared band zoom)", () => {
    // The user-visible regression: zooming a ~2:1 triptych must shrink the
    // whole band around its shared center so content at a panel seam stays at
    // the seam, instead of each panel zooming to its own center.
    const w = 2400;
    const h = 1200;
    const zoom = 2;
    const crops = [0, 1, 2].map((i) =>
      computeTriptychWindowCrop({
        sourceWidth: w,
        sourceHeight: h,
        frameAspectRatio: FRAME,
        windowIndex: i,
        panX: 0,
        zoom,
      }),
    );

    // Zoom creates horizontal band room (source 2400 vs band 1200).
    expect(crops[0].panRange).toBeCloseTo(w - h, 4);
    // The band stays centered and contiguous: every window shrinks by zoom,
    // the seams move with the band, and the middle window stays centered on
    // the source center (shared zoom, not per-panel center zoom).
    for (const c of crops) {
      expect(c.cropWidth).toBeCloseTo((h / zoom) * FRAME, 4);
    }
    expect(crops[0].cropX + crops[0].cropWidth).toBeCloseTo(crops[1].cropX, 4);
    expect(crops[1].cropX + crops[1].cropWidth).toBeCloseTo(crops[2].cropX, 4);
    expect(crops[1].cropX + crops[1].cropWidth / 2).toBeCloseTo(w / 2, 4);
  });

  it("shrinks narrower-source windows via the band-fit zoom so the band tiles the width", () => {
    // 3:2 source: the 3-window band (2 × source height wide) would overflow,
    // so windows shrink to 2/3 height while keeping the frame aspect — the
    // same region the legacy centered per-third split showed at rest.
    const w = 1500;
    const h = 1000;
    const fitZoom = 2 * (1 / (w / h));
    const crops = [0, 1, 2].map((i) =>
      computeTriptychWindowCrop({
        sourceWidth: w,
        sourceHeight: h,
        frameAspectRatio: FRAME,
        windowIndex: i,
        panX: 0,
      }),
    );

    for (const c of crops) {
      expect(c.cropWidth / c.cropHeight).toBeCloseTo(FRAME, 4);
      expect(c.cropHeight).toBeCloseTo(h / fitZoom, 4);
      expect(c.cropWidth).toBeCloseTo(w / 3, 4);
    }
    expect(crops[0].cropX).toBeCloseTo(0, 4);
    expect(crops[2].cropX + crops[2].cropWidth).toBeCloseTo(w, 4);
    expect(crops[0].panRange).toBe(0);
    expect(crops[0].panRangeY).toBeCloseTo(h - h / fitZoom, 4);
  });

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

  it("shrinks every window by the shared zoom while keeping contiguity and frame aspect", () => {
    const w = 3000;
    const h = 1000;
    const zoom = 2;
    const crops = [0, 1, 2].map((i) =>
      computeTriptychWindowCrop({
        sourceWidth: w,
        sourceHeight: h,
        frameAspectRatio: FRAME,
        windowIndex: i,
        panX: 0,
        panY: 0,
        zoom,
      }),
    );

    // Each window keeps the frame aspect and is half the base size.
    for (const c of crops) {
      expect(c.cropWidth / c.cropHeight).toBeCloseTo(FRAME, 4);
      expect(c.cropHeight).toBeCloseTo(h / zoom, 4);
      expect(c.cropWidth).toBeCloseTo((h / zoom) * FRAME, 4);
    }

    // Windows stay contiguous at zoom 2 (panel N right edge == panel N+1 left).
    expect(crops[0].cropX + crops[0].cropWidth).toBeCloseTo(crops[1].cropX, 4);
    expect(crops[1].cropX + crops[1].cropWidth).toBeCloseTo(crops[2].cropX, 4);

    // Zoom creates vertical headroom; at zoom 1 there is none.
    expect(crops[0].panRangeY).toBeCloseTo(h - h / zoom, 4);
    const baseZoom1 = computeTriptychWindowCrop({
      sourceWidth: w,
      sourceHeight: h,
      frameAspectRatio: FRAME,
      windowIndex: 0,
      panX: 0,
    });
    expect(baseZoom1.panRangeY).toBe(0);
  });

  it("travels windows vertically via panY and clamps within the source height", () => {
    const w = 3000;
    const h = 1000;
    const zoom = 2; // cropHeight = 500, vertical room = 500

    for (const panY of [-1, -0.5, 0, 0.5, 1]) {
      const crops = [0, 1, 2].map((i) =>
        computeTriptychWindowCrop({
          sourceWidth: w,
          sourceHeight: h,
          frameAspectRatio: FRAME,
          windowIndex: i,
          panX: 0,
          panY,
          zoom,
        }),
      );

      // panY shifts every window by the same amount (shared), so contiguity
      // is preserved and the window never leaves the source vertically.
      for (const c of crops) {
        expect(c.cropY).toBeGreaterThanOrEqual(-1e-6);
        expect(c.cropY + c.cropHeight).toBeLessThanOrEqual(h + 1e-6);
      }
      // All three windows share the same vertical position.
      expect(crops[0].cropY).toBeCloseTo(crops[1].cropY, 4);
      expect(crops[1].cropY).toBeCloseTo(crops[2].cropY, 4);
    }

    // At panY = 0 the zoomed window is vertically centred.
    const centered = computeTriptychWindowCrop({
      sourceWidth: w,
      sourceHeight: h,
      frameAspectRatio: FRAME,
      windowIndex: 0,
      panX: 0,
      panY: 0,
      zoom: 2,
    });
    expect(centered.cropY).toBeCloseTo((h - 500) / 2, 4);
  });

  it("matches the legacy (no-zoom) output exactly at the defaults", () => {
    const w = 3000;
    const h = 1000;
    const explicit = [0, 1, 2].map((i) =>
      computeTriptychWindowCrop({
        sourceWidth: w,
        sourceHeight: h,
        frameAspectRatio: FRAME,
        windowIndex: i,
        panX: 0,
        zoom: 1,
        panY: 0,
      }),
    );
    const defaulted = [0, 1, 2].map((i) =>
      computeTriptychWindowCrop({
        sourceWidth: w,
        sourceHeight: h,
        frameAspectRatio: FRAME,
        windowIndex: i,
        panX: 0,
      }),
    );

    for (let i = 0; i < 3; i += 1) {
      expect(explicit[i].cropX).toBe(defaulted[i].cropX);
      expect(explicit[i].cropY).toBe(defaulted[i].cropY);
      expect(explicit[i].cropWidth).toBe(defaulted[i].cropWidth);
      expect(explicit[i].cropHeight).toBe(defaulted[i].cropHeight);
      expect(explicit[i].cropHeight).toBe(h);
    }
  });

  it("does not raise the effective zoom when the band already fits (vertical regression)", () => {
    // 3:1 panorama with portrait windows: band = 2.0 × height < width.
    const crop = computeTriptychWindowCrop({
      sourceWidth: 3000,
      sourceHeight: 1000,
      frameAspectRatio: FRAME,
      windowIndex: 0,
      panX: 0,
    });
    expect(crop.cropHeight).toBe(1000);
    expect(crop.panRange).toBeCloseTo(1000, 4);
    expect(crop.panRangeY).toBe(0);
  });
});

describe("linked shape changes", () => {
  it("tiles square windows exactly across the panorama when the band fits", () => {
    // 3:1 panorama, square windows: band = 3 × height = source width exactly.
    const w = 3000;
    const h = 1000;
    const crops = [0, 1, 2].map((i) =>
      computeTriptychWindowCrop({
        sourceWidth: w,
        sourceHeight: h,
        frameAspectRatio: 1,
        windowIndex: i,
        panX: 0,
      }),
    );

    for (const c of crops) {
      expect(c.cropWidth / c.cropHeight).toBeCloseTo(1, 4);
      expect(c.cropX).toBeGreaterThanOrEqual(-1e-6);
      expect(c.cropX + c.cropWidth).toBeLessThanOrEqual(w + 1e-6);
    }

    // The band fills the width exactly: no scroll, windows edge-to-edge.
    expect(crops[0].cropX).toBeCloseTo(0, 4);
    expect(crops[0].cropX + crops[0].cropWidth).toBeCloseTo(crops[1].cropX, 4);
    expect(crops[2].cropX + crops[2].cropWidth).toBeCloseTo(w, 4);
    expect(crops[0].panRange).toBe(0);
  });

  it("shrinks windows via the band-fit zoom when a square band would overflow", () => {
    // 2.5:1 panorama, square windows: fit zoom = 3 / 2.5 = 1.2, so each
    // window is h/1.2 tall and the band tiles the width exactly.
    const w = 2500;
    const h = 1000;
    const fitZoom = 1.2;
    const crops = [0, 1, 2].map((i) =>
      computeTriptychWindowCrop({
        sourceWidth: w,
        sourceHeight: h,
        frameAspectRatio: 1,
        windowIndex: i,
        panX: 0,
      }),
    );

    for (const c of crops) {
      expect(c.cropWidth / c.cropHeight).toBeCloseTo(1, 4);
      expect(c.cropHeight).toBeCloseTo(h / fitZoom, 4);
      expect(c.cropX).toBeGreaterThanOrEqual(-1e-6);
      expect(c.cropX + c.cropWidth).toBeLessThanOrEqual(w + 1e-6);
      expect(c.cropY).toBeGreaterThanOrEqual(-1e-6);
      expect(c.cropY + c.cropHeight).toBeLessThanOrEqual(h + 1e-6);
    }

    expect(crops[0].cropX).toBeCloseTo(0, 4);
    expect(crops[2].cropX + crops[2].cropWidth).toBeCloseTo(w, 4);
    // The fit zoom creates vertical pan headroom instead of horizontal room.
    expect(crops[0].panRange).toBe(0);
    expect(crops[0].panRangeY).toBeCloseTo(h - h / fitZoom, 4);
  });

  it("keeps landscape windows in-bounds and contiguous on a 3:1 panorama", () => {
    // Landscape (3:2) windows: band would be 4.5 × height, so the windows
    // shrink to fit (fit zoom 1.5) while keeping the landscape aspect.
    const w = 3000;
    const h = 1000;
    const fitZoom = 1.5;
    const crops = [0, 1, 2].map((i) =>
      computeTriptychWindowCrop({
        sourceWidth: w,
        sourceHeight: h,
        frameAspectRatio: 1.5,
        windowIndex: i,
        panX: 0,
      }),
    );

    for (const c of crops) {
      expect(c.cropWidth / c.cropHeight).toBeCloseTo(1.5, 4);
      expect(c.cropHeight).toBeCloseTo(h / fitZoom, 4);
      expect(c.cropX).toBeGreaterThanOrEqual(-1e-6);
      expect(c.cropX + c.cropWidth).toBeLessThanOrEqual(w + 1e-6);
    }

    expect(crops[0].cropX).toBeCloseTo(0, 4);
    expect(crops[0].cropX + crops[0].cropWidth).toBeCloseTo(crops[1].cropX, 4);
    expect(crops[1].cropX + crops[1].cropWidth).toBeCloseTo(crops[2].cropX, 4);
    expect(crops[2].cropX + crops[2].cropWidth).toBeCloseTo(w, 4);
  });

  it("never lets a user zoom fall below the band-fit zoom", () => {
    // Zooming out (zoom 1) with landscape windows must not restore the
    // overflowing band — the fit zoom wins.
    const crop = computeTriptychWindowCrop({
      sourceWidth: 3000,
      sourceHeight: 1000,
      frameAspectRatio: 1.5,
      windowIndex: 2,
      panX: 0,
      zoom: 1,
    });
    expect(crop.cropHeight).toBeCloseTo(1000 / 1.5, 4);
    expect(crop.cropX + crop.cropWidth).toBeLessThanOrEqual(3000 + 1e-6);
  });

  it("keeps shape-changed windows contiguous across panY travel", () => {
    const w = 2500;
    const h = 1000;
    for (const panY of [-1, 0, 1]) {
      const crops = [0, 1, 2].map((i) =>
        computeTriptychWindowCrop({
          sourceWidth: w,
          sourceHeight: h,
          frameAspectRatio: 1,
          windowIndex: i,
          panX: 0,
          panY,
        }),
      );

      expect(crops[0].cropX + crops[0].cropWidth).toBeCloseTo(
        crops[1].cropX,
        4,
      );
      for (const c of crops) {
        expect(c.cropY).toBeGreaterThanOrEqual(-1e-6);
        expect(c.cropY + c.cropHeight).toBeLessThanOrEqual(h + 1e-6);
      }
    }
  });
});

describe("resolveTriptychSlotCrop", () => {
  it("derives the frame aspect from the display proportion and applies cropAdjust", () => {
    const w = 3000;
    const h = 1000;
    const cropAdjust = { zoom: 2, panX: 0.4, panY: -0.5 };

    for (const windowIndex of [0, 1, 2]) {
      const resolved = resolveTriptychSlotCrop({
        sourceWidth: w,
        sourceHeight: h,
        displayImageProportion: "vertical",
        windowIndex,
        cropAdjust,
      });
      const direct = computeTriptychWindowCrop({
        sourceWidth: w,
        sourceHeight: h,
        frameAspectRatio: FRAME,
        windowIndex,
        panX: cropAdjust.panX,
        panY: cropAdjust.panY,
        zoom: cropAdjust.zoom,
      });

      expect(resolved.cropX).toBe(direct.cropX);
      expect(resolved.cropY).toBe(direct.cropY);
      expect(resolved.cropWidth).toBe(direct.cropWidth);
      expect(resolved.cropHeight).toBe(direct.cropHeight);
    }
  });

  it("defaults to zoom 1 / no pan when cropAdjust is absent", () => {
    const resolved = resolveTriptychSlotCrop({
      sourceWidth: 3000,
      sourceHeight: 1000,
      displayImageProportion: "vertical",
      windowIndex: 0,
    });
    const baseZoom1 = computeTriptychWindowCrop({
      sourceWidth: 3000,
      sourceHeight: 1000,
      frameAspectRatio: FRAME,
      windowIndex: 0,
      panX: 0,
    });
    expect(resolved.cropX).toBe(baseZoom1.cropX);
    expect(resolved.cropHeight).toBe(1000);
  });
});
