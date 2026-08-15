import { useEffect, useMemo, useRef, useState } from "react";
import panoramka from "@/assets/triptich-experiment/panoramka_duza_1.jpg";

const MASK_ASPECT = 2;
const SLOT_WIDTH = 200;

export function PanoramkaPage() {
  const [imageSrc, setImageSrc] = useState<string>(panoramka);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [crops, setCrops] = useState<string[]>([]);
  const objectUrlRef = useRef<string | null>(null);

  const mask = useMemo(() => {
    if (imageSize === null) return null;
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
      leftPx: (imageSize.width - widthPx) / 2,
      topPx: (imageSize.height - heightPx) / 2,
      widthPct: (widthPx / imageSize.width) * 100,
      heightPct: (heightPx / imageSize.height) * 100,
      widthPx,
      heightPx,
    };
  }, [imageSize]);

  useEffect(() => {
    if (mask === null) return;
    const img = new Image();
    img.onload = () => {
      const partWidth = mask.widthPx / 3;
      const urls = [0, 1, 2].map((i) => {
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(partWidth);
        canvas.height = Math.round(mask.heightPx);
        const ctx = canvas.getContext("2d");
        if (!ctx) return "";
        ctx.drawImage(
          img,
          mask.leftPx + i * partWidth,
          mask.topPx,
          partWidth,
          mask.heightPx,
          0,
          0,
          canvas.width,
          canvas.height
        );
        return canvas.toDataURL("image/jpeg");
      });
      setCrops(urls);
    };
    img.src = imageSrc;
  }, [mask, imageSrc]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setImageSize(null);
    setCrops([]);
    setImageSrc(url);
  };

  const partAspect = mask ? mask.widthPx / 3 / mask.heightPx : 1;

  return (
    <div style={{ margin: 0, padding: 0, background: "white", width: "100vw", minHeight: "100vh", overflow: "auto" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px 16px",
          borderBottom: "1px solid #ccc",
        }}
      >
        <label
          style={{
            padding: "6px 14px",
            background: "#e5e5e5",
            border: "1px solid #333",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Load image
          <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
        </label>
        {imageSize && (
          <span style={{ fontSize: "13px", color: "#333" }}>
            {imageSize.width} x {imageSize.height} (ratio {(imageSize.width / imageSize.height).toFixed(2)})
          </span>
        )}
      </div>
      <div style={{ position: "relative", display: "inline-block" }}>
        <img
          src={imageSrc}
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
              top: "5%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              color: "#ffffff",
              fontSize: "48px",
              fontWeight: "bold",
              textShadow: "2px 2px 4px black",
            }}
          >
            {mask.widthPx} x {mask.heightPx} = {mask.widthPx / mask.heightPx}
          </div>
            {["A", "B", "C"].map((label, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  top: "0%",
                  left: `${(i * 100) / 3}%`,
                  width: `${100 / 3}%`,
                  height: "100%",
                  border: "2px dashed rgba(255, 255, 255, 0.9)",
                  boxSizing: "border-box",
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
                    fontSize: "72px",
                    fontWeight: "bold",
                    textShadow: "2px 2px 4px black",
                    pointerEvents: "none",
                  }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: "16px", justifyContent: "center", marginTop: "24px", width: "100%" }}>
        {["A'", "B'", "C'"].map((label, i) => (
          <div
            key={label}
            style={{
              width: `${SLOT_WIDTH}px`,
              height: `${SLOT_WIDTH / partAspect}px`,
              background: "#e5e5e5",
              border: "2px solid #333",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {crops[i] ? (
              <img
                src={crops[i]}
                alt={label}
                style={{ display: "block", width: "100%", height: "100%", objectFit: "fill" }}
              />
            ) : (
              <span style={{ fontSize: "48px", fontWeight: "bold", color: "#333" }}>{label}</span>
            )}
            <span
              style={{
                position: "absolute",
                top: "8px",
                left: "8px",
                fontSize: "20px",
                fontWeight: "bold",
                color: "white",
                textShadow: "1px 1px 2px black",
              }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
