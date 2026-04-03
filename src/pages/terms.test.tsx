import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { TermsPage } from "./terms";
import { t } from "@/locales/i18n";

describe("TermsPage Component", () => {
  it("should render the terms page title", () => {
    render(
      <MemoryRouter>
        <TermsPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Warunki korzystania",
    );
  });

  it("should render the page subtitle", () => {
    render(
      <MemoryRouter>
        <TermsPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Warunki użytkowania naszych usług")).toBeInTheDocument();
  });

  it("should render the back to home link", () => {
    render(
      <MemoryRouter>
        <TermsPage />
      </MemoryRouter>,
    );

    const backLink = screen.getByRole("link", {
      name: t("common.backToHome"),
    });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute("href", "/");
  });

  it("should render the scope section", () => {
    render(
      <MemoryRouter>
        <TermsPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/2\. Zakres usług/),
    ).toBeInTheDocument();
  });

  it("should render the ordering process section", () => {
    render(
      <MemoryRouter>
        <TermsPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/3\. Proces składania zamówienia/),
    ).toBeInTheDocument();
  });

  it("should render the pricing section", () => {
    render(
      <MemoryRouter>
        <TermsPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/4\. Ceny i płatności/),
    ).toBeInTheDocument();
  });

  it("should render the delivery section", () => {
    render(
      <MemoryRouter>
        <TermsPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/5\. Warunki dostawy/),
    ).toBeInTheDocument();
  });

  it("should render the liability section", () => {
    render(
      <MemoryRouter>
        <TermsPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/9\. Ograniczenie odpowiedzialności/),
    ).toBeInTheDocument();
  });

  it("should render the consumer rights section", () => {
    render(
      <MemoryRouter>
        <TermsPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/16\. Prawa konsumenta/),
    ).toBeInTheDocument();
  });

  it("should render the contact section", () => {
    render(
      <MemoryRouter>
        <TermsPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/17\. Kontakt/),
    ).toBeInTheDocument();
  });
});
