import { type UploadSlotKey } from "@/components/image-uploader";
import {
  CheckoutOrderDropup,
  type FooterOrderRow,
} from "@/components/footer-order-popover";
import {
  FooterToolsBar,
  type FooterToolsBarProps,
} from "@/components/footer-tools-bar";
import { UploaderSlotSwitcher, type SlotSwitcherBarProps } from "@/components/image-uploader/uploader-slot-switcher";

interface FooterProps {
  onOpenContentPage?: (slug: string) => void;
  showCheckout?: boolean;
  checkoutDisabled?: boolean;
  onCheckout?: () => void;
  orderRows?: FooterOrderRow[];
  checkedOrderSlotKeys?: Set<UploadSlotKey>;
  onToggleOrderSlot?: (slotKey: UploadSlotKey) => void;
  toolsBarProps?: FooterToolsBarProps | null;
  slotSwitcherProps?: SlotSwitcherBarProps | null;
}

export function Footer({
  onOpenContentPage,
  showCheckout = false,
  checkoutDisabled = false,
  onCheckout,
  orderRows = [],
  checkedOrderSlotKeys = new Set<UploadSlotKey>(),
  onToggleOrderSlot,
  toolsBarProps,
  slotSwitcherProps,
}: FooterProps) {
  const hasTools = !!toolsBarProps;
  const hasSlotSwitcher = !!slotSwitcherProps && !slotSwitcherProps.hidden;

  return (
    <>
      {hasSlotSwitcher && (
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <UploaderSlotSwitcher {...slotSwitcherProps} />
        </div>
      )}
      <footer
        className={`w-full shadow-lg rounded-t-2xl ${hasTools ? "min-h-(--app-shell-bar-height)" : "h-(--app-shell-bar-height)"}`}
        style={{ backgroundColor: "rgba(243, 235, 232, 0.6)" }}
      >
        {hasTools && <FooterToolsBar {...toolsBarProps} />}
      <div className={`w-full px-4 sm:px-6 lg:px-8 ${hasTools ? "py-1" : "h-full"}`}>
        <div className={`grid h-full items-center gap-3 sm:gap-4 ${hasTools ? "grid-cols-1 lg:grid-cols-[1fr_28.875rem_1fr]" : "grid-cols-[1fr_auto_1fr]"} max-lg:grid-cols-1`}>
          <div className="hidden lg:flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              className="text-xs sm:text-sm text-gray-600 hover:text-blue-600 transition-colors cursor-pointer font-medium"
              onClick={() => onOpenContentPage?.("contact")}
              aria-label="Contact"
            >
              © TuusImago.com
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 max-lg:w-full">
            {showCheckout && onCheckout && onToggleOrderSlot ? (
              <CheckoutOrderDropup
                rows={orderRows}
                checkedSlotKeys={checkedOrderSlotKeys}
                onToggleSlot={onToggleOrderSlot}
                onCheckout={onCheckout}
                checkoutDisabled={checkoutDisabled}
              />
            ) : null}
          </div>

          <div className="hidden lg:flex justify-end gap-1 sm:gap-2">
          </div>
        </div>
      </div>
      </footer>
    </>
  );
}
