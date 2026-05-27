import { Button } from "@/components/ui/button";
import {
  PAINTING_SIZE_OPTIONS,
  type PaintingSize,
} from "./painting-size";

const SIZE_BUTTON_CLASS =
  "h-8 sm:h-[2.25rem] w-[4.5rem] sm:w-[5rem] rounded-2xl shadow-lg border-2 flex-col gap-0 p-1";

interface SizeSelectorProps {
  hidden?: boolean;
  selectedSize: PaintingSize;
  onSelectSize: (size: PaintingSize) => void;
}

export function SizeSelector({
  hidden = false,
  selectedSize,
  onSelectSize,
}: SizeSelectorProps) {
  return (
    <div className="py-1" hidden={hidden}>
      <div className="flex justify-center">
        <div className="inline-flex flex-col gap-0.5">
          <p className="text-xs text-muted-foreground">Wybierz rozmiar</p>
          <div className="flex items-center justify-center gap-1.5">
            {PAINTING_SIZE_OPTIONS.map(({ size, label }) => {
              const isSelected = size === selectedSize;
              return (
                <Button
                  key={size}
                  type="button"
                  variant={isSelected ? "default" : "secondary"}
                  id={`size-btn-${size}`}
                  className={SIZE_BUTTON_CLASS}
                  onClick={() => onSelectSize(size)}
                  aria-pressed={isSelected}
                >
                  <span className="text-[9px] leading-none truncate w-full text-center">
                    {label}
                  </span>
                  <span className="text-[9px] leading-none truncate w-full text-center">
                    cm
                  </span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
