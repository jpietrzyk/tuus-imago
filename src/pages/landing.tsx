import { Link } from "react-router-dom";
import bgImage from "@/assets/bg_v1.jpg";
import { Button } from "@/components/ui/button";

export function LandingPage() {
  return (
    <div
      className="flex-1 bg-cover bg-center flex items-center justify-center px-2 py-4"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="text-center space-y-8 bg-black/30 backdrop-blur-sm rounded-xl p-8 md:p-12 w-full">
        <h1 className="text-5xl md:text-7xl font-bold text-white drop-shadow-lg">
          Paint your photo
        </h1>
        <p className="text-lg md:text-xl text-white/80 drop-shadow-md max-w-2xl mx-auto">
          We print your AI-enhanced images on professional canvas with a
          beautiful beveled edge
        </p>
        <p className="text-lg md:text-xl text-white/80 drop-shadow-md max-w-2xl mx-auto">
          Real looking paintings crafted with museum-quality materials for
          lasting beauty
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
