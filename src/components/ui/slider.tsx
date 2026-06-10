import * as React from "react";
import { cn } from "@/lib/utils";

export interface SliderProps {
  className?: string;
  min?: number;
  max?: number;
  value?: number;
  onChange?: (value: number) => void;
  step?: number;
  disabled?: boolean;
}

function Slider({
  className,
  min = 0,
  max = 100,
  value = 0,
  onChange,
  step = 1,
  disabled = false,
}: SliderProps) {
  // Track the last value reported via onChange to avoid state-update →
  // effect → state-update double-render cycle.  The display uses
  // `internalValue` for responsiveness; it is synced from the controlled
  // `value` prop only when the prop diverges from what the user last
  // dragged to.
  const [internalValue, setInternalValue] = React.useState(value);
  const lastReportedRef = React.useRef(value);

  // Sync from controlled prop only when the external value differs from
  // what we last reported — avoids the useEffect double-render.
  if (value !== lastReportedRef.current) {
    lastReportedRef.current = value;
    setInternalValue(value);
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    lastReportedRef.current = newValue;
    setInternalValue(newValue);
    onChange?.(newValue);
  };

  const percentage = ((internalValue - min) / (max - min)) * 100;

  return (
    <div className={cn("relative flex items-center w-full", className)}>
      <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-primary transition-all"
          style={{ width: `${percentage}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={internalValue}
          onChange={handleChange}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        <div
          className={cn(
            "absolute top-1/2 h-4 w-4 bg-background border-2 border-primary rounded-full shadow-sm transition-all -translate-y-1/2 pointer-events-none",
            disabled && "opacity-50",
          )}
          style={{ left: `${percentage}%`, transform: `translate(-50%, -50%)` }}
        />
      </div>
    </div>
  );
}

export { Slider };
