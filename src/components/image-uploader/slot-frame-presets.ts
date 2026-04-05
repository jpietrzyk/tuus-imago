import type { ImageDisplayProportion } from "./image-proportion-calculator";

type SlotPresetKey = "horizontal" | "vertical" | "square";

interface SlotFramePreset {
  /** Responsive max-width classes for the center (active) preview frame. */
  mainFrameSizeClassName: string;
  /** Responsive min-width classes for the side slot inner frame (image container). */
  sideFrameMinWidthClassName: string;
  /**
   * Responsive min-width + max-width classes for the side slot outer button.
   * Min-width prevents the button from shrinking below the inner frame floor;
   * max-width caps growth so the gap between center and side stays consistent.
   */
  sideFrameMaxWidthClassName: string;
}

const SLOT_FRAME_PRESETS: Record<SlotPresetKey, SlotFramePreset> = {
  horizontal: {
    mainFrameSizeClassName: "w-full",
    sideFrameMinWidthClassName: "min-w-0",
    sideFrameMaxWidthClassName: "min-w-0 max-w-[200px] sm:max-w-[240px] md:max-w-[290px] lg:max-w-[340px]",
  },
  vertical: {
    mainFrameSizeClassName: "w-full",
    sideFrameMinWidthClassName: "min-w-0",
    sideFrameMaxWidthClassName: "min-w-0 max-w-[132px] sm:max-w-[156px] md:max-w-[184px] lg:max-w-[212px]",
  },
  square: {
    mainFrameSizeClassName: "w-full",
    sideFrameMinWidthClassName: "min-w-0",
    sideFrameMaxWidthClassName: "min-w-0 max-w-[160px] sm:max-w-[192px] md:max-w-[224px] lg:max-w-[264px]",
  },
};

const normalizeSlotPresetKey = (
  proportion: ImageDisplayProportion,
): SlotPresetKey => {
  if (proportion === "rectangle") {
    return "square";
  }

  return proportion;
};

export const resolveSlotFramePreset = (
  proportion: ImageDisplayProportion,
): SlotFramePreset => {
  return SLOT_FRAME_PRESETS[normalizeSlotPresetKey(proportion)];
};

export const FIXED_GAP_CLASS = "gap-2 sm:gap-3 md:gap-4";
