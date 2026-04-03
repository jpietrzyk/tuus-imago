import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { SecurityPage } from "./security";
import { t } from "@/locales/i18n";

describe("SecurityPage Component", () => {
  it("should render the security page title", () => {
    render(
      <MemoryRouter>
        <SecurityPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Bezpieczeństwo",
    );
  });

  it("should render the page subtitle", () => {
    render(
      <MemoryRouter>
        <SecurityPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Jak chronimy Twoje informacje")).toBeInTheDocument();
  });

  it("should render the back to home link", () => {
    render(
      <MemoryRouter>
        <SecurityPage />
      </MemoryRouter>,
    );

    const backLink = screen.getByRole("link", {
      name: t("common.backToHome"),
    });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute("href", "/");
  });

  it("should render the main section heading", () => {
    render(
      <MemoryRouter>
        <SecurityPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Przegląd bezpieczeństwa" }),
    ).toBeInTheDocument();
  });

  it("should render the main section description", () => {
    render(
      <MemoryRouter>
        <SecurityPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/Ta strona zawiera informacje o środkach bezpieczeństwa/),
    ).toBeInTheDocument();
  });

  it("should render the last updated text", () => {
    render(
      <MemoryRouter>
        <SecurityPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Ostatnia aktualizacja: 2025-02-01/)).toBeInTheDocument();
  });
});
