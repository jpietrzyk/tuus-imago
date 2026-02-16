import { Link } from "react-router-dom";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProcessTimeline } from "@/components/process-timeline";
import { t } from "@/locales/i18n";

export function LandingPage() {
  return (
    <>
      <div className="flex-1 px-2 pb-2">
        {/* Main content area - takes up remaining space */}
        <div className="flex-1 min-h-0">
          {/* Hero section */}
          <div className="pt-16 text-center space-y-8 md:space-y-10 w-full max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-white drop-shadow-lg">
              {t("landing.hero.title")}
            </h1>
            <p className="text-base md:text-lg text-white/80 drop-shadow-md max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto">
              {t("landing.hero.description")}
            </p>
          </div>

          {/* CTA button section */}
          <div className="py-12 text-center w-full max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto">
            <Link to="/upload">
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-2xl px-16 py-6 font-semibold shadow-2xl"
              >
                <Upload className="w-6 h-6 mr-3" />
                {t("landing.cta.button")}
              </Button>
            </Link>
          </div>

          {/* Timeline section */}
          <div className="py-12 mb-8 text-center w-full max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto">
            <ProcessTimeline />
          </div>
        </div>
      </div>
      S{/* Footer - Fixed at bottom */}
      <div className="shrink-0">{/* Spacer to push footer to bottom */}</div>
    </>
  );
}
