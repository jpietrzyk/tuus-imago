import { describe, expect, it } from "vitest";
import { resolveSlotFramePreset } from "./slot-frame-presets";

describe("slot-frame-presets", () => {
  it("maps rectangle proportion to square preset", () => {
    expect(resolveSlotFramePreset("rectangle")).toEqual(
      resolveSlotFramePreset("square"),
    );
  });

  it.each(["horizontal", "vertical", "square"] as const)(
    "returns non-empty class names for %s",
    (proportion) => {
      const preset = resolveSlotFramePreset(proportion);

      expect(preset.mainFrameSizeClassName.length).toBeGreaterThan(0);
      expect(preset.sideFrameMinWidthClassName.length).toBeGreaterThan(0);
    },
  );
});
