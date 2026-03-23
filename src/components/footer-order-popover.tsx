import { ListChecks } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { t } from "@/locales/i18n";
import { type UploadSlotKey } from "@/components/image-uploader";

export interface FooterOrderRow {
  slotKey: UploadSlotKey;
  slotIndex: number;
  proportion: string;
  isUploaded: boolean;
}

interface FooterOrderPopoverProps {
  rows: FooterOrderRow[];
  checkedSlotKeys: Set<UploadSlotKey>;
  onToggleSlot: (slotKey: UploadSlotKey) => void;
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

export function FooterOrderPopover({
  rows,
  checkedSlotKeys,
  onToggleSlot,
}: FooterOrderPopoverProps) {
  const selectedCount = rows.reduce((sum, row) => {
    if (!checkedSlotKeys.has(row.slotKey)) {
      return sum;
    }

    return sum + 1;
  }, 0);
  const totalCount = rows.length;

  const totalPrice = rows.reduce((sum, row) => {
    if (!checkedSlotKeys.has(row.slotKey)) {
      return sum;
    }

    return sum + 200;
  }, 0);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="relative h-9 w-9 rounded-full p-0"
          aria-label={`${t("checkout.orderSelectionButton")} (${selectedCount}/${totalCount})`}
          title={`${t("checkout.orderSelectionButton")} (${selectedCount}/${totalCount})`}
        >
          <ListChecks className="h-4 w-4" aria-hidden="true" />
          {totalCount > 0 ? (
            <span className="absolute -right-2 -top-2 min-w-8 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold leading-none text-primary-foreground">
              {selectedCount}/{totalCount}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="center"
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
                        {isChecked ? t("checkout.orderSelectionPrice") : "-"}
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
              <span>{new Intl.NumberFormat(undefined, { style: "currency", currency: "PLN" }).format(totalPrice)}</span>
            </div>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default FooterOrderPopover;
