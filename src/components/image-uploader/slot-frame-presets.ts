import type { ImageDisplayProportion } from "./image-proportion-calculator";

type SlotPresetKey = "horizontal" | "vertical" | "square";

interface SlotFramePreset {
  mainFrameSizeClassName: string;
  sideFrameMinWidthClassName: string;
}

const SLOT_FRAME_PRESETS: Record<SlotPresetKey, SlotFramePreset> = {
  horizontal: {
    mainFrameSizeClassName:
      "w-full max-w-[72rem] md:max-w-[84rem] lg:max-w-[96rem]",
    sideFrameMinWidthClassName:
      "min-w-[96px] sm:min-w-[112px] md:min-w-[140px] lg:min-w-[168px]",
  },
  vertical: {
    mainFrameSizeClassName:
      "w-full max-w-[40rem] md:max-w-[48rem] lg:max-w-[56rem]",
    sideFrameMinWidthClassName:
      "min-w-[60px] sm:min-w-[72px] md:min-w-[88px] lg:min-w-[100px]",
  },
  square: {
    mainFrameSizeClassName:
      "w-full max-w-[52rem] md:max-w-[60rem] lg:max-w-[68rem]",
    sideFrameMinWidthClassName:
      "min-w-[72px] sm:min-w-[84px] md:min-w-[100px] lg:min-w-[112px]",
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
