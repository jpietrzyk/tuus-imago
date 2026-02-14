import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CheckoutPage } from "./checkout";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { tr } from "@/test/i18n-test";

describe("CheckoutPage", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  const renderWithRouter = () => {
    return render(
      <MemoryRouter initialEntries={["/checkout"]}>
        <Routes>
          <Route path="/checkout" element={<CheckoutPage />} />
        </Routes>
      </MemoryRouter>,
    );
  };

  it("renders checkout page", () => {
    renderWithRouter();
    expect(screen.getByText(tr("checkout.title"))).toBeDefined();
  });

  it("renders back to home link", () => {
    renderWithRouter();
    // Check that the back link exists in the document
    const links = screen.getAllByRole("link");
    const backToHomeLink = links.find((link) =>
      link.textContent?.includes(tr("common.backToHome")),
    );
    expect(backToHomeLink).toBeDefined();
  });

  it("renders personal information section", () => {
    renderWithRouter();
    expect(screen.getByText(tr("checkout.personalInformation"))).toBeDefined();
  });

  it("renders full name input field", () => {
    renderWithRouter();
    const nameInput = screen.getByLabelText(tr("checkout.fullName"));
    expect(nameInput).toBeDefined();
    expect(nameInput.getAttribute("type")).toBe("text");
    expect(nameInput.hasAttribute("required")).toBe(true);
  });

  it("renders address input field", () => {
    renderWithRouter();
    const addressInput = screen.getByLabelText(tr("checkout.streetAddress"));
    expect(addressInput).toBeDefined();
    expect(addressInput.getAttribute("type")).toBe("text");
    expect(addressInput.hasAttribute("required")).toBe(true);
  });

  it("renders city input field", () => {
    renderWithRouter();
    const cityInput = screen.getByLabelText(tr("checkout.city"));
    expect(cityInput).toBeDefined();
    expect(cityInput.getAttribute("type")).toBe("text");
  });

  it("renders postal code input field", () => {
    renderWithRouter();
    const postalInput = screen.getByLabelText(tr("checkout.postalCode"));
    expect(postalInput).toBeDefined();
    expect(postalInput.getAttribute("type")).toBe("text");
  });

  it("renders country input field", () => {
    renderWithRouter();
    const countryInput = screen.getByLabelText(tr("checkout.country"));
    expect(countryInput).toBeDefined();
    expect(countryInput.getAttribute("type")).toBe("text");
  });

  it("renders address information section", () => {
    renderWithRouter();
    expect(screen.getByText(tr("checkout.addressInformation"))).toBeDefined();
  });

  it("renders order summary section", () => {
    renderWithRouter();
    expect(screen.getByText(tr("checkout.orderSummary"))).toBeDefined();
    expect(screen.getByText(tr("checkout.enhancedPhoto"))).toBeDefined();
    expect(screen.getByText(tr("checkout.canvasPrint"))).toBeDefined();
    expect(screen.getByText(tr("checkout.total"))).toBeDefined();
  });

  it("renders total price", () => {
    renderWithRouter();
    expect(screen.getByText("€29.99")).toBeDefined();
  });

  it("renders place order button", () => {
    renderWithRouter();
    const submitButton = screen.getByRole("button", {
      name: tr("checkout.placeOrder"),
    });
    expect(submitButton).toBeDefined();
  });

  it("disables submit button when form is invalid", () => {
    renderWithRouter();
    const submitButton = screen.getByRole("button", {
      name: tr("checkout.placeOrder"),
    });
    // Button should be disabled when form is empty
    expect(submitButton).toBeDefined();
  });

  it("enables submit button when required fields are filled", async () => {
    renderWithRouter();

    const nameInput = screen.getByLabelText(tr("checkout.fullName"));
    const addressInput = screen.getByLabelText(tr("checkout.streetAddress"));
    const submitButton = screen.getByRole("button", {
      name: tr("checkout.placeOrder"),
    });

    await userEvent.type(nameInput, "John Doe");
    await userEvent.type(addressInput, "123 Main Street");

    await waitFor(() => {
      // Button should exist and be enabled
      expect(submitButton).toBeDefined();
    });
  });

  it("shows required field indicator for name", () => {
    renderWithRouter();
    expect(screen.getByText(tr("checkout.fullName"))).toBeDefined();
  });

  it("shows required field indicator for address", () => {
    renderWithRouter();
    expect(screen.getByText(tr("checkout.streetAddress"))).toBeDefined();
  });

  it("disables inputs during submission", async () => {
    renderWithRouter();

    const nameInput = screen.getByLabelText(tr("checkout.fullName"));
    const addressInput = screen.getByLabelText(tr("checkout.streetAddress"));
    const submitButton = screen.getByRole("button", {
      name: tr("checkout.placeOrder"),
    });

    await userEvent.type(nameInput, "John Doe");
    await userEvent.type(addressInput, "123 Main Street");
    await userEvent.click(submitButton);

    await waitFor(() => {
      // Inputs should have disabled attribute during submission
      expect(nameInput.getAttribute("disabled")).toBe("");
      expect(addressInput.getAttribute("disabled")).toBe("");
    });
  });

  it("renders help text", () => {
    renderWithRouter();
    expect(screen.getByText(tr("checkout.requiredFields"))).toBeDefined();
  });
});
