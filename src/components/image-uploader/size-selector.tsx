import { Button } from "@/components/ui/button";

const SIZE_BUTTON_CLASS =
  "h-8 sm:h-[2.25rem] w-[4.5rem] sm:w-[5rem] rounded-2xl shadow-lg border-2 flex-col gap-0 p-1";

const SIZE_OPTIONS = [
  { id: "size-btn-40", label: "40 x 40" },
  { id: "size-btn-50", label: "50 x 50" },
  { id: "size-btn-60", label: "60 x 60" },
  { id: "size-btn-80", label: "80 x 80" },
  { id: "size-btn-100", label: "100 x 100" },
] as const;

interface SizeSelectorProps {
  hidden?: boolean;
}

export function SizeSelector({ hidden = false }: SizeSelectorProps) {
  return (
    <div className="py-1" hidden={hidden}>
      <div className="flex items-center justify-center gap-1.5">
        {SIZE_OPTIONS.map(({ id, label }) => (
          <Button
            key={id}
            type="button"
            variant="secondary"
            id={id}
            className={SIZE_BUTTON_CLASS}
          >
            <span className="text-[9px] leading-none truncate w-full text-center">
              {label}
            </span>
            <span className="text-[9px] leading-none truncate w-full text-center">
              cm
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}
