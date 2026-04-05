import { describe, expect, it } from "vitest";
import { resolveSlotFramePreset, FIXED_GAP_CLASS } from "./slot-frame-presets";

describe("slot-frame-presets", () => {
  it("returns horizontal preset for horizontal proportion", () => {
    const preset = resolveSlotFramePreset("horizontal");

    expect(preset.mainFrameSizeClassName).toContain("w-full");
    expect(preset.sideFrameMaxWidthClassName).toContain("max-w-");
  });

  it("returns vertical preset for vertical proportion", () => {
    const preset = resolveSlotFramePreset("vertical");

    expect(preset.mainFrameSizeClassName).toContain("w-full");
    expect(preset.sideFrameMaxWidthClassName).toContain("max-w-");
  });

  it("returns square preset for square proportion", () => {
    const preset = resolveSlotFramePreset("square");

    expect(preset.mainFrameSizeClassName).toContain("w-full");
    expect(preset.sideFrameMaxWidthClassName).toContain("max-w-");
  });

  it("normalizes rectangle to square preset", () => {
    const squarePreset = resolveSlotFramePreset("square");
    const rectanglePreset = resolveSlotFramePreset("rectangle");

    expect(rectanglePreset).toEqual(squarePreset);
  });

  it.each(["horizontal", "vertical", "square"] as const)(
    "sideFrameMaxWidthClassName includes max-w for %s",
    (proportion) => {
      const preset = resolveSlotFramePreset(proportion);

      expect(preset.sideFrameMaxWidthClassName).toContain("max-w-");
    },
  );

  it("exports a fixed gap class with responsive sizes", () => {
    expect(FIXED_GAP_CLASS).toContain("gap-");
  });
});
