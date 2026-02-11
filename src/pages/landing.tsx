import { Link } from "react-router-dom";
import bgImage from "@/assets/bg_v1.jpg";
import { Button } from "@/components/ui/button";
import { ProcessTimeline } from "@/components/process-timeline";

export function LandingPage() {
  return (
    <div
      className="flex-1 bg-cover bg-center px-2 py-6 flex items-center justify-center overflow-hidden"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="text-center space-y-4 bg-black/5 rounded-xl p-6 md:p-8 w-full max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold text-white drop-shadow-lg">
          Paint your photo
        </h1>
        <p className="text-base md:text-lg text-white/80 drop-shadow-md max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto mt-4 mb-0">
          We print your AI-enhanced images on professional canvas with a
          beautiful beveled edge
        </p>
        <p className="text-base md:text-lg text-white/80 drop-shadow-md max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto mt-2">
          Real looking paintings crafted with museum-quality materials for
          lasting beauty
        </p>
        <Link to="/upload" className="mt-6 md:mt-8">
          <Button
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90 text-2xl px-16 py-6 font-semibold shadow-2xl"
          >
            Upload Your Photo
          </Button>
        </Link>

        {/* Process Timeline Section - inside the hero content container */}
        <ProcessTimeline />
      </div>
    </div>
  );
}
