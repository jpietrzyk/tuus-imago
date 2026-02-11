import { Link } from "react-router-dom";
import bgImage from "@/assets/bg_v1.jpg";
import { Button } from "@/components/ui/button";

export function LandingPage() {
  return (
    <div
      className="flex-1 bg-cover bg-center flex items-center justify-center px-2 py-4"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="text-center space-y-8 bg-black/10 backdrop-blur-md rounded-xl p-8 md:p-12 w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-bold text-white drop-shadow-lg">
          Paint your photo
        </h1>
        <p className="text-lg md:text-xl text-white/80 drop-shadow-md max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto mt-12 md:mt-20 mb-0">
          We print your AI-enhanced images on professional canvas with a
          beautiful beveled edge
        </p>
        <p className="text-lg md:text-xl text-white/80 drop-shadow-md max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto mt-2">
          Real looking paintings crafted with museum-quality materials for
          lasting beauty
        </p>
        <Link to="/upload" className="mt-40 md:mt-48">
          <Button
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90 text-2xl px-16 py-8 font-semibold shadow-2xl"
          >
            Upload Your Photo
          </Button>
        </Link>
      </div>
    </div>
  );
}
