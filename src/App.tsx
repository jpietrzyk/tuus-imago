import bgImage from "@/assets/bg_v1.jpg";

export function App() {
  return (
    <div
      className="min-h-screen bg-cover bg-center"
      style={{ backgroundImage: `url(${bgImage})` }}
    />
  );
}

export default App;
