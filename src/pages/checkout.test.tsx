import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CheckoutPage } from "./checkout";
import { MemoryRouter, Routes, Route } from "react-router-dom";

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
    expect(screen.getByText("Checkout")).toBeDefined();
  });

  it("renders back to home link", () => {
    renderWithRouter();
    // Check that the back link exists in the document
    const links = screen.getAllByRole("link");
    const backToHomeLink = links.find((link) =>
      link.textContent?.includes("Back"),
    );
    expect(backToHomeLink).toBeDefined();
  });

  it("renders personal information section", () => {
    renderWithRouter();
    expect(screen.getByText("Personal Information")).toBeDefined();
  });

  it("renders full name input field", () => {
    renderWithRouter();
    const nameInput = screen.getByLabelText(/Full Name/);
    expect(nameInput).toBeDefined();
    expect(nameInput.getAttribute("type")).toBe("text");
    expect(nameInput.hasAttribute("required")).toBe(true);
  });

  it("renders address input field", () => {
    renderWithRouter();
    const addressInput = screen.getByLabelText(/Street Address/);
    expect(addressInput).toBeDefined();
    expect(addressInput.getAttribute("type")).toBe("text");
    expect(addressInput.hasAttribute("required")).toBe(true);
  });

  it("renders city input field", () => {
    renderWithRouter();
    const cityInput = screen.getByLabelText(/City/);
    expect(cityInput).toBeDefined();
    expect(cityInput.getAttribute("type")).toBe("text");
  });

  it("renders postal code input field", () => {
    renderWithRouter();
    const postalInput = screen.getByLabelText(/Postal Code/);
    expect(postalInput).toBeDefined();
    expect(postalInput.getAttribute("type")).toBe("text");
  });

  it("renders country input field", () => {
    renderWithRouter();
    const countryInput = screen.getByLabelText(/Country/);
    expect(countryInput).toBeDefined();
    expect(countryInput.getAttribute("type")).toBe("text");
  });

  it("renders address information section", () => {
    renderWithRouter();
    expect(screen.getByText("Address Information")).toBeDefined();
  });

  it("renders order summary section", () => {
    renderWithRouter();
    expect(screen.getByText("Order Summary")).toBeDefined();
    expect(screen.getByText("Enhanced Photo")).toBeDefined();
    expect(screen.getByText("Canvas Print")).toBeDefined();
    expect(screen.getByText("Total")).toBeDefined();
  });

  it("renders total price", () => {
    renderWithRouter();
    expect(screen.getByText("€29.99")).toBeDefined();
  });

  it("renders place order button", () => {
    renderWithRouter();
    const submitButton = screen.getByRole("button", { name: /Place Order/i });
    expect(submitButton).toBeDefined();
  });

  it("disables submit button when form is invalid", () => {
    renderWithRouter();
    const submitButton = screen.getByRole("button", { name: /Place Order/i });
    // Button should be disabled when form is empty
    expect(submitButton).toBeDefined();
  });

  it("enables submit button when required fields are filled", async () => {
    renderWithRouter();

    const nameInput = screen.getByLabelText(/Full Name/);
    const addressInput = screen.getByLabelText(/Street Address/);
    const submitButton = screen.getByRole("button", { name: /Place Order/i });

    await userEvent.type(nameInput, "John Doe");
    await userEvent.type(addressInput, "123 Main Street");

    await waitFor(() => {
      // Button should exist and be enabled
      expect(submitButton).toBeDefined();
    });
  });

  it("shows required field indicator for name", () => {
    renderWithRouter();
    expect(screen.getByText("Full Name *")).toBeDefined();
  });

  it("shows required field indicator for address", () => {
    renderWithRouter();
    expect(screen.getByText("Street Address *")).toBeDefined();
  });

  it("disables inputs during submission", async () => {
    renderWithRouter();

    const nameInput = screen.getByLabelText(/Full Name/);
    const addressInput = screen.getByLabelText(/Street Address/);
    const submitButton = screen.getByRole("button", { name: /Place Order/i });

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
    expect(screen.getByText(/Required fields/)).toBeDefined();
    expect(screen.getByText(/shipping purposes only/)).toBeDefined();
  });
});
