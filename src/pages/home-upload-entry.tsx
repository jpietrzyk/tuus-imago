import { Camera } from "lucide-react";
import { Link } from "react-router-dom";
import { t } from "@/locales/i18n";

export function HomeUploadEntryPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 px-4 py-6">
      <Link
        to="/upload"
        className="group flex w-full max-w-sm flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 text-center text-muted-foreground transition-colors hover:border-muted-foreground/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label={t("homeUploadEntry.ctaText")}
      >
        <Camera
          className="mb-6 h-28 w-28 transition-transform group-hover:scale-105"
          aria-hidden="true"
        />
        <p className="text-2xl font-semibold md:text-3xl">
          {t("homeUploadEntry.ctaText")}
        </p>
      </Link>

      <Link
        to="/how-it-works"
        className="text-sm font-medium text-slate-600 underline transition-colors hover:text-slate-900"
      >
        {t("homeUploadEntry.howItWorksLink")}
      </Link>
    </div>
  );
}
