import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { ContactPage } from "./contact";
import { t } from "@/locales/i18n";

describe("ContactPage Component", () => {
  it("should render the contact page title", () => {
    render(
      <MemoryRouter>
        <ContactPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Kontakt",
    );
  });

  it("should render the page subtitle", () => {
    render(
      <MemoryRouter>
        <ContactPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Skontaktuj się z naszym zespołem")).toBeInTheDocument();
  });

  it("should render the back to home link", () => {
    render(
      <MemoryRouter>
        <ContactPage />
      </MemoryRouter>,
    );

    const backLink = screen.getByRole("link", {
      name: t("common.backToHome"),
    });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute("href", "/");
  });

  it("should render the company info section", () => {
    render(
      <MemoryRouter>
        <ContactPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Informacje kontaktowe" }),
    ).toBeInTheDocument();
  });

  it("should render the email contact", () => {
    render(
      <MemoryRouter>
        <ContactPage />
      </MemoryRouter>,
    );

    const emailLink = screen.getByRole("link", {
      name: /info@tuusimago\.com/i,
    });
    expect(emailLink).toBeInTheDocument();
    expect(emailLink).toHaveAttribute("href", "mailto:info@tuusimago.com");
  });

  it("should render the phone numbers", () => {
    render(
      <MemoryRouter>
        <ContactPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/\+48 123 456 789/)).toBeInTheDocument();
  });

  it("should render the business hours section", () => {
    render(
      <MemoryRouter>
        <ContactPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Godziny pracy" }),
    ).toBeInTheDocument();
  });
});
