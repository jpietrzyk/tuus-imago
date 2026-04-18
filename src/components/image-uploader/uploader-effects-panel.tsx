import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Settings,
  RotateCcw,
  RotateCw,
  Loader2,
  FlipHorizontal2,
  FlipVertical2,
  ChevronDown,
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
    grayscale: number;
    removeBackground?: boolean;
    enhance?: boolean;
    upscale?: boolean;
    restore?: boolean;
  } | null;
  transform: {
    rotation: number;
    flipHorizontal: boolean;
    flipVertical: boolean;
  } | null;
  onUpdateEffect: (
    effectName: "brightness" | "contrast" | "grayscale",
    value: number,
  ) => void;
  onToggleRemoveBackground: (enabled: boolean) => void;
  onToggleEnhance: (enabled: boolean) => void;
  onToggleUpscale: (enabled: boolean) => void;
  onToggleRestore: (enabled: boolean) => void;
  onUpdateRotation: (degrees: number) => void;
  onToggleFlipHorizontal: (enabled: boolean) => void;
  onToggleFlipVertical: (enabled: boolean) => void;
  disabled?: boolean;
  isRemoveBackgroundBusy?: boolean;
  isEnhanceBusy?: boolean;
  isUpscaleBusy?: boolean;
  isRestoreBusy?: boolean;
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
  isZoomAvailable?: boolean;
  onZoomChange?: (zoom: number) => void;
}

function GroupTrigger({ title }: { title: string }) {
  return (
    <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide hover:no-underline border-b border-border/50">
      <span>{title}</span>
      <ChevronDown className="h-4 w-4 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
    </CollapsibleTrigger>
  );
}

export function UploaderEffectsPanelContent({
  effects,
  transform,
  onUpdateEffect,
  onToggleRemoveBackground,
  onToggleEnhance,
  onToggleUpscale,
  onToggleRestore,
  onUpdateRotation,
  onToggleFlipHorizontal,
  onToggleFlipVertical,
  disabled = false,
  isRemoveBackgroundBusy = false,
  isEnhanceBusy = false,
  isUpscaleBusy = false,
  isRestoreBusy = false,
  zoom = 1,
  minZoom = 1,
  maxZoom = 3,
  isZoomAvailable = false,
  onZoomChange,
}: UploaderEffectsPanelContentProps) {
  const effectValues = effects ?? {
    brightness: 0,
    contrast: 0,
    grayscale: 0,
    removeBackground: false,
    enhance: false,
    upscale: false,
    restore: false,
  };

  const transformValues = transform ?? {
    rotation: 0,
    flipHorizontal: false,
    flipVertical: false,
  };

  const isApplyingEffect =
    isRemoveBackgroundBusy || isEnhanceBusy || isUpscaleBusy || isRestoreBusy;

  return (
    <div className="flex flex-col gap-2">
      {isZoomAvailable && onZoomChange && (
        <Collapsible defaultOpen>
          <GroupTrigger title={t("uploader.cropGroupTitle")} />
          <CollapsibleContent>
            <div className="space-y-2 pt-2 pb-1">
              <Label className="flex items-center justify-between">
                <span>{t("uploader.zoom")}</span>
                <span className="text-sm text-muted-foreground font-mono">
                  {zoom.toFixed(1)}x
                </span>
              </Label>
              <Slider
                min={minZoom}
                max={maxZoom}
                step={0.01}
                value={zoom}
                onChange={onZoomChange}
                disabled={disabled}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      <Collapsible>
        <GroupTrigger title={t("uploader.adjustGroupTitle")} />
        <CollapsibleContent>
          <div className="space-y-3 pt-2 pb-1">
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

            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span>{t("uploader.grayscale")}</span>
                <span className="text-sm text-muted-foreground font-mono">
                  {effectValues.grayscale}
                </span>
              </Label>
              <Slider
                min={0}
                max={100}
                step={1}
                value={effectValues.grayscale}
                onChange={(value) => onUpdateEffect("grayscale", value)}
                disabled={disabled}
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible>
        <GroupTrigger title={t("uploader.aiEffectsGroupTitle")} />
        <CollapsibleContent>
          <div className="space-y-2 pt-2 pb-1">
            <div className="space-y-2 rounded-md border border-border/70 p-2.5">
              <div className="flex items-center justify-between gap-2">
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

            <div className="space-y-2 rounded-md border border-border/70 p-2.5">
              <div className="flex items-center justify-between gap-2">
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

            <div className="space-y-2 rounded-md border border-border/70 p-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="space-y-1">
                  <Label>{t("upload.aiUpscale")}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t("uploader.upscaleDescription")}
                  </p>
                </div>
                <Switch
                  checked={!!effectValues.upscale}
                  onCheckedChange={(checked) => onToggleUpscale(checked)}
                  disabled={disabled || isUpscaleBusy}
                  aria-label={t("upload.aiUpscale")}
                />
              </div>
            </div>

            <div className="space-y-2 rounded-md border border-border/70 p-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="space-y-1">
                  <Label>{t("upload.aiRestore")}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t("uploader.restoreDescription")}
                  </p>
                </div>
                <Switch
                  checked={!!effectValues.restore}
                  onCheckedChange={(checked) => onToggleRestore(checked)}
                  disabled={disabled || isRestoreBusy}
                  aria-label={t("upload.aiRestore")}
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
        </CollapsibleContent>
      </Collapsible>

      <Collapsible>
        <GroupTrigger title={t("uploader.transformGroupTitle")} />
        <CollapsibleContent>
          <div className="space-y-3 pt-2 pb-1">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {t("uploader.rotation")}
              </Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onUpdateRotation(transformValues.rotation - 90)
                  }
                  disabled={disabled}
                  aria-label={t("uploader.rotateMinus90")}
                  className="h-9 gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  -90°
                </Button>
                <span className="text-sm font-mono text-muted-foreground min-w-[3ch] text-center">
                  {transformValues.rotation}°
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onUpdateRotation(transformValues.rotation + 90)
                  }
                  disabled={disabled}
                  aria-label={t("uploader.rotatePlus90")}
                  className="h-9 gap-1.5"
                >
                  <RotateCw className="h-3.5 w-3.5" />
                  +90°
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {t("uploader.flip")}
              </Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={
                    transformValues.flipHorizontal ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() =>
                    onToggleFlipHorizontal(!transformValues.flipHorizontal)
                  }
                  disabled={disabled}
                  aria-label={t("uploader.flipHorizontal")}
                  className={cn(
                    "h-9 gap-1.5",
                    transformValues.flipHorizontal &&
                      "bg-primary text-primary-foreground",
                  )}
                >
                  <FlipHorizontal2 className="h-3.5 w-3.5" />
                  {t("uploader.horizontal")}
                </Button>
                <Button
                  type="button"
                  variant={
                    transformValues.flipVertical ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() =>
                    onToggleFlipVertical(!transformValues.flipVertical)
                  }
                  disabled={disabled}
                  aria-label={t("uploader.flipVertical")}
                  className={cn(
                    "h-9 gap-1.5",
                    transformValues.flipVertical &&
                      "bg-primary text-primary-foreground",
                  )}
                >
                  <FlipVertical2 className="h-3.5 w-3.5" />
                  {t("uploader.vertical")}
                </Button>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
