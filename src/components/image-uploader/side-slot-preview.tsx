import { Plus } from "lucide-react";
import { t } from "@/locales/i18n";
import type { SelectedImageItem } from "./image-uploader";

interface SideSlotPreviewProps {
  position: "left" | "right";
  slotIndex: number | null;
  image: SelectedImageItem | null;
  previewFrameAspectRatio: number;
  onSelectSlot: (index: number) => void;
}

export default function SideSlotPreview({
  position,
  slotIndex,
  image,
  previewFrameAspectRatio,
  onSelectSlot,
}: SideSlotPreviewProps) {
  const isLeft = position === "left";

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
      className={`h-full w-16 md:w-28 lg:w-40 xl:w-48 shrink-0 overflow-hidden rounded-md bg-transparent disabled:cursor-default disabled:opacity-70 ${
        isLeft ? "flex items-start justify-end" : ""
      }`}
    >
      <div
        data-testid={
          isLeft
            ? "uploader-slider-side-left-preview-frame"
            : "uploader-slider-side-right-preview-frame"
        }
        className={`flex h-full w-auto max-w-none min-w-[280px] shrink-0 md:min-w-[300px] lg:min-w-[320px] overflow-hidden rounded-md border-2 border-dashed ${
          isLeft ? "items-start justify-end" : "items-center justify-start"
        } ${image ? "border-border/35" : "border-border/60"}`}
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
