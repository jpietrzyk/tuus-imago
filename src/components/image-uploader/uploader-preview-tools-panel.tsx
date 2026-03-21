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
    <div className="grid grid-cols-3 items-center gap-y-3 rounded-xl border border-border/60 bg-background/75 px-3 py-3 sm:px-4">
      <div className="col-span-3 w-full">
        <UploaderSlotSwitcher
          slots={slots}
          activeSlotIndex={activeSlotIndex}
          onSelectSlot={onSelectSlot}
        />
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
