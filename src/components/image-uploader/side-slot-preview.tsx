import { Plus } from "lucide-react";
import { t } from "@/locales/i18n";
import type { SelectedImageItem } from "./image-uploader";
import type { ImageDisplayProportion } from "./image-proportion-calculator";
import { resolveSlotFramePreset } from "./slot-frame-presets";

interface SideSlotPreviewProps {
  position: "left" | "right";
  slotIndex: number | null;
  image: SelectedImageItem | null;
  previewFrameAspectRatio: number;
  selectedProportion: ImageDisplayProportion;
  isNavigable: boolean;
  onSelectSlot: (index: number) => void;
}

export default function SideSlotPreview({
  position,
  slotIndex,
  image,
  previewFrameAspectRatio,
  selectedProportion,
  isNavigable,
  onSelectSlot,
}: SideSlotPreviewProps) {
  const isLeft = position === "left";
  const slotFramePreset = resolveSlotFramePreset(selectedProportion);
  const slotAspectRatioClassName =
    selectedProportion === "vertical"
      ? "aspect-[2/3]"
      : selectedProportion === "horizontal"
        ? "aspect-[16/9]"
        : "aspect-square";

  return (
    <button
      type="button"
      onClick={() => {
        if (typeof slotIndex === "number") {
          onSelectSlot(slotIndex);
        }
      }}
      disabled={slotIndex === null}
      data-testid={
        isLeft ? "uploader-slider-side-left" : "uploader-slider-side-right"
      }
      aria-label={t(isLeft ? "uploader.previousImage" : "uploader.nextImage")}
      className={`h-full w-12 md:w-20 lg:w-28 xl:w-36 shrink-0 overflow-hidden rounded-none bg-transparent transition-transform duration-200 ease-out motion-reduce:transform-none motion-reduce:transition-none disabled:cursor-default disabled:opacity-70 ${
        isLeft
          ? "flex items-start justify-end md:-mr-4 lg:-mr-6"
          : "md:-ml-4 lg:-ml-6"
      } ${
        isNavigable
          ? "scale-[0.985] md:scale-[0.995]"
          : "scale-[0.965] md:scale-[0.985]"
      }`}
    >
      <div
        data-testid={
          isLeft
            ? "uploader-slider-side-left-preview-frame"
            : "uploader-slider-side-right-preview-frame"
        }
        className={`flex h-full w-full min-w-0 max-w-full ${slotFramePreset.sideFrameMinWidthClassName} ${slotAspectRatioClassName} overflow-hidden rounded-none border-0 transition-opacity duration-200 ease-out motion-reduce:transition-none ${
          isLeft ? "items-start justify-end" : "items-center justify-start"
        } ${
          image
            ? isNavigable
              ? "opacity-95 md:opacity-92"
              : "opacity-80 md:opacity-75"
            : "opacity-70 md:opacity-65"
        }`}
        style={{
          aspectRatio: String(previewFrameAspectRatio),
        }}
      >
        {image ? (
          <img
            src={image.previewUrl}
            alt={
              typeof slotIndex === "number"
                ? t("uploader.selectImageSlot", {
                    index: String(slotIndex + 1),
                  })
                : ""
            }
            className="h-full w-full object-cover object-center"
            draggable={false}
          />
        ) : (
          <Plus className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        )}
      </div>
    </button>
  );
}
