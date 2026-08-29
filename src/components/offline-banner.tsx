import { WifiOff } from "lucide-react";
import { t } from "@/locales/i18n";
import { useOnlineStatus } from "@/lib/use-online-status";

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full flex items-center justify-center gap-2 px-4 py-1.5 bg-amber-100 text-amber-900 text-xs sm:text-sm font-medium"
    >
      <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="truncate">
        <span className="font-semibold">{t("offline.title")}</span>
        {" — "}
        <span>{t("offline.message")}</span>
      </span>
    </div>
  );
}
