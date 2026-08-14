import panoramka from "@/assets/triptich-experiment/panoramka_duza_1.jpg";

export function PanoramkaPage() {
  return (
    <div style={{ margin: 0, padding: 0, background: "white", width: "100vw", height: "100vh", overflow: "auto" }}>
      <div style={{ position: "relative", display: "inline-block" }}>
        <img 
          src={panoramka} 
          alt="panoramka" 
          style={{ display: "block", maxWidth: "none" }}
        />
        <div 
          style={{
            position: "absolute",
            top: "12.43%",
            left: "0%",
            width: "100%",
            height: "75.14%",
            background: "rgba(0, 0, 255, 0.3)",
            pointerEvents: "none"
          }}
        >
          <div style={{ 
            position: "absolute", 
            top: "50%", 
            left: "50%", 
            transform: "translate(-50%, -50%)",
            color: "white",
            fontSize: "48px",
            fontWeight: "bold",
            textShadow: "2px 2px 4px black"
          }}>
            4256 x 2128 = 2
          </div>
        </div>
      </div>
    </div>
  );
}