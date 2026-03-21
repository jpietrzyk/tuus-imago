import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  RectangleHorizontal,
  RectangleVertical,
  Square,
  type LucideIcon,
} from "lucide-react";
import { type ImageDisplayProportion } from "./image-proportion-calculator";

export type UploaderProportion = Extract<
  ImageDisplayProportion,
  "horizontal" | "vertical" | "rectangle"
>;

interface UploaderToolsProps {
  onSelectProportion: (proportion: UploaderProportion) => void;
  coveragePercent?: Partial<Record<UploaderProportion, number>>;
  selectedProportion: UploaderProportion;
  showCoverageDetails?: boolean;
}

const PROPORTION_ICONS: Record<UploaderProportion, LucideIcon> = {
  horizontal: RectangleHorizontal,
  vertical: RectangleVertical,
  rectangle: Square,
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
  const SelectedIcon = PROPORTION_ICONS[selectedProportion];

  return (
    <div className="flex flex-col items-center gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            data-testid="image-proportions-dropdown-trigger"
            className="px-8 py-6 shadow-lg border-2"
          >
            <SelectedIcon className="h-10 w-10" />
            <ChevronDown className="ml-2 h-10 w-10" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center">
          <DropdownMenuItem onSelect={() => onSelectProportion("vertical")}>
            <RectangleVertical className="h-5 w-5" />
            <span className="sr-only">
              {showCoverageDetails
                ? formatOptionLabel("Vertical", coveragePercent?.vertical)
                : "Vertical"}
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onSelectProportion("horizontal")}>
            <RectangleHorizontal className="h-5 w-5" />
            <span className="sr-only">
              {showCoverageDetails
                ? formatOptionLabel("Horizontal", coveragePercent?.horizontal)
                : "Horizontal"}
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onSelectProportion("rectangle")}>
            <Square className="h-5 w-5" />
            <span className="sr-only">
              {showCoverageDetails
                ? formatOptionLabel("Rectangle", coveragePercent?.rectangle)
                : "Rectangle"}
            </span>
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
