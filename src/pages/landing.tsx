import { Link } from "react-router-dom";
import bgImage from "@/assets/bg_v1.jpg";
import { Button } from "@/components/ui/button";

export function LandingPage() {
  return (
    <div
      className="flex-1 bg-cover bg-center flex items-center justify-center p-4"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="text-center space-y-8">
        <h1 className="text-5xl md:text-7xl font-bold text-white drop-shadow-lg">
          Tuus Imago
        </h1>
        <p className="text-xl md:text-2xl text-white/90 drop-shadow-md">
          Transform your photos with AI and print them on canvas
        </p>
        <Link to="/upload">
          <Button
            size="lg"
            className="bg-white/95 text-gray-900 hover:bg-white text-lg px-8 py-6 font-semibold shadow-xl backdrop-blur-sm"
          >
            Upload Your Photo
          </Button>
        </Link>
      </div>
    </div>
  );
}
