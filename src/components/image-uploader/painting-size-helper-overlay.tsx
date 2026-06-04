import type { ReactNode } from "react";
import type { PaintingSizeIndex } from "./painting-size";
import { getPaintingSizeScale, ALL_PAINTING_SIZE_INDICES } from "./painting-size";

interface PaintingSizeHelperOverlayProps {
  selectedSize: PaintingSizeIndex;
  paintingAspectRatio: number;
  children: ReactNode;
}

const MAX_SCALE = getPaintingSizeScale(3);

export default function PaintingSizeHelperOverlay({
  selectedSize,
  paintingAspectRatio,
  children,
}: PaintingSizeHelperOverlayProps) {
  const selectedScale = getPaintingSizeScale(selectedSize);

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div
        className="relative h-full max-h-full w-auto max-w-full"
        style={{ aspectRatio: String(paintingAspectRatio) }}
      >
        {ALL_PAINTING_SIZE_INDICES.map((sizeIdx) => {
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
          className="absolute inset-0 m-auto flex items-center justify-center"
          style={{
            width: `${(selectedScale / MAX_SCALE) * 100}%`,
            height: `${(selectedScale / MAX_SCALE) * 100}%`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
