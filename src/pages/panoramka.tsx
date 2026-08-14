import panoramka from "@/assets/triptich-experiment/panoramka_duza_3.jpg";

export function PanoramkaPage() {
  return (
    <div style={{ margin: 0, padding: 0, background: "white", width: "100vw", height: "100vh", overflow: "auto" }}>
      <img 
        src={panoramka} 
        alt="panoramka" 
        style={{ display: "block", maxWidth: "none" }}
      />
    </div>
  );
}