import { ChevronUp, ShoppingBag } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { t } from "@/locales/i18n";
import { type UploadSlotKey } from "@/components/image-uploader";
import { formatPrice } from "@/lib/pricing";

export interface FooterOrderRow {
  slotKey: UploadSlotKey;
  slotIndex: number;
  proportion: string;
  isUploaded: boolean;
  unitPrice: number;
}

interface CheckoutOrderDropupProps {
  rows: FooterOrderRow[];
  checkedSlotKeys: Set<UploadSlotKey>;
  onToggleSlot: (slotKey: UploadSlotKey) => void;
  onCheckout: () => void;
  checkoutDisabled: boolean;
}

function slotLabel(slotKey: UploadSlotKey): string {
  if (slotKey === "left") {
    return t("upload.slotLeft");
  }

  if (slotKey === "right") {
    return t("upload.slotRight");
  }

  return t("upload.slotCenter");
}

export function CheckoutOrderDropup({
  rows,
  checkedSlotKeys,
  onToggleSlot,
  onCheckout,
  checkoutDisabled,
}: CheckoutOrderDropupProps) {
  const checkedCount = rows.reduce((sum, row) => {
    if (!checkedSlotKeys.has(row.slotKey)) {
      return sum;
    }

    return sum + 1;
  }, 0);

  const totalPrice = rows.reduce((sum, row) => {
    if (!checkedSlotKeys.has(row.slotKey)) {
      return sum;
    }

    return sum + row.unitPrice;
  }, 0);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="sm"
          className="h-9 gap-1.5 rounded-full px-2 text-xs font-semibold tracking-[0.01em] shadow-sm sm:px-4 sm:text-sm"
          aria-label={
            rows.length > 0
              ? `${t("checkout.openCheckout")} · ${formatPrice(totalPrice)}`
              : t("checkout.openCheckout")
          }
        >
          <ShoppingBag className="h-4 w-4" aria-hidden="true" />
          <ChevronUp className="h-3.5 w-3.5 sm:hidden" aria-hidden="true" />
          <span className="hidden items-center gap-2 sm:inline-flex">
            {t("checkout.openCheckout")}
            {rows.length > 0 ? (
              <>
                <span className="text-[10px] font-normal opacity-70">·</span>
                <span className="text-xs font-semibold">{formatPrice(totalPrice)}</span>
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-foreground/20 px-1.5 text-[10px] font-bold leading-none">
                  {checkedCount}
                </span>
              </>
            ) : null}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="center"
        side="top"
        className="w-80 p-3"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="space-y-1">
          <p className="text-sm font-semibold">
            {t("checkout.orderSelectionTitle")}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("checkout.orderSelectionHint")}
          </p>
        </div>

        {rows.length === 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">
            {t("checkout.orderSelectionEmpty")}
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {rows.map((row) => {
              const isChecked = checkedSlotKeys.has(row.slotKey);

              return (
                <label
                  key={row.slotKey}
                  className="flex items-start gap-2 rounded-md border border-border/70 p-2"
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 shrink-0"
                    checked={isChecked}
                    onChange={() => onToggleSlot(row.slotKey)}
                    aria-label={t("checkout.orderSelectionCheckboxAria", {
                      slot: slotLabel(row.slotKey),
                    })}
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium">
                        {slotLabel(row.slotKey)}
                      </span>
                      <span className="text-xs font-semibold">
                        {isChecked
                          ? t("checkout.orderSelectionPrice", {
                              price: formatPrice(row.unitPrice),
                            })
                          : "-"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span>
                        {t("checkout.orderSelectionProportion")}:{" "}
                        {row.proportion}
                      </span>
                      <span>
                        {row.isUploaded
                          ? t("checkout.orderSelectionUploaded")
                          : t("checkout.orderSelectionPendingUpload")}
                      </span>
                    </div>
                  </div>
                </label>
              );
            })}

            <div className="flex items-center justify-between border-t border-border/70 pt-2 text-xs font-semibold">
              <span>{t("checkout.orderSelectionTotal")}</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>

            <Button
              size="sm"
              className="h-8 w-full gap-2 rounded-full text-xs font-semibold"
              disabled={checkoutDisabled}
              onClick={onCheckout}
            >
              <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
              {t("checkout.proceedToCheckout")}
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default CheckoutOrderDropup;
