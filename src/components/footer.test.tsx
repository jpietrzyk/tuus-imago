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
        <Footer />
      </MemoryRouter>,
    );

    expect(screen.getByText(/TuusImago 2026/)).toBeInTheDocument();
  });

  it("should call onOpenContentPage with 'contact' when copyright is clicked", async () => {
    const user = userEvent.setup();
    const onOpenContentPage = vi.fn();

    render(
      <MemoryRouter>
        <Footer onOpenContentPage={onOpenContentPage} />
      </MemoryRouter>,
    );

    await user.click(screen.getByText(/TuusImago 2026/));

    expect(onOpenContentPage).toHaveBeenCalledWith("contact");
  });

  it("should not render checkout CTA by default", () => {
    render(
      <MemoryRouter>
        <Footer />
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

  it("should render total price in trigger button", () => {
    render(
      <MemoryRouter>
        <Footer
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
          onToggleOrderSlot={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(
      screen.getAllByText(
        hasExactTextContent(formatPrice(CANVAS_PRINT_UNIT_PRICE)),
      ).length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("should open dropup and show order rows when popover trigger is clicked", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Footer
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
          onToggleOrderSlot={vi.fn()}
        />
      </MemoryRouter>,
    );

    await user.click(
      screen.getByRole("button", { name: tr("checkout.orderSelectionButton") }),
    );

    expect(
      screen.getByText(tr("checkout.orderSelectionTitle")),
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
      screen.getByRole("button", { name: tr("checkout.orderSelectionButton") }),
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

  it("should call onCheckout when main action button is clicked", async () => {
    const user = userEvent.setup();
    const onCheckout = vi.fn();

    render(
      <MemoryRouter>
        <Footer
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

    expect(onCheckout).toHaveBeenCalledTimes(1);
  });

  it("should call onCheckout when proceed button is clicked inside dropup", async () => {
    const user = userEvent.setup();
    const onCheckout = vi.fn();

    render(
      <MemoryRouter>
        <Footer
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
      screen.getByRole("button", { name: tr("checkout.orderSelectionButton") }),
    );

    await user.click(
      screen.getByRole("button", { name: tr("checkout.proceedToCheckout") }),
    );

    expect(onCheckout).toHaveBeenCalledTimes(1);
  });

  it("should disable main action button when checkoutDisabled and disable proceed in popover", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Footer
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

    const mainButton = screen.getByRole("button", {
      name: checkoutButtonLabel(),
    });
    expect(mainButton).toBeDisabled();

    const popoverTrigger = screen.getByRole("button", {
      name: tr("checkout.orderSelectionButton"),
    });
    expect(popoverTrigger).not.toBeDisabled();

    await user.click(popoverTrigger);

    const proceedButton = screen.getByRole("button", {
      name: tr("checkout.proceedToCheckout"),
    });
    expect(proceedButton).toBeDisabled();
  });

  it("should use three-column footer layout for centered checkout", () => {
    const { container } = render(
      <MemoryRouter>
        <Footer showCheckout onCheckout={vi.fn()} onToggleOrderSlot={vi.fn()} />
      </MemoryRouter>,
    );

    const layoutRow = container.querySelector("footer > div > div");
    expect(layoutRow).toHaveClass("grid", "grid-cols-[1fr_auto_1fr]");
  });
});
