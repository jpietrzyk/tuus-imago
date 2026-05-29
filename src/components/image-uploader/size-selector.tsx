import { Button } from "@/components/ui/button";
import { t } from "@/locales/i18n";
import {
  getPaintingSizeOptions,
  type PaintingShape,
  type PaintingSizeIndex,
} from "./painting-size";
import type { SizeDpiInfo } from "./size-dpi-availability";
import type { DpiQuality } from "./image-dpi-calculator";

const SIZE_BUTTON_CLASS =
  "h-8 sm:h-[2.25rem] w-[4.5rem] sm:w-[5rem] rounded-2xl shadow-lg border-2 flex-col gap-0 p-1";

const QUALITY_DOT_COLORS: Record<Exclude<DpiQuality, "low">, string> = {
  excellent: "bg-green-500",
  good: "bg-yellow-500",
  acceptable: "bg-gray-400",
};

interface SizeSelectorProps {
  hidden?: boolean;
  shape: PaintingShape;
  selectedIndex: PaintingSizeIndex;
  onSelectSize: (index: PaintingSizeIndex) => void;
  sizesDpiInfo?: SizeDpiInfo[];
}

export function SizeSelector({
  hidden = false,
  shape,
  selectedIndex,
  onSelectSize,
  sizesDpiInfo,
}: SizeSelectorProps) {
  const options = getPaintingSizeOptions(shape);

  return (
    <div className="py-1" hidden={hidden}>
      <div className="flex justify-center">
        <div className="inline-flex flex-col gap-0.5">
          <p className="text-xs text-muted-foreground">{t("uploader.selectSize")}</p>
          <div className="flex items-center justify-center gap-1.5">
            {options.map(({ key, label }) => {
              const isSelected = key === selectedIndex;
              const dpiInfo = sizesDpiInfo?.find(
                (info) => info.sizeIndex === key,
              );
              const isAvailable = dpiInfo ? dpiInfo.isAvailable : true;
              const quality = dpiInfo?.quality;

              return (
                <Button
                  key={key}
                  type="button"
                  variant={isSelected ? "default" : "secondary"}
                  id={`size-btn-${key}`}
                  className={`${SIZE_BUTTON_CLASS} ${!isAvailable ? "opacity-40" : ""}`}
                  onClick={() => onSelectSize(key)}
                  aria-pressed={isSelected}
                  disabled={!isAvailable}
                  title={
                    !isAvailable ? t("uploader.sizeUnavailable") : undefined
                  }
                >
                  <span
                    className={`text-[9px] leading-none truncate w-full text-center ${!isAvailable ? "line-through" : ""}`}
                  >
                    {label}
                  </span>
                  <span className="text-[9px] leading-none truncate w-full text-center">
                    cm
                  </span>
                  {quality && quality !== "low" && isAvailable && (
                    <span
                      className={`inline-block h-1.5 w-1.5 rounded-full ${QUALITY_DOT_COLORS[quality]}`}
                    />
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
