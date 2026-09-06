import { RotateCcw, Smartphone } from "lucide-react";
import { t } from "@/locales/i18n";
import { usePhoneLandscape } from "@/lib/use-phone-landscape";

export function RotateWarningOverlay() {
  const isPhoneLandscape = usePhoneLandscape();

  if (!isPhoneLandscape) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4 bg-neutral-950/95 text-white px-6 text-center"
    >
      <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-white/5">
        <Smartphone className="h-9 w-9 rotate-90" aria-hidden="true" />
        <RotateCcw
          className="absolute -right-2 -bottom-2 h-6 w-6 rounded-full bg-white text-neutral-900 p-1"
          aria-hidden="true"
        />
      </div>
      <h2 className="text-lg font-semibold">{t("rotateWarning.title")}</h2>
      <p className="max-w-xs text-sm text-white/80">
        {t("rotateWarning.message")}
      </p>
    </div>
  );
}
