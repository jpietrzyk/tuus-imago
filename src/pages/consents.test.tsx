import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { ConsentsPage } from "./consents";
import { t } from "@/locales/i18n";

describe("ConsentsPage Component", () => {
  it("should render the consents page title", () => {
    render(
      <MemoryRouter>
        <ConsentsPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Zgody",
    );
  });

  it("should render the page subtitle", () => {
    render(
      <MemoryRouter>
        <ConsentsPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Zgody użytkownika i uprawnienia")).toBeInTheDocument();
  });

  it("should render the back to home link", () => {
    render(
      <MemoryRouter>
        <ConsentsPage />
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
        <ConsentsPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Przegląd zgód" }),
    ).toBeInTheDocument();
  });

  it("should render the main section description", () => {
    render(
      <MemoryRouter>
        <ConsentsPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/Ta strona zawiera informacje o zgodach/),
    ).toBeInTheDocument();
  });

  it("should render the last updated text", () => {
    render(
      <MemoryRouter>
        <ConsentsPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Ostatnia aktualizacja: 2025-02-01/)).toBeInTheDocument();
  });
});
