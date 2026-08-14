import { useState } from "react";
import panoramka from "@/assets/triptich-experiment/panoramka_duza_1.jpg";

const MASK_ASPECT = 2;

export function PanoramkaPage() {
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);

  const mask =
    imageSize === null
      ? null
      : (() => {
          const imageAspect = imageSize.width / imageSize.height;
          let widthPx: number;
          let heightPx: number;
          if (imageAspect >= MASK_ASPECT) {
            heightPx = imageSize.height;
            widthPx = imageSize.height * MASK_ASPECT;
          } else {
            widthPx = imageSize.width;
            heightPx = imageSize.width / MASK_ASPECT;
          }
          return {
            widthPct: (widthPx / imageSize.width) * 100,
            heightPct: (heightPx / imageSize.height) * 100,
            widthPx,
            heightPx,
          };
        })();

  return (
    <div style={{ margin: 0, padding: 0, background: "white", width: "100vw", height: "100vh", overflow: "auto" }}>
      <div style={{ position: "relative", display: "inline-block" }}>
        <img
          src={panoramka}
          alt="panoramka"
          style={{ display: "block", maxWidth: "none" }}
          onLoad={(e) => {
            setImageSize({
              width: e.currentTarget.naturalWidth,
              height: e.currentTarget.naturalHeight,
            });
          }}
        />
        {mask && (
          <div
            style={{
              position: "absolute",
              top: `${(100 - mask.heightPct) / 2}%`,
              left: `${(100 - mask.widthPct) / 2}%`,
              width: `${mask.widthPct}%`,
              height: `${mask.heightPct}%`,
              background: "rgba(0, 0, 255, 0.3)",
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                color: "white",
                fontSize: "48px",
                fontWeight: "bold",
                textShadow: "2px 2px 4px black",
              }}
            >
              {mask.widthPx} x {mask.heightPx} = {mask.widthPx / mask.heightPx}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
