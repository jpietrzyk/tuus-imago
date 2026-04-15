import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";

vi.mock("@/locales/i18n", () => ({
  t: (key: string) => key,
}));

vi.mock("@/components/account/profile-tab", () => ({
  ProfileTab: () => <div data-testid="profile-tab" />,
}));

vi.mock("@/components/account/orders-tab", () => ({
  OrdersTab: () => <div data-testid="orders-tab" />,
}));

vi.mock("@/components/account/addresses-tab", () => ({
  AddressesTab: () => <div data-testid="addresses-tab" />,
}));

vi.mock("@/components/account/payments-tab", () => ({
  PaymentsTab: () => <div data-testid="payments-tab" />,
}));

import { AccountPage } from "./account";

function renderWithRouter(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/account/*" element={<AccountPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("AccountPage", () => {
  it("renders tab navigation with correct labels", () => {
    renderWithRouter("/account");
    expect(screen.getByText("account.profile")).toBeInTheDocument();
    expect(screen.getByText("auth.orders")).toBeInTheDocument();
    expect(screen.getByText("auth.addresses")).toBeInTheDocument();
    expect(screen.getByText("account.paymentHistory")).toBeInTheDocument();
    expect(screen.getByText("account.title")).toBeInTheDocument();
  });

  it("shows profile tab by default at /account", () => {
    renderWithRouter("/account");
    expect(screen.getByTestId("profile-tab")).toBeInTheDocument();
    expect(screen.queryByTestId("orders-tab")).not.toBeInTheDocument();
    expect(screen.queryByTestId("addresses-tab")).not.toBeInTheDocument();
    expect(screen.queryByTestId("payments-tab")).not.toBeInTheDocument();
  });

  it("marks profile tab button as active at /account", () => {
    renderWithRouter("/account");
    const buttons = screen.getAllByRole("button");
    const profileButton = buttons.find((b) => b.textContent?.includes("account.profile"))!;
    expect(profileButton).toHaveClass("border-blue-600");
  });

  it("detects orders tab from /account/orders", () => {
    renderWithRouter("/account/orders");
    expect(screen.getByTestId("orders-tab")).toBeInTheDocument();
    const buttons = screen.getAllByRole("button");
    const ordersButton = buttons.find((b) => b.textContent?.includes("auth.orders"))!;
    expect(ordersButton).toHaveClass("border-blue-600");
  });

  it("detects addresses tab from /account/addresses", () => {
    renderWithRouter("/account/addresses");
    expect(screen.getByTestId("addresses-tab")).toBeInTheDocument();
    const buttons = screen.getAllByRole("button");
    const addressesButton = buttons.find((b) => b.textContent?.includes("auth.addresses"))!;
    expect(addressesButton).toHaveClass("border-blue-600");
  });

  it("detects payments tab from /account/payments", () => {
    renderWithRouter("/account/payments");
    expect(screen.getByTestId("payments-tab")).toBeInTheDocument();
    const buttons = screen.getAllByRole("button");
    const paymentsButton = buttons.find((b) => b.textContent?.includes("account.paymentHistory"))!;
    expect(paymentsButton).toHaveClass("border-blue-600");
  });

  it("renders orders tab for orders sub-route with orderId", () => {
    renderWithRouter("/account/orders/123");
    expect(screen.getByTestId("orders-tab")).toBeInTheDocument();
  });

  it("navigates to correct path when tab button is clicked", async () => {
    const user = userEvent.setup();
    renderWithRouter("/account");
    expect(screen.getByTestId("profile-tab")).toBeInTheDocument();

    const buttons = screen.getAllByRole("button");
    const ordersButton = buttons.find((b) => b.textContent === "auth.orders")!;
    await user.click(ordersButton);

    expect(screen.getByTestId("orders-tab")).toBeInTheDocument();
    expect(screen.queryByTestId("profile-tab")).not.toBeInTheDocument();
  });
});
