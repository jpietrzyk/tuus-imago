import { useEffect, useRef, useState, useCallback } from "react";
import QRCode from "qrcode";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Copy, Check } from "lucide-react";
import { t } from "@/locales/i18n";

type RefQrCodeDialogProps = {
  refCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function RefQrCodeDialog({
  refCode,
  open,
  onOpenChange,
}: RefQrCodeDialogProps) {
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const url = `${window.location.origin}/?ref=${encodeURIComponent(refCode)}`;

  useEffect(() => {
    if (!open || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, url, {
      width: 256,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    });
  }, [open, url]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) setCopied(false);
      onOpenChange(nextOpen);
    },
    [onOpenChange],
  );

  const handleDownload = useCallback(() => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `qr-ref-${refCode}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  }, [refCode]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  }, [url]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t("admin.labels.refQrTitle")} — {refCode}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          <canvas
            ref={canvasRef}
            className="rounded-lg border max-w-full"
          />
          <div className="w-full rounded-md border bg-muted/50 px-3 py-2 text-sm font-mono break-all select-all text-center">
            {url}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCopy}>
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                {t("admin.labels.refQrLinkCopied")}
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                {t("admin.labels.refQrCopyLink")}
              </>
            )}
          </Button>
          <Button onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            {t("admin.labels.refQrDownload")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
