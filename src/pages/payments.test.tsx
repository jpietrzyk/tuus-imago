import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { PaymentsPage } from "./payments";
import { t } from "@/locales/i18n";

describe("PaymentsPage Component", () => {
  it("should render the payments page title", () => {
    render(
      <MemoryRouter>
        <PaymentsPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Płatności",
    );
  });

  it("should render the page subtitle", () => {
    render(
      <MemoryRouter>
        <PaymentsPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Informacje o metodach płatności i bezpieczeństwie")).toBeInTheDocument();
  });

  it("should render the back to home link", () => {
    render(
      <MemoryRouter>
        <PaymentsPage />
      </MemoryRouter>,
    );

    const backLink = screen.getByRole("link", {
      name: t("common.backToHome"),
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
      screen.getByRole("heading", { name: "Metody płatności" }),
    ).toBeInTheDocument();
  });

  it("should render the BLIK payment method", () => {
    render(
      <MemoryRouter>
        <PaymentsPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "BLIK" }),
    ).toBeInTheDocument();
  });

  it("should render the card payment method", () => {
    render(
      <MemoryRouter>
        <PaymentsPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Karty płatnicze" }),
    ).toBeInTheDocument();
  });

  it("should render the traditional transfer method", () => {
    render(
      <MemoryRouter>
        <PaymentsPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Przelew tradycyjny" }),
    ).toBeInTheDocument();
  });

  it("should render the Przelewy24 section", () => {
    render(
      <MemoryRouter>
        <PaymentsPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Informacje o Przelewy24" }),
    ).toBeInTheDocument();
  });

  it("should render the security section", () => {
    render(
      <MemoryRouter>
        <PaymentsPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Bezpieczeństwo płatności" }),
    ).toBeInTheDocument();
  });

  it("should render the processing time section", () => {
    render(
      <MemoryRouter>
        <PaymentsPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Przetwarzanie płatności" }),
    ).toBeInTheDocument();
  });

  it("should render the refunds section", () => {
    render(
      <MemoryRouter>
        <PaymentsPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Zwroty płatności" }),
    ).toBeInTheDocument();
  });

  it("should render the failure handling section", () => {
    render(
      <MemoryRouter>
        <PaymentsPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Nieudana płatność" }),
    ).toBeInTheDocument();
  });
});
