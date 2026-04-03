import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { ShippingPage } from "./shipping";
import { t } from "@/locales/i18n";

describe("ShippingPage Component", () => {
  it("should render the shipping page title", () => {
    render(
      <MemoryRouter>
        <ShippingPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Informacje o dostawie",
    );
  });

  it("should render the page subtitle", () => {
    render(
      <MemoryRouter>
        <ShippingPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Jak dostarczamy Twoje zamówienia")).toBeInTheDocument();
  });

  it("should render the back to home link", () => {
    render(
      <MemoryRouter>
        <ShippingPage />
      </MemoryRouter>,
    );

    const backLink = screen.getByRole("link", {
      name: t("common.backToHome"),
    });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute("href", "/");
  });

  it("should render the main shipping section", () => {
    render(
      <MemoryRouter>
        <ShippingPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Regulamin dostawy" }),
    ).toBeInTheDocument();
  });

  it("should render the carriers section with InPost", () => {
    render(
      <MemoryRouter>
        <ShippingPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Dostawcy usług" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/InPost Paczkomaty/),
    ).toBeInTheDocument();
  });

  it("should render the costs section", () => {
    render(
      <MemoryRouter>
        <ShippingPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Koszty dostawy" }),
    ).toBeInTheDocument();
  });

  it("should render the delivery time section", () => {
    render(
      <MemoryRouter>
        <ShippingPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Czas realizacji" }),
    ).toBeInTheDocument();
  });

  it("should render the no international shipping notice", () => {
    render(
      <MemoryRouter>
        <ShippingPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/Nie realizujemy wysyłek zagranicznych/),
    ).toBeInTheDocument();
  });

  it("should render the failed delivery section", () => {
    render(
      <MemoryRouter>
        <ShippingPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", {
        name: "Postępowanie w przypadku niedostarczonej przesyłki",
      }),
    ).toBeInTheDocument();
  });
});
