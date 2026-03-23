import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Settings, RotateCcw, ChevronUp } from "lucide-react";
import { t } from "@/locales/i18n";

interface UploaderEffectsPopoverProps {
  effects: {
    brightness: number;
    contrast: number;
    removeBackground?: boolean;
    enhance?: boolean;
  } | null;
  onUpdateEffect: (
    effectName: "brightness" | "contrast",
    value: number,
  ) => void;
  onToggleRemoveBackground: (enabled: boolean) => void;
  onToggleEnhance: (enabled: boolean) => void;
  onResetEffects: () => void;
  disabled?: boolean;
  isRemoveBackgroundBusy?: boolean;
  isEnhanceBusy?: boolean;
}

export function UploaderEffectsPopover({
  effects,
  onUpdateEffect,
  onToggleRemoveBackground,
  onToggleEnhance,
  onResetEffects,
  disabled = false,
  isRemoveBackgroundBusy = false,
  isEnhanceBusy = false,
}: UploaderEffectsPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);

  const effectValues = effects || {
    brightness: 0,
    contrast: 0,
    removeBackground: false,
    enhance: false,
  };
  const hasEffects =
    effectValues.brightness !== 0 ||
    effectValues.contrast !== 0 ||
    !!effectValues.removeBackground ||
    !!effectValues.enhance;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          size="lg"
          disabled={disabled}
          aria-label={t("uploader.previewEffectsButton")}
          className="px-8 py-6 shadow-lg border-2"
          title={t("uploader.previewEffectsDescription")}
        >
          <Settings className="h-10 w-10" />
          <ChevronUp className="ml-2 h-10 w-10" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="center"
        className="w-72 p-4 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-1">
          <h3 className="font-semibold text-sm">
            {t("uploader.previewEffectsTitle")}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t("uploader.previewEffectsDescription")}
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {t("uploader.canvasEffectsGroupTitle")}
          </p>

          {/* Brightness Control */}
          <div className="space-y-2">
            <Label className="flex items-center justify-between">
              <span>{t("uploader.brightness")}</span>
              <span className="text-sm text-muted-foreground font-mono">
                {effectValues.brightness > 0 ? "+" : ""}
                {effectValues.brightness}
              </span>
            </Label>
            <Slider
              min={-100}
              max={100}
              step={1}
              value={effectValues.brightness}
              onChange={(value) => onUpdateEffect("brightness", value)}
              disabled={disabled}
            />
          </div>

          {/* Contrast Control */}
          <div className="space-y-2">
            <Label className="flex items-center justify-between">
              <span>{t("uploader.contrast")}</span>
              <span className="text-sm text-muted-foreground font-mono">
                {effectValues.contrast > 0 ? "+" : ""}
                {effectValues.contrast}
              </span>
            </Label>
            <Slider
              min={-100}
              max={100}
              step={1}
              value={effectValues.contrast}
              onChange={(value) => onUpdateEffect("contrast", value)}
              disabled={disabled}
            />
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {t("uploader.aiEffectsGroupTitle")}
          </p>

          <div className="space-y-2 rounded-md border border-border/70 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <Label>{t("upload.aiRemoveBackground")}</Label>
                <p className="text-xs text-muted-foreground">
                  {t("uploader.removeBackgroundDescription")}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant={effectValues.removeBackground ? "default" : "outline"}
                role="switch"
                aria-label={t("upload.aiRemoveBackground")}
                aria-checked={!!effectValues.removeBackground}
                disabled={disabled || isRemoveBackgroundBusy}
                onClick={() =>
                  onToggleRemoveBackground(!effectValues.removeBackground)
                }
              >
                {isRemoveBackgroundBusy
                  ? t("common.loading")
                  : effectValues.removeBackground
                    ? t("common.on")
                    : t("common.off")}
              </Button>
            </div>
          </div>

          <div className="space-y-2 rounded-md border border-border/70 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <Label>{t("upload.aiEnhance")}</Label>
                <p className="text-xs text-muted-foreground">
                  {t("uploader.enhanceDescription")}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant={effectValues.enhance ? "default" : "outline"}
                role="switch"
                aria-label={t("upload.aiEnhance")}
                aria-checked={!!effectValues.enhance}
                disabled={disabled || isEnhanceBusy}
                onClick={() => onToggleEnhance(!effectValues.enhance)}
              >
                {isEnhanceBusy
                  ? t("common.loading")
                  : effectValues.enhance
                    ? t("common.on")
                    : t("common.off")}
              </Button>
            </div>
          </div>
        </div>

        {/* Reset Button */}
        {hasEffects && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onResetEffects}
            disabled={disabled}
            className="w-full"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-2" />
            {t("uploader.effectsReset")}
          </Button>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default UploaderEffectsPopover;
