import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

type UploaderProportion = "horizontal" | "vertical" | "square";

interface UploaderToolsProps {
  onSelectProportion: (proportion: UploaderProportion) => void;
}

export function UploaderTools({ onSelectProportion }: UploaderToolsProps) {
  return (
    <div className="flex justify-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="image-proportions-dropdown-trigger"
          >
            Image proportions
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center">
          <DropdownMenuItem onSelect={() => onSelectProportion("vertical")}>
            Vertical
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onSelectProportion("horizontal")}>
            Horizontal
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onSelectProportion("square")}>
            Square
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default UploaderTools;
