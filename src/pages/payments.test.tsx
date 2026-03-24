import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { PaymentsPage } from "./payments";
import { tr } from "@/test/i18n-test";

describe("PaymentsPage Component", () => {
  it("should render the payments page title", () => {
    render(
      <MemoryRouter>
        <PaymentsPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      tr("payments.title"),
    );
  });

  it("should render the page subtitle", () => {
    render(
      <MemoryRouter>
        <PaymentsPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(tr("payments.subtitle"))).toBeInTheDocument();
  });

  it("should render the back to home link", () => {
    render(
      <MemoryRouter>
        <PaymentsPage />
      </MemoryRouter>,
    );

    const backLink = screen.getByRole("link", {
      name: tr("common.backToHome"),
    });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute("href", "/");
  });

  it("should render the payment methods section", () => {
    render(
      <MemoryRouter>
        <PaymentsPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: tr("payments.methods.title") }),
    ).toBeInTheDocument();
  });

  it("should render the BLIK payment method", () => {
    render(
      <MemoryRouter>
        <PaymentsPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(tr("payments.methods.blik.label")),
    ).toBeInTheDocument();
  });

  it("should render the card payment method", () => {
    render(
      <MemoryRouter>
        <PaymentsPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(tr("payments.methods.cards.label")),
    ).toBeInTheDocument();
  });

  it("should render the traditional transfer method", () => {
    render(
      <MemoryRouter>
        <PaymentsPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(tr("payments.methods.transfer.label")),
    ).toBeInTheDocument();
  });

  it("should render the Przelewy24 section", () => {
    render(
      <MemoryRouter>
        <PaymentsPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: tr("payments.p24.title") }),
    ).toBeInTheDocument();
  });

  it("should render the security section", () => {
    render(
      <MemoryRouter>
        <PaymentsPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: tr("payments.security.title") }),
    ).toBeInTheDocument();
  });

  it("should render the processing time section", () => {
    render(
      <MemoryRouter>
        <PaymentsPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: tr("payments.processing.title") }),
    ).toBeInTheDocument();
  });

  it("should render the refunds section", () => {
    render(
      <MemoryRouter>
        <PaymentsPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: tr("payments.refunds.title") }),
    ).toBeInTheDocument();
  });

  it("should render the failure handling section", () => {
    render(
      <MemoryRouter>
        <PaymentsPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: tr("payments.failure.title") }),
    ).toBeInTheDocument();
  });
});
