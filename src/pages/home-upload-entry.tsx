import { Camera } from "lucide-react";
import { Link } from "react-router-dom";
import { t } from "@/locales/i18n";

export function HomeUploadEntryPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 px-4 py-6">
      <Link
        to="/upload"
        className="group flex w-full max-w-48 flex-col items-center justify-center rounded-2xl border-3 border-dashed border-slate-400 bg-white/10 px-2 py-5 text-center shadow-inner transition-colors hover:border-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 aspect-2/3"
        aria-label={t("homeUploadEntry.ctaText")}
      >
        <Camera
          className="mb-6 h-20 w-20 text-slate-600 transition-transform group-hover:scale-105"
          aria-hidden="true"
        />
        <p className="text-2xl font-semibold text-slate-800 md:text-3xl">
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
