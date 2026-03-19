import { Link } from "react-router-dom";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProcessTimeline } from "@/components/process-timeline";
import { t } from "@/locales/i18n";

export function LandingPage() {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-6 lg:gap-8 px-4 py-6">
      {/* Hero section */}
      <div className="text-center space-y-4 md:space-y-6 w-full max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold text-slate-900 drop-shadow-lg">
          {t("landing.hero.title")}
        </h1>
        <p className="text-base md:text-lg text-slate-700 drop-shadow-md">
          {t("landing.hero.description")}
        </p>
      </div>

      {/* CTA button */}
      <div className="text-center">
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
      <div className="w-full max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto">
        <ProcessTimeline />
      </div>
    </div>
  );
}
