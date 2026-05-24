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
import { TriangleAlert } from "lucide-react";
import { UploaderSlotSwitcher } from "@/components/image-uploader/uploader-slot-switcher";
import { UploaderTools, type UploaderProportion } from "@/components/image-uploader/uploader-tools";
import type { SelectedImageItem } from "@/components/image-uploader/image-uploader";
import IconShape from "@/assets/icons/ksztalt_tool.svg?react";
import IconFrame from "@/assets/icons/kadr_tool.svg?react";
import IconAiEditor from "@/components/icons/icon-ai-editor.svg?react";
import IconSettings from "@/components/icons/icon-settings.svg?react";
import IconTriptych from "@/components/icons/icon-triptych.svg?react";
import IconReset from "@/components/icons/icon-reset.svg?react";

export interface FooterToolsBarProps {
  slots: Array<SelectedImageItem | null>;
  activeSlotIndex: number | null;
  onSelectSlot: (index: number) => void;

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

  onReset: () => void;
  canReset: boolean;
}

const TOOLBAR_BUTTON_CLASS =
  "h-10 w-10 sm:h-12 sm:w-12 rounded-xl shadow-lg border-2";
const ICON_CLASS = "h-5 w-5 sm:h-6 sm:w-6";

export function FooterToolsBar({
  slots,
  activeSlotIndex,
  onSelectSlot,
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
  onReset,
  canReset,
}: FooterToolsBarProps) {
  const triptychButton = (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      onClick={shouldConfirmSplit ? undefined : onSplitImage}
      disabled={!canSplitImage}
      aria-label={t("uploader.splitSelectedImage")}
      className={TOOLBAR_BUTTON_CLASS}
    >
      <IconTriptych className={ICON_CLASS} />
    </Button>
  );

  const resetButton = (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      disabled={!canReset}
      aria-label={t("uploader.resetSlots")}
      className={TOOLBAR_BUTTON_CLASS}
    >
      <IconReset className={ICON_CLASS} />
    </Button>
  );

  return (
    <div className="border-b border-gray-200">
      <div className="px-4 py-1">
        <UploaderSlotSwitcher
          slots={slots}
          activeSlotIndex={activeSlotIndex}
          onSelectSlot={onSelectSlot}
          hidden={isEditMode || isZoomPanMode}
        />
      </div>

      <div className="px-4 py-1">
        <div className="grid grid-cols-6 items-center gap-1 sm:gap-2">
          <div className="flex justify-center">
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
                  className={TOOLBAR_BUTTON_CLASS + " flex-col gap-0.5"}
                >
                  <IconShape className={ICON_CLASS} />
                  <span className="text-[9px] leading-none">Kształt</span>
                </Button>
              }
            />
          </div>

          <div className="flex justify-center">
            <Button
              type="button"
              variant={isZoomPanMode ? "default" : "secondary"}
              disabled={!canToggleZoomPan}
              onClick={onToggleZoomPan}
              aria-label={t("uploader.frameButton")}
              className={TOOLBAR_BUTTON_CLASS + " flex-col gap-0.5"}
            >
              <IconFrame className={ICON_CLASS} />
              <span className="text-[9px] leading-none">Kadr</span>
            </Button>
          </div>

          <div className="flex justify-center">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              disabled={!canUpdateAiEffects}
              onClick={onEnterAiEditMode}
              aria-label={t("uploader.aiEditorButton")}
              className={TOOLBAR_BUTTON_CLASS}
            >
              <IconAiEditor className={ICON_CLASS} />
            </Button>
          </div>

          <div className="flex justify-center">
            <Button
              type="button"
              variant={isEditMode ? "default" : "secondary"}
              size="icon"
              disabled={!canUpdateEffects}
              onClick={onEnterEditMode}
              aria-label={t("uploader.settingsButton")}
              className={TOOLBAR_BUTTON_CLASS}
            >
              <IconSettings className={ICON_CLASS} />
            </Button>
          </div>

          <div className="flex justify-center">
            {shouldConfirmSplit ? (
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
                      {t("uploader.splitSlotsConfirmDescription")}
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
          </div>

          <div className="flex justify-center">
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
    </div>
  );
}
