import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { LegalPage } from "./legal";
import { t } from "@/locales/i18n";

describe("LegalPage Component", () => {
  it("should render the legal page title", () => {
    render(
      <MemoryRouter>
        <LegalPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Informacje prawne",
    );
  });

  it("should render the page description", () => {
    render(
      <MemoryRouter>
        <LegalPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Polityka prywatności i warunki korzystania z usług")).toBeInTheDocument();
  });

  it("should render the home navigation link", () => {
    render(
      <MemoryRouter>
        <LegalPage />
      </MemoryRouter>,
    );

    const backLink = screen.getByRole("link", {
      name: t("common.backToHome"),
    });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute("href", "/");
  });

  it("should render the privacy policy section", () => {
    render(
      <MemoryRouter>
        <LegalPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText("Polityka prywatności"),
    ).toBeInTheDocument();
  });

  it("should render the terms of service section", () => {
    render(
      <MemoryRouter>
        <LegalPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText("Warunki korzystania z usług"),
    ).toBeInTheDocument();
  });

  it("should render the contact and support section", () => {
    render(
      <MemoryRouter>
        <LegalPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText("Kontakt i wsparcie"),
    ).toBeInTheDocument();
  });

  it("should render privacy policy subsections", () => {
    render(
      <MemoryRouter>
        <LegalPage />
      </MemoryRouter>,
    );

    expect(screen.getAllByText(/Zbieranie danych/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Przechowywanie danych/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Wykorzystanie danych/).length).toBeGreaterThanOrEqual(1);
  });

  it("should render terms of service subsections", () => {
    render(
      <MemoryRouter>
        <LegalPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Korzystanie z usług/)).toBeInTheDocument();
    expect(screen.getByText(/Własność treści/)).toBeInTheDocument();
    expect(screen.getByText(/Polityka zwrotów/)).toBeInTheDocument();
    expect(screen.getByText(/Ograniczenie odpowiedzialności/)).toBeInTheDocument();
  });

  it("should render the support email", () => {
    render(
      <MemoryRouter>
        <LegalPage />
      </MemoryRouter>,
    );

    const emailLink = screen.getByRole("link", {
      name: /support@tuusimago.com/i,
    });
    expect(emailLink).toBeInTheDocument();
    expect(emailLink).toHaveAttribute("href", "mailto:support@tuusimago.com");
  });

  it("should render the support phone number", () => {
    render(
      <MemoryRouter>
        <LegalPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/\+48 123 456 789/)).toBeInTheDocument();
  });

  it("should render the support address", () => {
    render(
      <MemoryRouter>
        <LegalPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/123 Innovation Street, Warsaw, Poland/),
    ).toBeInTheDocument();
  });

  it("should render the last updated text", () => {
    render(
      <MemoryRouter>
        <LegalPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Ostatnia aktualizacja: 2025-02-01/)).toBeInTheDocument();
  });
});
