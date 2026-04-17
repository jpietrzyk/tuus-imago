import { t } from "@/locales/i18n";
import type { SelectedImageItem } from "./image-uploader";

interface UploaderSlotSwitcherProps {
  slots: Array<SelectedImageItem | null>;
  activeSlotIndex: number | null;
  onSelectSlot: (index: number) => void;
  hidden?: boolean;
}

export function UploaderSlotSwitcher({
  slots,
  activeSlotIndex,
  onSelectSlot,
  hidden = false,
}: UploaderSlotSwitcherProps) {
  return (
    <div
      hidden={hidden}
      className="flex w-full items-center justify-between rounded-full border border-border/70 bg-muted/55 px-3 py-1.5 shadow-sm backdrop-blur-sm"
      role="group"
      aria-label={t("uploader.previewSlotNavigation")}
      data-testid="uploader-slot-dots"
    >
      {slots.map((slot, index) => {
        const isActive = activeSlotIndex === index;

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
            data-testid={`uploader-slot-dot-${index}`}
            className={`group inline-flex h-5 w-5 items-center justify-center rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
              isActive
                ? "scale-110"
                : "scale-100 hover:scale-105 active:scale-95"
            }`}
          >
            <span
              className={`block rounded-full transition-all duration-200 ${
                slot
                  ? isActive
                    ? "h-3 w-3 bg-primary shadow-[0_0_0_5px_rgba(15,23,42,0.12)]"
                    : "h-2.5 w-2.5 bg-foreground/65 group-hover:bg-foreground/80"
                  : isActive
                    ? "h-3 w-3 border border-dashed border-primary bg-primary/20"
                    : "h-2.5 w-2.5 border border-dashed border-muted-foreground bg-background/20"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

export default UploaderSlotSwitcher;
