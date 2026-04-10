import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { Footer } from "./footer";
import { tr } from "@/test/i18n-test";
import { CANVAS_PRINT_UNIT_PRICE, formatPrice } from "@/lib/pricing";

function checkoutButtonLabel(): RegExp {
  const base = tr("checkout.openCheckout").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${base}`);
}

function hasExactTextContent(expectedText: string) {
  return (_content: string, element: Element | null) =>
    element?.textContent?.replace(/\s+/g, " ").trim() ===
    expectedText.replace(/\s+/g, " ").trim();
}

describe("Footer Component", () => {
  it("should render the footer with copyright text", () => {
    render(
      <MemoryRouter>
        <Footer onOpenLegalMenu={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByText(/TuusImago/)).toBeInTheDocument();
    expect(screen.getByText(tr("common.footerContactLink"))).toBeInTheDocument();
  });

  it("should render legal CTA button", () => {
    render(
      <MemoryRouter>
        <Footer onOpenLegalMenu={vi.fn()} />
      </MemoryRouter>,
    );

    const legalButton = screen.getByRole("button", {
      name: tr("common.legalMenu"),
    });
    expect(legalButton).toBeInTheDocument();
  });

  it("should call callback when legal CTA is clicked", async () => {
    const user = userEvent.setup();
    const onOpenLegalMenu = vi.fn();

    render(
      <MemoryRouter>
        <Footer onOpenLegalMenu={onOpenLegalMenu} />
      </MemoryRouter>,
    );

    await user.click(
      screen.getByRole("button", { name: tr("common.legalMenu") }),
    );

    expect(onOpenLegalMenu).toHaveBeenCalledTimes(1);
  });

  it("should not render legacy about link in footer", () => {
    render(
      <MemoryRouter>
        <Footer onOpenLegalMenu={vi.fn()} />
      </MemoryRouter>,
    );

    expect(
      screen.queryByRole("link", { name: tr("common.aboutUs") }),
    ).not.toBeInTheDocument();
  });

  it("should not render legacy legal route link in footer", () => {
    render(
      <MemoryRouter>
        <Footer onOpenLegalMenu={vi.fn()} />
      </MemoryRouter>,
    );

    expect(
      screen.queryByRole("link", {
        name: tr("common.legalAndPrivacy"),
      }),
    ).not.toBeInTheDocument();
  });

  it("should render scale icon in legal CTA button", () => {
    render(
      <MemoryRouter>
        <Footer onOpenLegalMenu={vi.fn()} />
      </MemoryRouter>,
    );

    const legalButton = screen.getByRole("button", {
      name: tr("common.legalMenu"),
    });
    const icon = legalButton.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });

  it("should have correct styling classes", () => {
    const { container } = render(
      <MemoryRouter>
        <Footer onOpenLegalMenu={vi.fn()} />
      </MemoryRouter>,
    );

    const footer = container.querySelector("footer");
    expect(footer).toHaveClass(
      "bg-white/95",
      "backdrop-blur-sm",
      "border-t",
      "border-gray-200",
      "shadow-lg",
    );
  });

  it("should not render checkout CTA by default", () => {
    render(
      <MemoryRouter>
        <Footer onOpenLegalMenu={vi.fn()} />
      </MemoryRouter>,
    );

    expect(
      screen.queryByRole("button", { name: checkoutButtonLabel() }),
    ).not.toBeInTheDocument();
  });

  it("should render merged checkout dropup trigger when enabled", () => {
    render(
      <MemoryRouter>
        <Footer
          onOpenLegalMenu={vi.fn()}
          showCheckout
          onCheckout={vi.fn()}
          onToggleOrderSlot={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("button", { name: checkoutButtonLabel() }),
    ).toBeInTheDocument();
  });

  it("should render order count badge showing checked count", () => {
    render(
      <MemoryRouter>
        <Footer
          onOpenLegalMenu={vi.fn()}
          showCheckout
          onCheckout={vi.fn()}
          orderRows={[
            {
              slotKey: "left",
              slotIndex: 0,
              proportion: "3:2",
              isUploaded: true,
              unitPrice: CANVAS_PRINT_UNIT_PRICE,
            },
            {
              slotKey: "right",
              slotIndex: 2,
              proportion: "2:3",
              isUploaded: false,
              unitPrice: CANVAS_PRINT_UNIT_PRICE,
            },
          ]}
          checkedOrderSlotKeys={new Set(["left"])}
          onToggleOrderSlot={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("should open dropup and show order rows when trigger is clicked", async () => {
    const user = userEvent.setup();
    const onToggleOrderSlot = vi.fn();

    render(
      <MemoryRouter>
        <Footer
          onOpenLegalMenu={vi.fn()}
          showCheckout
          onCheckout={vi.fn()}
          orderRows={[
            {
              slotKey: "left",
              slotIndex: 0,
              proportion: "3:2",
              isUploaded: true,
              unitPrice: CANVAS_PRINT_UNIT_PRICE,
            },
          ]}
          checkedOrderSlotKeys={new Set(["left"])}
          onToggleOrderSlot={onToggleOrderSlot}
        />
      </MemoryRouter>,
    );

    await user.click(
      screen.getByRole("button", { name: checkoutButtonLabel() }),
    );

    expect(
      screen.getByText(tr("checkout.orderSelectionTotal")),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(
        hasExactTextContent(formatPrice(CANVAS_PRINT_UNIT_PRICE)),
      ).length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("should allow toggling slot selection from dropup", async () => {
    const user = userEvent.setup();
    const onToggleOrderSlot = vi.fn();

    render(
      <MemoryRouter>
        <Footer
          onOpenLegalMenu={vi.fn()}
          showCheckout
          onCheckout={vi.fn()}
          orderRows={[
            {
              slotKey: "left",
              slotIndex: 0,
              proportion: "3:2",
              isUploaded: true,
              unitPrice: CANVAS_PRINT_UNIT_PRICE,
            },
          ]}
          checkedOrderSlotKeys={new Set(["left"])}
          onToggleOrderSlot={onToggleOrderSlot}
        />
      </MemoryRouter>,
    );

    await user.click(
      screen.getByRole("button", { name: checkoutButtonLabel() }),
    );

    await user.click(
      screen.getByRole("checkbox", {
        name: tr("checkout.orderSelectionCheckboxAria", {
          slot: tr("upload.slotLeft"),
        }),
      }),
    );

    expect(onToggleOrderSlot).toHaveBeenCalledWith("left");
  });

  it("should call onCheckout when proceed button is clicked inside dropup", async () => {
    const user = userEvent.setup();
    const onCheckout = vi.fn();

    render(
      <MemoryRouter>
        <Footer
          onOpenLegalMenu={vi.fn()}
          showCheckout
          onCheckout={onCheckout}
          orderRows={[
            {
              slotKey: "left",
              slotIndex: 0,
              proportion: "3:2",
              isUploaded: true,
              unitPrice: CANVAS_PRINT_UNIT_PRICE,
            },
          ]}
          checkedOrderSlotKeys={new Set(["left"])}
          onToggleOrderSlot={vi.fn()}
        />
      </MemoryRouter>,
    );

    await user.click(
      screen.getByRole("button", { name: checkoutButtonLabel() }),
    );

    await user.click(
      screen.getByRole("button", { name: tr("checkout.proceedToCheckout") }),
    );

    expect(onCheckout).toHaveBeenCalledTimes(1);
  });

  it("should keep trigger enabled but disable proceed button when no slots are checked", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Footer
          onOpenLegalMenu={vi.fn()}
          showCheckout
          checkoutDisabled
          onCheckout={vi.fn()}
          orderRows={[
            {
              slotKey: "left",
              slotIndex: 0,
              proportion: "3:2",
              isUploaded: true,
              unitPrice: CANVAS_PRINT_UNIT_PRICE,
            },
          ]}
          checkedOrderSlotKeys={new Set()}
          onToggleOrderSlot={vi.fn()}
        />
      </MemoryRouter>,
    );

    const trigger = screen.getByRole("button", {
      name: checkoutButtonLabel(),
    });
    expect(trigger).not.toBeDisabled();

    await user.click(trigger);

    const proceedButton = screen.getByRole("button", {
      name: tr("checkout.proceedToCheckout"),
    });
    expect(proceedButton).toBeDisabled();
  });

  it("should not render reset CTA by default", () => {
    render(
      <MemoryRouter>
        <Footer onOpenLegalMenu={vi.fn()} />
      </MemoryRouter>,
    );

    expect(
      screen.queryByRole("button", { name: tr("uploader.resetSlots") }),
    ).not.toBeInTheDocument();
  });

  it("should open confirmation dialog and confirm destructive reset", async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();

    render(
      <MemoryRouter>
        <Footer onOpenLegalMenu={vi.fn()} showReset onReset={onReset} />
      </MemoryRouter>,
    );

    await user.click(
      screen.getByRole("button", { name: tr("uploader.resetSlots") }),
    );

    expect(
      screen.getByText(tr("uploader.resetSlotsConfirmTitle")),
    ).toBeInTheDocument();
    expect(
      screen.getByText(tr("uploader.resetSlotsConfirmDescription")),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: tr("uploader.resetSlotsConfirmAction"),
      }),
    );

    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it("should close reset dialog without action on cancel", async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();

    render(
      <MemoryRouter>
        <Footer onOpenLegalMenu={vi.fn()} showReset onReset={onReset} />
      </MemoryRouter>,
    );

    await user.click(
      screen.getByRole("button", { name: tr("uploader.resetSlots") }),
    );
    await user.click(
      screen.getByRole("button", { name: tr("uploader.cancel") }),
    );

    expect(onReset).not.toHaveBeenCalled();
  });

  it("should use three-column footer layout for centered checkout", () => {
    const { container } = render(
      <MemoryRouter>
        <Footer onOpenLegalMenu={vi.fn()} showCheckout onCheckout={vi.fn()} onToggleOrderSlot={vi.fn()} />
      </MemoryRouter>,
    );

    const layoutRow = container.querySelector("footer > div > div");
    expect(layoutRow).toHaveClass("grid", "grid-cols-[1fr_auto_1fr]");
  });
});
