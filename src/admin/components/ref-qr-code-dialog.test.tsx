import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { tr } from "@/test/i18n-test";
import { RefQrCodeDialog } from "./ref-qr-code-dialog";

vi.mock("qrcode", () => {
  const toCanvas = vi.fn();
  return { default: { toCanvas }, toCanvas };
});

import QRCode from "qrcode";

const mockToCanvas = vi.mocked(QRCode.toCanvas);

describe("RefQrCodeDialog", () => {
  const refCode = "PARTNER42";
  const onOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      "navigator",
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockResolvedValue(undefined),
        },
      }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderDialog = (open = true) =>
    render(
      <RefQrCodeDialog
        refCode={refCode}
        open={open}
        onOpenChange={onOpenChange}
      />,
    );

  it("renders dialog title and ref code when open", () => {
    renderDialog(true);
    expect(
      screen.getByText(`${tr("admin.labels.refQrTitle")} — ${refCode}`),
    ).toBeInTheDocument();
  });

  it("renders the referral url in the display area", () => {
    renderDialog(true);
    const expectedUrl = `${window.location.origin}/?ref=PARTNER42`;
    expect(screen.getByText(expectedUrl)).toBeInTheDocument();
  });

  it("renders Copy link and Download QR buttons", () => {
    renderDialog(true);
    expect(
      screen.getByRole("button", { name: new RegExp(tr("admin.labels.refQrCopyLink")) }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: new RegExp(tr("admin.labels.refQrDownload")) }),
    ).toBeInTheDocument();
  });

  it("renders a canvas element for the QR code when open", async () => {
    renderDialog(true);

    await screen.findByText(`${tr("admin.labels.refQrTitle")} — ${refCode}`);

    const canvas = document.querySelector("canvas");
    expect(canvas).not.toBeNull();
    expect(canvas?.className).toContain("rounded-lg border max-w-full");
  });

  it("encodes the ref code in the displayed url", () => {
    render(
      <RefQrCodeDialog
        refCode="special/code&"
        open={true}
        onOpenChange={onOpenChange}
      />,
    );

    expect(
      screen.getByText(/ref=special%2Fcode%26/),
    ).toBeInTheDocument();
  });

  it("does not call QRCode.toCanvas when closed", () => {
    renderDialog(false);
    expect(mockToCanvas).not.toHaveBeenCalled();
  });

  it("copies referral url to clipboard on Copy link click", async () => {
    renderDialog(true);
    const copyButton = screen.getByRole("button", {
      name: new RegExp(tr("admin.labels.refQrCopyLink")),
    });

    await userEvent.click(copyButton);

    const expectedUrl = `${window.location.origin}/?ref=PARTNER42`;
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expectedUrl);
  });

  it("shows Copied! text after clicking Copy link", async () => {
    renderDialog(true);
    const copyButton = screen.getByRole("button", {
      name: new RegExp(tr("admin.labels.refQrCopyLink")),
    });

    await userEvent.click(copyButton);

    expect(
      screen.getByText(tr("admin.labels.refQrLinkCopied")),
    ).toBeInTheDocument();
  });

  it("creates a download link with correct filename on Download QR click", async () => {
    const clickSpy = vi.fn();
    const fakeAnchor = {
      href: "",
      download: "",
      click: clickSpy,
    };
    const origCreateElement = document.createElement.bind(document);
    const createElSpy = vi
      .spyOn(document, "createElement")
      .mockImplementation((tag: string) => {
        if (tag === "a") return fakeAnchor as unknown as HTMLAnchorElement;
        return origCreateElement(tag);
      });

    renderDialog(true);

    const downloadButton = screen.getByRole("button", {
      name: new RegExp(tr("admin.labels.refQrDownload")),
    });

    await userEvent.click(downloadButton);

    expect(fakeAnchor.download).toBe(`qr-ref-${refCode}.png`);
    expect(clickSpy).toHaveBeenCalledTimes(1);

    createElSpy.mockRestore();
  });

  it("calls onOpenChange when dialog close is triggered", async () => {
    renderDialog(true);

    const closeButton = screen.getByRole("button", { name: /close/i });
    await userEvent.click(closeButton);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
