import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { type ImageDisplayProportion } from "./image-proportion-calculator";

type UploaderProportion = Extract<
  ImageDisplayProportion,
  "horizontal" | "vertical" | "rectangle"
>;

interface UploaderToolsProps {
  onSelectProportion: (proportion: UploaderProportion) => void;
  coveragePercent?: Partial<Record<UploaderProportion, number>>;
  selectedProportion: UploaderProportion;
  showCoverageDetails?: boolean;
}

const PROPORTION_LABELS: Record<UploaderProportion, string> = {
  horizontal: "Horizontal",
  vertical: "Vertical",
  rectangle: "Rectangle",
};

const formatOptionLabel = (label: string, coverage?: number): string => {
  if (typeof coverage !== "number" || Number.isNaN(coverage)) {
    return label;
  }

  return `${label} (${coverage.toFixed(2)}%)`;
};

export function UploaderTools({
  onSelectProportion,
  coveragePercent,
  selectedProportion,
  showCoverageDetails = false,
}: UploaderToolsProps) {
  const selectedCoverage = coveragePercent?.[selectedProportion];
  const selectedLabel = showCoverageDetails
    ? formatOptionLabel(PROPORTION_LABELS[selectedProportion], selectedCoverage)
    : PROPORTION_LABELS[selectedProportion];

  return (
    <div className="flex flex-col items-center gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="image-proportions-dropdown-trigger"
          >
            {selectedLabel}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center">
          <DropdownMenuItem onSelect={() => onSelectProportion("vertical")}>
            {showCoverageDetails
              ? formatOptionLabel("Vertical", coveragePercent?.vertical)
              : "Vertical"}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onSelectProportion("horizontal")}>
            {showCoverageDetails
              ? formatOptionLabel("Horizontal", coveragePercent?.horizontal)
              : "Horizontal"}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onSelectProportion("rectangle")}>
            {showCoverageDetails
              ? formatOptionLabel("Rectangle", coveragePercent?.rectangle)
              : "Rectangle"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {showCoverageDetails &&
        typeof selectedCoverage === "number" &&
        !Number.isNaN(selectedCoverage) && (
          <div
            className="text-xs text-muted-foreground"
            data-testid="selected-coverage-hint"
          >
            Showing {selectedCoverage.toFixed(2)}% of original area
          </div>
        )}
    </div>
  );
}

export default UploaderTools;
