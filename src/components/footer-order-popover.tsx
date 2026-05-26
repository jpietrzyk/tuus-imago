import { ChevronUp, ShoppingCart, ShoppingBag } from "lucide-react";
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
  const totalPrice = rows.reduce((sum, row) => {
    if (!checkedSlotKeys.has(row.slotKey)) {
      return sum;
    }

    return sum + row.unitPrice;
  }, 0);

  return (
    <DropdownMenu>
      <div
        className="flex h-10 w-full overflow-hidden rounded-full bg-primary text-primary-foreground shadow-sm"
        role="group"
      >
        <button
          type="button"
          className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 px-3 text-xs font-semibold tracking-[0.01em] transition-colors hover:bg-primary/80 disabled:pointer-events-none disabled:opacity-50 sm:px-4 sm:text-sm"
          disabled={checkoutDisabled}
          onClick={onCheckout}
          aria-label={
            rows.length > 0
              ? `${t("checkout.openCheckout")} · ${formatPrice(totalPrice)}`
              : t("checkout.openCheckout")
          }
        >
          <ShoppingCart className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{t("checkout.openCheckout")}</span>
          <span className="mx-0.5 inline-block h-4 w-px bg-primary-foreground/30" />
          <span className="text-xs font-semibold">{formatPrice(totalPrice)}</span>
        </button>

        <span className="my-1.5 w-px bg-primary-foreground/30" />

        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex cursor-pointer items-center justify-center px-2.5 transition-colors hover:bg-primary/80 sm:px-3"
            aria-label={t("checkout.orderSelectionButton")}
          >
            <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>
      </div>

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
