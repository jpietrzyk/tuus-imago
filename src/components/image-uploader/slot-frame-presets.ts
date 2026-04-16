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
      "min-w-[56px] sm:min-w-[72px] md:min-w-[110px] lg:min-w-[168px]",
  },
  vertical: {
    mainFrameSizeClassName:
      "w-full max-w-[40rem] md:max-w-[48rem] lg:max-w-[56rem]",
    sideFrameMinWidthClassName:
      "min-w-[40px] sm:min-w-[52px] md:min-w-[70px] lg:min-w-[100px]",
  },
  square: {
    mainFrameSizeClassName:
      "w-full max-w-[52rem] md:max-w-[60rem] lg:max-w-[68rem]",
    sideFrameMinWidthClassName:
      "min-w-[48px] sm:min-w-[60px] md:min-w-[80px] lg:min-w-[112px]",
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
