import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Settings,
  RotateCcw,
  Loader2,
  X,
} from "lucide-react";
import { t } from "@/locales/i18n";
import { cn } from "@/lib/utils";

export interface UploaderEffectsPanelButtonProps {
  disabled?: boolean;
  isEditMode: boolean;
  onEnterEditMode: () => void;
}

export function UploaderEffectsPanelButton({
  disabled = false,
  isEditMode,
  onEnterEditMode,
}: UploaderEffectsPanelButtonProps) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      disabled={disabled}
      aria-label={t("uploader.previewEffectsButton")}
      aria-pressed={isEditMode}
      onClick={onEnterEditMode}
      className={cn(
        "relative h-12 w-12 sm:h-14 sm:w-14 shadow-lg border-2",
        isEditMode && "bg-primary/10 border-primary/40",
      )}
      title={t("uploader.previewEffectsDescription")}
    >
      <Settings className="h-6 w-6 sm:h-7 sm:w-7" />
    </Button>
  );
}

export interface UploaderEffectsPanelContentProps {
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
  onClose: () => void;
  disabled?: boolean;
  isRemoveBackgroundBusy?: boolean;
  isEnhanceBusy?: boolean;
}

export function UploaderEffectsPanelContent({
  effects,
  onUpdateEffect,
  onToggleRemoveBackground,
  onToggleEnhance,
  onResetEffects,
  onClose,
  disabled = false,
  isRemoveBackgroundBusy = false,
  isEnhanceBusy = false,
}: UploaderEffectsPanelContentProps) {
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
    <div className="space-y-4 pt-3">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h3 className="font-semibold text-sm">
            {t("uploader.previewEffectsTitle")}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t("uploader.previewEffectsDescription")}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label={t("uploader.effectsClose")}
          className="h-8 w-8 shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
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
              onCheckedChange={(checked) => onToggleRemoveBackground(checked)}
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
    </div>
  );
}
