import { useState } from "react";
import { TriptychViewer } from "@/components/triptych-viewer";

export function PanoramkaPage() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  return (
    <div style={{ margin: 0, padding: 0, background: "white", width: "100vw", minHeight: "100vh", overflow: "auto" }}>
      <TriptychViewer imageSrc={imageSrc} onImageSrcChange={setImageSrc} />
    </div>
  );
}
