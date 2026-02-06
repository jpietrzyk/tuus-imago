import { Shield, X } from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

interface ContentDrawerProps {
  trigger?: React.ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
}

export function ContentDrawer({
  trigger,
  defaultOpen = false,
  open,
  onOpenChange,
  children,
  title = "Content",
}: ContentDrawerProps) {
  return (
    <Drawer
      direction="right"
      defaultOpen={defaultOpen}
      open={open}
      onOpenChange={onOpenChange}
    >
      {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
      <DrawerContent className="h-[90vh] w-full sm:max-w-md">
        <DrawerHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <DrawerTitle className="text-xl font-bold">{title}</DrawerTitle>
          </div>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </DrawerClose>
        </DrawerHeader>

        <div className="px-4 py-6 space-y-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
