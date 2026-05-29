import { type UploadSlotKey } from "@/components/image-uploader";
import {
  CheckoutOrderDropup,
  type FooterOrderRow,
} from "@/components/footer-order-popover";
import {
  FooterToolsBar,
  type FooterToolsBarProps,
} from "@/components/footer-tools-bar";

interface FooterProps {
  onOpenContentPage?: (slug: string) => void;
  showCheckout?: boolean;
  checkoutDisabled?: boolean;
  onCheckout?: () => void;
  orderRows?: FooterOrderRow[];
  checkedOrderSlotKeys?: Set<UploadSlotKey>;
  onToggleOrderSlot?: (slotKey: UploadSlotKey) => void;
  toolsBarProps?: FooterToolsBarProps | null;
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
}: FooterProps) {
  const hasTools = !!toolsBarProps;

  return (
    <footer
      className={`w-full shadow-lg rounded-t-2xl ${hasTools ? "min-h-(--app-shell-bar-height)" : "h-(--app-shell-bar-height)"}`}
      style={{ backgroundColor: "#F3EBE8" }}
    >
      {hasTools && <FooterToolsBar {...toolsBarProps} />}
      <div className={`w-full px-4 sm:px-6 lg:px-8 ${hasTools ? "h-(--app-shell-bar-height)" : "h-full"}`}>
        <div className={`grid h-full items-center gap-3 sm:gap-4 ${hasTools ? "grid-cols-1 lg:grid-cols-[1fr_28.875rem_1fr]" : "grid-cols-[1fr_auto_1fr]"} max-lg:grid-cols-1`}>
          <div className="hidden lg:flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              className="text-xs sm:text-sm text-gray-500 hover:text-blue-600 transition-colors cursor-pointer"
              onClick={() => onOpenContentPage?.("contact")}
              aria-label="Contact"
            >
              © TuusImago 2026 - paint that
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
  );
}
