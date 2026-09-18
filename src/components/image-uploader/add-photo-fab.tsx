import { useState } from "react";
import { Camera, Plus, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { t } from "@/locales/i18n";

interface AddPhotoFabProps {
  /**
   * Disabled (but still visible) once no selection slot is available, so the
   * affordance stays discoverable without allowing a fourth photo.
   */
  disabled?: boolean;
  onTakePhoto: () => void;
  onChooseFromDevice: () => void;
  className?: string;
}

/**
 * Circular floating action button for the painting editor. Tapping it opens a
 * small menu with the two ways to add another photo: the in-app camera or the
 * device picker. Positioned by the consumer (see the editor layout in
 * image-uploader.tsx), normally hovering above the bottom bar near the right
 * edge.
 */
export function AddPhotoFab({
  disabled = false,
  onTakePhoto,
  onChooseFromDevice,
  className,
}: AddPhotoFabProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <Button
          type="button"
          size="icon"
          disabled={disabled}
          data-testid="add-photo-fab"
          aria-label={t("uploader.addPhoto")}
          className={cn(
            "h-12 w-12 rounded-full shadow-lg ring-1 ring-black/5",
            className,
          )}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side="top"
        sideOffset={8}
        className="w-48"
      >
        <DropdownMenuItem
          data-testid="add-photo-camera"
          onSelect={() => handleSelect(onTakePhoto)}
        >
          <Camera className="h-4 w-4" />
          <span>{t("uploader.addPhotoCamera")}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          data-testid="add-photo-from-device"
          onSelect={() => handleSelect(onChooseFromDevice)}
        >
          <Upload className="h-4 w-4" />
          <span>{t("uploader.addPhotoFromDevice")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default AddPhotoFab;
