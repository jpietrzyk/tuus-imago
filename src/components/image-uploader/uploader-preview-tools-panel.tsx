import { Button } from "@/components/ui/button";
import { Settings, SplitSquareVertical } from "lucide-react";
import UploaderSlotSwitcher from "./uploader-slot-switcher";
import UploaderTools from "./uploader-tools";
import type { SelectedImageItem } from "./image-uploader";
import type { UploaderProportion } from "./uploader-tools";

interface UploaderPreviewToolsPanelProps {
  slots: Array<SelectedImageItem | null>;
  activeSlotIndex: number | null;
  onSelectSlot: (index: number) => void;
  onSelectProportion: (proportion: UploaderProportion) => void;
  coveragePercent?: Partial<Record<UploaderProportion, number>>;
  selectedProportion: UploaderProportion;
  showCoverageDetails?: boolean;
}

export function UploaderPreviewToolsPanel({
  slots,
  activeSlotIndex,
  onSelectSlot,
  onSelectProportion,
  coveragePercent,
  selectedProportion,
  showCoverageDetails = false,
}: UploaderPreviewToolsPanelProps) {
  return (
    <div className="mx-auto grid w-1/2 grid-cols-3 items-center gap-y-3 rounded-xl border border-border/60 px-3 py-3 sm:px-4">
      <div className="col-span-3 w-full">
        <UploaderSlotSwitcher
          slots={slots}
          activeSlotIndex={activeSlotIndex}
          onSelectSlot={onSelectSlot}
        />
      </div>
      <div className="col-start-1 flex justify-start">
        <Button
          type="button"
          variant="secondary"
          size="lg"
          disabled
          aria-label="Split (coming soon)"
          className="px-8 py-6 shadow-lg border-2"
        >
          <SplitSquareVertical className="h-10 w-10" />
        </Button>
      </div>
      <div className="col-start-2 flex justify-center">
        <Button
          type="button"
          variant="secondary"
          size="lg"
          disabled
          aria-label="Settings (coming soon)"
          className="px-8 py-6 shadow-lg border-2"
        >
          <Settings className="h-10 w-10" />
        </Button>
      </div>
      <div className="col-start-3 flex justify-end">
        <UploaderTools
          onSelectProportion={onSelectProportion}
          coveragePercent={coveragePercent}
          selectedProportion={selectedProportion}
          showCoverageDetails={showCoverageDetails}
        />
      </div>
    </div>
  );
}

export default UploaderPreviewToolsPanel;
