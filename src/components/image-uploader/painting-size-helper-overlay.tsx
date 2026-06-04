import { type ReactNode, useRef, useState, useEffect } from "react";
import type { PaintingSizeIndex } from "./painting-size";
import { getPaintingSizeScale, ALL_PAINTING_SIZE_INDICES } from "./painting-size";

interface PaintingSizeHelperOverlayProps {
  selectedSize: PaintingSizeIndex;
  paintingAspectRatio: number;
  showBorders?: boolean;
  children: ReactNode;
}

const MAX_SCALE = getPaintingSizeScale(3);

export default function PaintingSizeHelperOverlay({
  selectedSize,
  paintingAspectRatio,
  showBorders = false,
  children,
}: PaintingSizeHelperOverlayProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [fitSize, setFitSize] = useState({ width: 0, height: 0 });
  const selectedScale = getPaintingSizeScale(selectedSize);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      const fitWidth = Math.min(width, height * paintingAspectRatio);
      const fitHeight = fitWidth / paintingAspectRatio;
      setFitSize({ width: fitWidth, height: fitHeight });
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [paintingAspectRatio]);

  return (
    <div ref={wrapperRef} className="relative flex h-full flex-1 justify-center items-start min-w-0">
      <div
        className="relative"
        style={fitSize.width > 0 ? { width: fitSize.width, height: fitSize.height } : undefined}
      >
        {showBorders &&
          ALL_PAINTING_SIZE_INDICES.map((sizeIdx) => {
            const scale = getPaintingSizeScale(sizeIdx);
            const relativeScale = scale / MAX_SCALE;
            const isSelected = sizeIdx === selectedSize;

            return (
              <div
                key={sizeIdx}
                className="absolute inset-0 m-auto"
                style={{
                  width: `${relativeScale * 100}%`,
                  height: `${relativeScale * 100}%`,
                  border: isSelected
                    ? "2px solid rgba(0, 0, 0, 0.5)"
                    : "1.5px dashed rgba(0, 0, 0, 0.2)",
                }}
              />
            );
          })}

        <div
          className={showBorders ? "absolute inset-0 m-auto flex items-center justify-center" : "relative flex h-full w-full items-center justify-center"}
          style={
            showBorders
              ? {
                  width: `${(selectedScale / MAX_SCALE) * 100}%`,
                  height: `${(selectedScale / MAX_SCALE) * 100}%`,
                }
              : undefined
          }
        >
          {children}
        </div>
      </div>
    </div>
  );
}
