import { Button } from "@/components/ui/button";
import {
  getPaintingSizeOptions,
  type PaintingShape,
  type PaintingSizeIndex,
} from "./painting-size";

const SIZE_BUTTON_CLASS =
  "h-8 sm:h-[2.25rem] w-[4.5rem] sm:w-[5rem] rounded-2xl shadow-lg border-2 flex-col gap-0 p-1";

interface SizeSelectorProps {
  hidden?: boolean;
  shape: PaintingShape;
  selectedIndex: PaintingSizeIndex;
  onSelectSize: (index: PaintingSizeIndex) => void;
}

export function SizeSelector({
  hidden = false,
  shape,
  selectedIndex,
  onSelectSize,
}: SizeSelectorProps) {
  const options = getPaintingSizeOptions(shape);

  return (
    <div className="py-1" hidden={hidden}>
      <div className="flex justify-center">
        <div className="inline-flex flex-col gap-0.5">
          <p className="text-xs text-muted-foreground">Wybierz rozmiar</p>
          <div className="flex items-center justify-center gap-1.5">
            {options.map(({ key, label }) => {
              const isSelected = key === selectedIndex;
              return (
                <Button
                  key={key}
                  type="button"
                  variant={isSelected ? "default" : "secondary"}
                  id={`size-btn-${key}`}
                  className={SIZE_BUTTON_CLASS}
                  onClick={() => onSelectSize(key)}
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
