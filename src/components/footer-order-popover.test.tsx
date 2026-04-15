import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { CheckoutOrderDropup } from "./footer-order-popover";
import type { FooterOrderRow } from "./footer-order-popover";

vi.mock("@/locales/i18n", () => ({
  t: (key: string, params?: Record<string, string | number>) => {
    if (params) {
      return Object.entries(params).reduce(
        (acc, [k, v]) => acc.replace(`{${k}}`, String(v)),
        key,
      );
    }
    return key;
  },
}));

vi.mock("@/lib/pricing", () => ({
  formatPrice: (price: number) => `PRICE:${price}`,
}));

vi.mock("@/components/image-uploader", () => ({
  UploadSlotKey: undefined,
}));

function wrapper({ children }: { children: React.ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

const defaultRows: FooterOrderRow[] = [
  {
    slotKey: "left",
    slotIndex: 0,
    proportion: "3:2",
    isUploaded: true,
    unitPrice: 10,
  },
  {
    slotKey: "right",
    slotIndex: 2,
    proportion: "2:3",
    isUploaded: false,
    unitPrice: 20,
  },
  {
    slotKey: "center",
    slotIndex: 1,
    proportion: "1:1",
    isUploaded: true,
    unitPrice: 15,
  },
];

describe("CheckoutOrderDropup", () => {
  it("renders trigger button with label", () => {
    render(
      <CheckoutOrderDropup
        rows={[]}
        checkedSlotKeys={new Set()}
        onToggleSlot={vi.fn()}
        onCheckout={vi.fn()}
        checkoutDisabled={false}
      />,
      { wrapper },
    );

    expect(
      screen.getByRole("button", { name: /^checkout\.openCheckout/ }),
    ).toBeInTheDocument();
  });

  it("shows empty state when no rows", async () => {
    const user = userEvent.setup();

    render(
      <CheckoutOrderDropup
        rows={[]}
        checkedSlotKeys={new Set()}
        onToggleSlot={vi.fn()}
        onCheckout={vi.fn()}
        checkoutDisabled={false}
      />,
      { wrapper },
    );

    await user.click(
      screen.getByRole("button", { name: /^checkout\.openCheckout/ }),
    );

    expect(
      screen.getByText("checkout.orderSelectionEmpty"),
    ).toBeInTheDocument();
  });

  it("renders rows with checkboxes", async () => {
    const user = userEvent.setup();

    render(
      <CheckoutOrderDropup
        rows={defaultRows}
        checkedSlotKeys={new Set(["left", "right"])}
        onToggleSlot={vi.fn()}
        onCheckout={vi.fn()}
        checkoutDisabled={false}
      />,
      { wrapper },
    );

    await user.click(
      screen.getByRole("button", { name: /^checkout\.openCheckout/ }),
    );

    const checkboxes = screen.getAllByRole("checkbox", {
      name: "checkout.orderSelectionCheckboxAria",
    });
    expect(checkboxes).toHaveLength(3);
  });

  it("shows checked count in trigger", () => {
    render(
      <CheckoutOrderDropup
        rows={defaultRows}
        checkedSlotKeys={new Set(["left", "right"])}
        onToggleSlot={vi.fn()}
        onCheckout={vi.fn()}
        checkoutDisabled={false}
      />,
      { wrapper },
    );

    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("computes price total from checked rows", async () => {
    const user = userEvent.setup();

    render(
      <CheckoutOrderDropup
        rows={defaultRows}
        checkedSlotKeys={new Set(["left", "right"])}
        onToggleSlot={vi.fn()}
        onCheckout={vi.fn()}
        checkoutDisabled={false}
      />,
      { wrapper },
    );

    expect(screen.getByText("PRICE:30")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /^checkout\.openCheckout/ }),
    );

    expect(screen.getAllByText("PRICE:30").length).toBeGreaterThanOrEqual(1);
  });

  it("calls onToggleSlot when checkbox changes", async () => {
    const user = userEvent.setup();
    const onToggleSlot = vi.fn();

    render(
      <CheckoutOrderDropup
        rows={defaultRows}
        checkedSlotKeys={new Set(["left"])}
        onToggleSlot={onToggleSlot}
        onCheckout={vi.fn()}
        checkoutDisabled={false}
      />,
      { wrapper },
    );

    await user.click(
      screen.getByRole("button", { name: /^checkout\.openCheckout/ }),
    );

    await user.click(
      screen.getAllByRole("checkbox")[0],
    );

    expect(onToggleSlot).toHaveBeenCalledWith("left");
  });

  it("calls onCheckout when checkout button is clicked", async () => {
    const user = userEvent.setup();
    const onCheckout = vi.fn();

    render(
      <CheckoutOrderDropup
        rows={defaultRows}
        checkedSlotKeys={new Set(["left"])}
        onToggleSlot={vi.fn()}
        onCheckout={onCheckout}
        checkoutDisabled={false}
      />,
      { wrapper },
    );

    await user.click(
      screen.getByRole("button", { name: /^checkout\.openCheckout/ }),
    );

    await user.click(
      screen.getByRole("button", {
        name: "checkout.proceedToCheckout",
      }),
    );

    expect(onCheckout).toHaveBeenCalledTimes(1);
  });

  it("disables checkout button when checkoutDisabled is true", async () => {
    const user = userEvent.setup();

    render(
      <CheckoutOrderDropup
        rows={defaultRows}
        checkedSlotKeys={new Set(["left"])}
        onToggleSlot={vi.fn()}
        onCheckout={vi.fn()}
        checkoutDisabled={true}
      />,
      { wrapper },
    );

    await user.click(
      screen.getByRole("button", { name: /^checkout\.openCheckout/ }),
    );

    expect(
      screen.getByRole("button", { name: "checkout.proceedToCheckout" }),
    ).toBeDisabled();
  });
});
