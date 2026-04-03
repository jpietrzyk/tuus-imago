import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { PrivacyPage } from "./privacy";
import { t } from "@/locales/i18n";

describe("PrivacyPage Component", () => {
  it("should render the privacy page title", () => {
    render(
      <MemoryRouter>
        <PrivacyPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Polityka prywatności",
    );
  });

  it("should render the page subtitle", () => {
    render(
      <MemoryRouter>
        <PrivacyPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Jak chronimy Twoje dane osobowe")).toBeInTheDocument();
  });

  it("should render the back to home link", () => {
    render(
      <MemoryRouter>
        <PrivacyPage />
      </MemoryRouter>,
    );

    const backLink = screen.getByRole("link", {
      name: t("common.backToHome"),
    });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute("href", "/");
  });

  it("should render the data controller section", () => {
    render(
      <MemoryRouter>
        <PrivacyPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText("Administrator danych"),
    ).toBeInTheDocument();
  });

  it("should render the types of data section", () => {
    render(
      <MemoryRouter>
        <PrivacyPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText("Rodzaje zbieranych danych osobowych"),
    ).toBeInTheDocument();
  });

  it("should render the legal basis section", () => {
    render(
      <MemoryRouter>
        <PrivacyPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText("Podstawa prawna przetwarzania"),
    ).toBeInTheDocument();
  });

  it("should render the data purposes section", () => {
    render(
      <MemoryRouter>
        <PrivacyPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText("Cele przetwarzania danych"),
    ).toBeInTheDocument();
  });

  it("should render the data sharing section", () => {
    render(
      <MemoryRouter>
        <PrivacyPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText("Udostępnianie danych"),
    ).toBeInTheDocument();
  });

  it("should render the data storage section", () => {
    render(
      <MemoryRouter>
        <PrivacyPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText("Okres przechowywania danych"),
    ).toBeInTheDocument();
  });

  it("should render the user rights section", () => {
    render(
      <MemoryRouter>
        <PrivacyPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText("Twoje prawa wynikające z RODO"),
    ).toBeInTheDocument();
  });

  it("should render the cookies section", () => {
    render(
      <MemoryRouter>
        <PrivacyPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText("Polityka cookies"),
    ).toBeInTheDocument();
  });

  it("should render the data security section", () => {
    render(
      <MemoryRouter>
        <PrivacyPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText("Bezpieczeństwo danych"),
    ).toBeInTheDocument();
  });

  it("should render the contact section", () => {
    render(
      <MemoryRouter>
        <PrivacyPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText("Dane kontaktowe"),
    ).toBeInTheDocument();
  });

  it("should render the contact email", () => {
    render(
      <MemoryRouter>
        <PrivacyPage />
      </MemoryRouter>,
    );

    const emailLinks = screen.getAllByRole("link", { name: /info@tuusimago.com/ });
    expect(emailLinks.length).toBeGreaterThanOrEqual(1);
    expect(emailLinks[0]).toHaveAttribute("href", "mailto:info@tuusimago.com");
  });
});
