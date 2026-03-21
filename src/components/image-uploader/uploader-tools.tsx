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
            aria-label={PROPORTION_LABELS[selectedProportion]}
          >
            <SelectedIcon className="h-10 w-10" />
            <ChevronDown className="ml-2 h-10 w-10" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center">
          {(Object.keys(PROPORTION_ICONS) as UploaderProportion[]).map(
            (proportion) => {
              const Icon = PROPORTION_ICONS[proportion];
              const label = PROPORTION_LABELS[proportion];
              return (
                <DropdownMenuItem
                  key={proportion}
                  onSelect={() => onSelectProportion(proportion)}
                >
                  <Icon className="h-5 w-5" />
                  <span>
                    {showCoverageDetails
                      ? formatOptionLabel(label, coveragePercent?.[proportion])
                      : label}
                  </span>
                </DropdownMenuItem>
              );
            },
          )}
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
