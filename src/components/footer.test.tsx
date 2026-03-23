import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { Footer } from "./footer";
import { tr } from "@/test/i18n-test";

describe("Footer Component", () => {
  it("should render the footer with copyright text", () => {
    render(
      <MemoryRouter>
        <Footer onOpenLegalMenu={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByText(/© \d{4} Tuus Imago/i)).toBeInTheDocument();
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
      screen.queryByRole("button", { name: tr("checkout.openCheckout") }),
    ).not.toBeInTheDocument();
  });

  it("should render checkout CTA when enabled and call callback", async () => {
    const user = userEvent.setup();
    const onCheckout = vi.fn();

    render(
      <MemoryRouter>
        <Footer
          onOpenLegalMenu={vi.fn()}
          showCheckout
          onCheckout={onCheckout}
        />
      </MemoryRouter>,
    );

    await user.click(
      screen.getByRole("button", { name: tr("checkout.openCheckout") }),
    );

    expect(onCheckout).toHaveBeenCalledTimes(1);
  });

  it("should render order selection popover trigger when checkout is visible", () => {
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
            },
          ]}
          checkedOrderSlotKeys={new Set(["left"])}
          onToggleOrderSlot={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("button", {
        name: new RegExp(tr("checkout.orderSelectionButton")),
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("1/1")).toBeInTheDocument();
  });

  it("should allow toggling slot selection from order popover", async () => {
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
            },
          ]}
          checkedOrderSlotKeys={new Set(["left"])}
          onToggleOrderSlot={onToggleOrderSlot}
        />
      </MemoryRouter>,
    );

    await user.click(
      screen.getByRole("button", {
        name: new RegExp(tr("checkout.orderSelectionButton")),
      }),
    );

    expect(
      screen.getByText(tr("checkout.orderSelectionTotal")),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(tr("checkout.orderSelectionPrice")).length,
    ).toBeGreaterThanOrEqual(1);

    await user.click(
      screen.getByRole("checkbox", {
        name: tr("checkout.orderSelectionCheckboxAria", {
          slot: tr("upload.slotLeft"),
        }),
      }),
    );

    expect(onToggleOrderSlot).toHaveBeenCalledWith("left");
  });

  it("should disable checkout CTA when disabled flag is set", () => {
    render(
      <MemoryRouter>
        <Footer
          onOpenLegalMenu={vi.fn()}
          showCheckout
          checkoutDisabled
          onCheckout={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("button", { name: tr("checkout.openCheckout") }),
    ).toBeDisabled();
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
        <Footer onOpenLegalMenu={vi.fn()} showCheckout onCheckout={vi.fn()} />
      </MemoryRouter>,
    );

    const layoutRow = container.querySelector("footer > div > div");
    expect(layoutRow).toHaveClass("grid", "grid-cols-[1fr_auto_1fr]");
  });
});
