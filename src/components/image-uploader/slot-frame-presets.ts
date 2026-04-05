import type { ImageDisplayProportion } from "./image-proportion-calculator";

type SlotPresetKey = "horizontal" | "vertical" | "square";

interface SlotFramePreset {
  mainFrameSizeClassName: string;
  sideFrameMinWidthClassName: string;
  sideFrameMaxWidthClassName: string;
}

const SLOT_FRAME_PRESETS: Record<SlotPresetKey, SlotFramePreset> = {
  horizontal: {
    mainFrameSizeClassName:
      "w-full max-w-[72rem] md:max-w-[84rem] lg:max-w-[96rem]",
    sideFrameMinWidthClassName:
      "min-w-[132px] sm:min-w-[156px] md:min-w-[188px] lg:min-w-[220px]",
    sideFrameMaxWidthClassName:
      "max-w-[200px] sm:max-w-[240px] md:max-w-[290px] lg:max-w-[340px]",
  },
  vertical: {
    mainFrameSizeClassName:
      "w-full max-w-[40rem] md:max-w-[48rem] lg:max-w-[56rem]",
    sideFrameMinWidthClassName:
      "min-w-[88px] sm:min-w-[104px] md:min-w-[124px] lg:min-w-[140px]",
    sideFrameMaxWidthClassName:
      "max-w-[132px] sm:max-w-[156px] md:max-w-[184px] lg:max-w-[212px]",
  },
  square: {
    mainFrameSizeClassName:
      "w-full max-w-[52rem] md:max-w-[60rem] lg:max-w-[68rem]",
    sideFrameMinWidthClassName:
      "min-w-[100px] sm:min-w-[116px] md:min-w-[136px] lg:min-w-[156px]",
    sideFrameMaxWidthClassName:
      "max-w-[160px] sm:max-w-[192px] md:max-w-[224px] lg:max-w-[264px]",
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
