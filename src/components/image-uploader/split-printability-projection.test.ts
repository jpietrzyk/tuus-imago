import { describe, expect, it } from "vitest";
import {
  projectTriptychPrintability,
  TRIPTYCH_PROJECTED_SHAPE,
} from "./split-printability-projection";

describe("projectTriptychPrintability", () => {
  it("projects center panel as one third of the source width against rectangular sizes", () => {
    const result = projectTriptychPrintability(7500, 5000, 2);

    expect(result.projectedSizesDpiInfo).toHaveLength(5);
    expect(result.noSizePrintable).toBe(false);
    // 90x60 (index 2) falls below minDpi with a 2500px-wide center panel
    expect(result.willSelectedSizeBeBlocked).toBe(true);
  });

  it("flags no printable size when the source is too small after split", () => {
    const result = projectTriptychPrintability(4500, 3000, 2);

    expect(result.noSizePrintable).toBe(true);
    expect(result.willSelectedSizeBeBlocked).toBe(true);
  });

  it("keeps the selected size available for a high-resolution source", () => {
    const result = projectTriptychPrintability(15000, 10000, 2);

    expect(result.willSelectedSizeBeBlocked).toBe(false);
    expect(result.noSizePrintable).toBe(false);
  });

  it("treats a square-only selected index as blocked for the rectangular projection", () => {
    const result = projectTriptychPrintability(15000, 15000, 0);

    expect(result.projectedSizesDpiInfo.find((i) => i.sizeIndex === 0)).toBeUndefined();
    expect(result.willSelectedSizeBeBlocked).toBe(true);
  });

  it("uses rectangular as the default projected shape", () => {
    expect(TRIPTYCH_PROJECTED_SHAPE).toBe("rectangular");
  });
});
