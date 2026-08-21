import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { t } from "@/locales/i18n";
import { TriangleAlert, Link2, Unlink2 } from "lucide-react";
import { UploaderTools, type UploaderProportion } from "@/components/image-uploader/uploader-tools";
import { SizeSelector } from "@/components/image-uploader/size-selector";
import type { PaintingShape, PaintingSizeIndex } from "@/components/image-uploader/painting-size";
import { getPaintingOrientation } from "@/components/image-uploader/painting-size";
import type { SizeDpiInfo } from "@/components/image-uploader/size-dpi-availability";
import IconShape from "@/assets/icons/ksztalt_tool.svg?react";
import IconFrame from "@/assets/icons/kadr_tool.svg?react";
import IconAiEditor from "@/assets/icons/edytor_ai_tool.svg?react";
import IconSettings from "@/assets/icons/ustawienia_tool.svg?react";
import IconTriptych from "@/assets/icons/tryptyk_tool.svg?react";
import IconReset from "@/components/icons/icon-reset.svg?react";

export interface FooterToolsBarProps {
  onSelectProportion: (proportion: UploaderProportion) => void;
  coveragePercent?: Partial<Record<UploaderProportion, number>>;
  selectedProportion: UploaderProportion;
  showCoverageDetails?: boolean;

  isZoomPanMode: boolean;
  onToggleZoomPan: () => void;
  canToggleZoomPan: boolean;

  onEnterAiEditMode: () => void;
  canUpdateAiEffects: boolean;

  onEnterEditMode: () => void;
  canUpdateEffects: boolean;
  isEditMode: boolean;

  onSplitImage: () => void;
  canSplitImage: boolean;
  shouldConfirmSplit: boolean;
  splitConfirmVariant: "overwrite" | "printability" | "both" | "none";
  triptychDisabledReason?: "noPrintableSize";

  isTriptychLinked?: boolean;
  canToggleTriptychLink?: boolean;
  onToggleTriptychLink?: () => void;

  onReset: () => void;
  canReset: boolean;

  selectedPaintingSize: PaintingSizeIndex;
  onSelectPaintingSize: (index: PaintingSizeIndex) => void;
  paintingShape: PaintingShape;
  sizesDpiInfo?: SizeDpiInfo[];
}

const TOOLBAR_BUTTON_CLASS =
  "h-12 w-12 sm:h-[3.5rem] sm:w-[3.5rem] rounded shadow-lg border-2 flex-col gap-0.5 p-1";
const ICON_STYLE: React.CSSProperties = { width: "65%", height: "45%" };

type SplitConfirmVariant = FooterToolsBarProps["splitConfirmVariant"];

const resolveSplitConfirmDescription = (variant: SplitConfirmVariant): string => {
  switch (variant) {
    case "printability":
      return t("uploader.splitPrintabilityConfirmDescription");
    case "both":
      return t("uploader.splitBothConfirmDescription");
    case "overwrite":
    case "none":
    default:
      return t("uploader.splitSlotsConfirmDescription");
  }
};

export function FooterToolsBar({
  onSelectProportion,
  coveragePercent,
  selectedProportion,
  showCoverageDetails = false,
  isZoomPanMode,
  onToggleZoomPan,
  canToggleZoomPan,
  onEnterAiEditMode,
  canUpdateAiEffects,
  onEnterEditMode,
  canUpdateEffects,
  isEditMode,
  onSplitImage,
  canSplitImage,
  shouldConfirmSplit,
  splitConfirmVariant,
  triptychDisabledReason,
  isTriptychLinked = true,
  canToggleTriptychLink = false,
  onToggleTriptychLink,
  onReset,
  canReset,
  selectedPaintingSize,
  onSelectPaintingSize,
  paintingShape,
  sizesDpiInfo,
}: FooterToolsBarProps) {
  const triptychButton = (
    <Button
      type="button"
      variant="secondary"
      onClick={shouldConfirmSplit ? undefined : onSplitImage}
      disabled={!canSplitImage}
      aria-label={t("uploader.splitSelectedImage")}
      title={
        !canSplitImage && triptychDisabledReason === "noPrintableSize"
          ? t("uploader.triptychUnavailableNoSize")
          : undefined
      }
      className={TOOLBAR_BUTTON_CLASS}
    >
      <IconTriptych style={ICON_STYLE} />
      <span className="text-[9px] leading-none truncate w-full text-center">{t("uploader.triptychButton")}</span>
    </Button>
  );

  const triptychLinkButton = (
    <Button
      type="button"
      variant={isTriptychLinked ? "default" : "secondary"}
      onClick={onToggleTriptychLink}
      aria-label={
        isTriptychLinked
          ? t("uploader.triptychLinkedTooltip")
          : t("uploader.triptychUnlinkedTooltip")
      }
      title={
        isTriptychLinked
          ? t("uploader.triptychLinkedTooltip")
          : t("uploader.triptychUnlinkedTooltip")
      }
      data-testid="triptych-link-toggle"
      data-linked={isTriptychLinked ? "true" : "false"}
      className={TOOLBAR_BUTTON_CLASS}
    >
      {isTriptychLinked ? (
        <Link2 style={ICON_STYLE} />
      ) : (
        <Unlink2 style={ICON_STYLE} />
      )}
      <span className="text-[9px] leading-none truncate w-full text-center">
        {t("uploader.triptychLinkButton")}
      </span>
    </Button>
  );

  const resetButton = (
    <Button
      type="button"
      variant="secondary"
      disabled={!canReset}
      aria-label={t("uploader.resetSlots")}
      className={TOOLBAR_BUTTON_CLASS}
    >
      <IconReset style={ICON_STYLE} />
      <span className="text-[9px] leading-none truncate w-full text-center">{t("uploader.resetShort")}</span>
    </Button>
  );

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <SizeSelector
        shape={paintingShape}
        orientation={getPaintingOrientation(selectedProportion)}
        selectedIndex={selectedPaintingSize}
        onSelectSize={onSelectPaintingSize}
        sizesDpiInfo={sizesDpiInfo}
      />

      <div className="py-0.5">
        <div className="flex items-center justify-center gap-1.5">
          <UploaderTools
            onSelectProportion={onSelectProportion}
            coveragePercent={coveragePercent}
            selectedProportion={selectedProportion}
            showCoverageDetails={showCoverageDetails}
            triggerButton={
              <Button
                type="button"
                variant="secondary"
                data-testid="image-proportions-dropdown-trigger"
                aria-label={t("uploader.shapeButton")}
                className={TOOLBAR_BUTTON_CLASS}
              >
                <IconShape style={ICON_STYLE} />
                <span className="text-[9px] leading-none truncate w-full text-center">{t("uploader.shapeButtonLabel")}</span>
              </Button>
            }
          />

          <Button
            type="button"
            variant={isZoomPanMode ? "default" : "secondary"}
            disabled={!canToggleZoomPan}
            onClick={onToggleZoomPan}
            aria-label={t("uploader.frameButton")}
            className={TOOLBAR_BUTTON_CLASS}
          >
            <IconFrame style={ICON_STYLE} />
            <span className="text-[9px] leading-none truncate w-full text-center">{t("uploader.frameButtonLabel")}</span>
          </Button>

          <Button
            type="button"
            variant="secondary"
            disabled={!canUpdateAiEffects}
            onClick={onEnterAiEditMode}
            aria-label={t("uploader.aiEditorButton")}
            className={TOOLBAR_BUTTON_CLASS}
          >
            <IconAiEditor style={ICON_STYLE} />
            <span className="text-[9px] leading-none truncate w-full text-center">{t("uploader.aiEditorButtonLabel")}</span>
          </Button>

          <Button
            type="button"
            variant={isEditMode ? "default" : "secondary"}
            disabled={!canUpdateEffects}
            onClick={onEnterEditMode}
            aria-label={t("uploader.settingsButton")}
            className={TOOLBAR_BUTTON_CLASS}
          >
            <IconSettings style={ICON_STYLE} />
            <span className="text-[9px] leading-none truncate w-full text-center">{t("uploader.settingsButtonLabel")}</span>
          </Button>

          {canToggleTriptychLink ? (
            triptychLinkButton
          ) : shouldConfirmSplit ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                {triptychButton}
              </AlertDialogTrigger>
                <AlertDialogContent size="sm">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <TriangleAlert
                        className="h-4 w-4 text-destructive"
                        aria-hidden="true"
                      />
                      {t("uploader.splitSlotsConfirmTitle")}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {resolveSplitConfirmDescription(splitConfirmVariant)}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>
                      {t("uploader.cancel")}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      onClick={onSplitImage}
                      className="w-full sm:w-auto h-auto min-h-9 whitespace-normal wrap-break-word text-center leading-tight"
                    >
                      {t("uploader.splitSlotsConfirmAction")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              triptychButton
            )}

          <AlertDialog>
            <AlertDialogTrigger asChild>{resetButton}</AlertDialogTrigger>
              <AlertDialogContent size="sm">
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <TriangleAlert
                      className="h-4 w-4 text-destructive"
                      aria-hidden="true"
                    />
                    {t("uploader.resetSlotsConfirmTitle")}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("uploader.resetSlotsConfirmDescription")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>
                    {t("uploader.cancel")}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={onReset}
                    className="w-full sm:w-auto h-auto min-h-9 whitespace-normal wrap-break-word text-center leading-tight"
                  >
                    {t("uploader.resetSlotsConfirmAction")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </div>
      </div>
    </div>
  );
}
