import IconAdd from "@/components/icons/icon-add.svg?react";
import { t } from "@/locales/i18n";
import SlotPreviewCanvas from "./slot-preview-canvas";
import type { SelectedImageItem } from "./image-uploader";

export interface SlotSwitcherBarProps {
  slots: Array<SelectedImageItem | null>;
  activeSlotIndex: number | null;
  onSelectSlot: (index: number) => void;
  hidden: boolean;
}

interface UploaderSlotSwitcherProps {
  slots: Array<SelectedImageItem | null>;
  activeSlotIndex: number | null;
  onSelectSlot: (index: number) => void;
  hidden?: boolean;
  getSlotPreviewUrl?: (image: SelectedImageItem) => string;
  testIdPrefix?: string;
}

export function UploaderSlotSwitcher({
  slots,
  activeSlotIndex,
  onSelectSlot,
  hidden = false,
  getSlotPreviewUrl,
  testIdPrefix = "uploader-slot",
}: UploaderSlotSwitcherProps) {
  return (
    <div
      hidden={hidden}
      className="mx-auto flex w-fit items-center justify-center gap-2 rounded-full border border-border/70 bg-muted/30 px-3 py-1.5 shadow-sm backdrop-blur-sm"
      role="group"
      aria-label={t("uploader.previewSlotNavigation")}
      data-testid={`${testIdPrefix}-dots`}
    >
      {slots.map((slot, index) => {
        const isActive = activeSlotIndex === index;
        const previewUrl = slot
          ? (getSlotPreviewUrl?.(slot) ?? slot.previewUrl)
          : null;

        return (
          <button
            key={index}
            type="button"
            onClick={() => onSelectSlot(index)}
            aria-pressed={isActive}
            aria-label={
              slot
                ? t("uploader.selectImageSlot", {
                    index: String(index + 1),
                  })
                : t("uploader.addImageSlot", {
                    index: String(index + 1),
                  })
            }
            data-testid={`${testIdPrefix}-dot-${index}`}
            className={`group relative flex h-14 w-11 items-center justify-center overflow-hidden rounded-md border bg-background/60 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
              isActive
                ? "border-primary ring-2 ring-primary"
                : "border-border/70 hover:border-foreground/40"
            }`}
          >
            {slot && previewUrl ? (
              <SlotPreviewCanvas
                image={slot}
                previewUrl={previewUrl}
                useCloudPreview={!!slot.uploadedAsset}
                className="h-full w-full"
                testId={`${testIdPrefix}-canvas-${index}`}
                debugLabel={`slot-thumb ${index}`}
              />
            ) : (
              <IconAdd
                className="h-4 w-4 text-muted-foreground/60"
                aria-hidden="true"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

export default UploaderSlotSwitcher;
