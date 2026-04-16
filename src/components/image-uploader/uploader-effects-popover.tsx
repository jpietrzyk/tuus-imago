import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings, ChevronUp, RotateCcw, Loader2 } from "lucide-react";
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

  const isApplyingEffect = isRemoveBackgroundBusy || isEnhanceBusy;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          disabled={disabled}
          aria-label={t("uploader.previewEffectsButton")}
          className="relative h-12 w-12 sm:h-14 sm:w-14 shadow-lg border-2"
          title={t("uploader.previewEffectsDescription")}
        >
          <Settings className="h-6 w-6 sm:h-7 sm:w-7" />
          <ChevronUp className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="center"
        className="w-72 p-4 space-y-4 bg-popover/95 backdrop-blur-sm"
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
              <Switch
                checked={!!effectValues.removeBackground}
                onCheckedChange={(checked) =>
                  onToggleRemoveBackground(checked)
                }
                disabled={disabled || isRemoveBackgroundBusy}
                aria-label={t("upload.aiRemoveBackground")}
              />
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
              <Switch
                checked={!!effectValues.enhance}
                onCheckedChange={(checked) => onToggleEnhance(checked)}
                disabled={disabled || isEnhanceBusy}
                aria-label={t("upload.aiEnhance")}
              />
            </div>
          </div>

          {isApplyingEffect && (
            <div className="flex items-center gap-2 rounded-md bg-blue-50 border border-blue-200 px-3 py-2">
              <Loader2 className="h-3.5 w-3.5 text-blue-600 animate-spin" />
              <span className="text-xs font-medium text-blue-700">
                {t("uploader.applyingEffect")}
              </span>
            </div>
          )}
        </div>

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
