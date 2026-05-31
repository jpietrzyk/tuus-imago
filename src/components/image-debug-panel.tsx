import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { t } from "@/locales/i18n";
import type { SelectedImageMetadata } from "@/components/image-uploader/image-uploader";

export interface ImageDebugData {
  metadata: SelectedImageMetadata;
  displayProportion: string;
  suggestedProportion: string | null;
  coveragePercent: Partial<Record<"horizontal" | "vertical" | "rectangle", number>>;
  effectiveDpi?: number | null;
  dpiQuality?: string | null;
  printSizeLabel?: string | null;
}

export interface ImageDebugPanelProps {
  debugData: ImageDebugData | null;
  showDebugData: boolean;
  onToggleDebugData: () => void;
  showPaintingSizeHelper: boolean;
  onTogglePaintingSizeHelper: () => void;
}

function DebugToggle({
  label,
  value,
  onToggle,
  ariaLabel,
  activeText,
  inactiveText,
}: {
  label: string;
  value: boolean;
  onToggle: () => void;
  ariaLabel: string;
  activeText: string;
  inactiveText: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="select-none min-w-12">{label}</span>
      <button
        type="button"
        onClick={onToggle}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1 ${value ? "bg-amber-500" : "bg-amber-200"}`}
        aria-pressed={value}
        aria-label={ariaLabel}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${value ? "translate-x-4" : "translate-x-0"}`}
        />
      </button>
      <span className="select-none text-amber-700">
        {value ? activeText : inactiveText}
      </span>
    </div>
  );
}

export function ImageDebugPanel({
  debugData,
  showDebugData,
  onToggleDebugData,
  showPaintingSizeHelper,
  onTogglePaintingSizeHelper,
}: ImageDebugPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="fixed top-1 right-1 z-[9999] flex flex-col rounded-lg border border-amber-300 bg-amber-50/95 text-xs font-medium text-amber-900 shadow-lg backdrop-blur-sm">
      <button
        type="button"
        onClick={() => setIsCollapsed((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 cursor-pointer hover:bg-amber-100/80 rounded-t-lg"
        aria-label={isCollapsed ? "Expand debug panel" : "Collapse debug panel"}
      >
        <span className="font-semibold uppercase tracking-[0.12em] text-[11px] text-amber-700">
          Debug
        </span>
        {isCollapsed ? (
          <ChevronDown className="h-3.5 w-3.5 text-amber-600" />
        ) : (
          <ChevronUp className="h-3.5 w-3.5 text-amber-600" />
        )}
      </button>

      {!isCollapsed && (
        <div className="px-3 pb-2 flex flex-col gap-2">
          <DebugToggle
            label="SIZE:"
            value={showPaintingSizeHelper}
            onToggle={onTogglePaintingSizeHelper}
            ariaLabel="Toggle painting size helper overlay"
            activeText="show"
            inactiveText="hide"
          />
          <DebugToggle
            label="IMG:"
            value={showDebugData}
            onToggle={onToggleDebugData}
            ariaLabel="Toggle uploader image debug data"
            activeText="debug"
            inactiveText="off"
          />
        </div>
      )}

      {showDebugData && debugData && !isCollapsed && (
        <div className="border-t border-amber-200 px-3 py-2 space-y-1.5">
          <p className="font-semibold uppercase tracking-[0.12em] text-[11px] text-amber-700">
            {t("uploader.debugTitle")}
          </p>
          <p>
            <span className="font-medium">
              {t("uploader.debugImageSize")}:{" "}
            </span>
            {debugData.metadata.width} × {debugData.metadata.height}
          </p>
          <p>
            <span className="font-medium">
              {t("uploader.debugImageRatio")}:{" "}
            </span>
            {debugData.metadata.aspectRatio}
          </p>
          <p>
            <span className="font-medium">
              {t("uploader.debugCurrentFrame")}:{" "}
            </span>
            {debugData.displayProportion}
          </p>
          <p>
            <span className="font-medium">
              {t("uploader.debugSuggestedFrame")}:{" "}
            </span>
            {debugData.suggestedProportion ?? t("uploader.debugUnknown")}
          </p>
          {typeof debugData.effectiveDpi === "number" && (
            <p>
              <span className="font-medium">
                {debugData.printSizeLabel
                  ? t("uploader.debugEffectiveDpiForSize", { size: debugData.printSizeLabel })
                  : t("uploader.debugEffectiveDpi")}:{" "}
              </span>
              {debugData.effectiveDpi} DPI
              {debugData.dpiQuality ? ` (${debugData.dpiQuality})` : ""}
            </p>
          )}
          {(["horizontal", "vertical", "rectangle"] as const).map((key) => {
            const labels: Record<string, string> = {
              horizontal: t("uploader.debugHorizontalCoverage"),
              vertical: t("uploader.debugVerticalCoverage"),
              rectangle: t("uploader.debugRectangleCoverage"),
            };
            const value = debugData.coveragePercent[key];
            return (
              <p key={key}>
                <span className="font-medium">{labels[key]}: </span>
                {typeof value === "number" && !Number.isNaN(value)
                  ? `${value.toFixed(2)}%`
                  : t("uploader.debugUnknown")}
              </p>
            );
          })}
        </div>
      )}
    </div>
  );
}
