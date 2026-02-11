import { Link } from "react-router-dom";
import bgImage from "@/assets/bg_v1.jpg";
import { Button } from "@/components/ui/button";
import { ProcessTimeline } from "@/components/process-timeline";

export function LandingPage() {
  return (
    <div
      className="flex-1 bg-cover bg-center px-2 pt-12 md:pt-16 pb-2 flex flex-col items-center justify-between overflow-hidden"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {/* First section: Hero section */}
      <div className="text-center space-y-8 md:space-y-10 w-full max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold text-white drop-shadow-lg">
          Paint your photo
        </h1>
        <p className="text-base md:text-lg text-white/80 drop-shadow-md max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto">
          We print your AI-enhanced images on professional canvas with a
          beautiful beveled edge
        </p>
        <p className="text-base md:text-lg text-white/80 drop-shadow-md max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto">
          Real looking paintings crafted with museum-quality materials for
          lasting beauty
        </p>
      </div>

      {/* Second section: CTA button */}
      <div className="text-center w-full max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto">
        <Link to="/upload">
          <Button
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90 text-2xl px-16 py-6 font-semibold shadow-2xl"
          >
            Upload Your Photo
          </Button>
        </Link>
      </div>

      {/* Third section: Timeline */}
      <ProcessTimeline />
    </div>
  );
}
