import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { LegalPage } from "./legal";
import { tr } from "@/test/i18n-test";

describe("LegalPage Component", () => {
  it("should render the legal page title", () => {
    render(
      <MemoryRouter>
        <LegalPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      tr("legal.title"),
    );
  });

  it("should render the page description", () => {
    render(
      <MemoryRouter>
        <LegalPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(tr("legal.subtitle"))).toBeInTheDocument();
  });

  it("should render the home navigation link", () => {
    render(
      <MemoryRouter>
        <LegalPage />
      </MemoryRouter>,
    );

    const backLink = screen.getByRole("link", {
      name: tr("common.backToHome"),
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
      screen.getByRole("heading", { name: tr("legal.privacyPolicy.title") }),
    ).toBeInTheDocument();
  });

  it("should render the terms of service section", () => {
    render(
      <MemoryRouter>
        <LegalPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: tr("legal.termsOfService.title") }),
    ).toBeInTheDocument();
  });

  it("should render the contact and support section", () => {
    render(
      <MemoryRouter>
        <LegalPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: tr("legal.contact.title") }),
    ).toBeInTheDocument();
  });

  it("should render all privacy policy subsections", () => {
    render(
      <MemoryRouter>
        <LegalPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(tr("legal.privacyPolicy.dataCollection.label")),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(tr("legal.privacyPolicy.dataStorage.label")),
    ).toHaveLength(2);
    expect(
      screen.getByText(tr("legal.privacyPolicy.dataUsage.label")),
    ).toBeInTheDocument();
    expect(
      screen.getByText(tr("legal.privacyPolicy.dataRetention.description")),
    ).toBeInTheDocument();
  });

  it("should render all terms of service subsections", () => {
    render(
      <MemoryRouter>
        <LegalPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(tr("legal.termsOfService.serviceUse.label")),
    ).toBeInTheDocument();
    expect(
      screen.getByText(tr("legal.termsOfService.contentOwnership.label")),
    ).toBeInTheDocument();
    expect(
      screen.getByText(tr("legal.termsOfService.refundPolicy.label")),
    ).toBeInTheDocument();
    expect(
      screen.getByText(tr("legal.termsOfService.limitationOfLiability.label")),
    ).toBeInTheDocument();
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

    expect(screen.getByText(tr("legal.lastUpdated"))).toBeInTheDocument();
  });

  it("should render privacy policy description", () => {
    render(
      <MemoryRouter>
        <LegalPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(tr("legal.privacyPolicy.description")),
    ).toBeInTheDocument();
  });

  it("should render terms of service description", () => {
    render(
      <MemoryRouter>
        <LegalPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(tr("legal.termsOfService.description")),
    ).toBeInTheDocument();
  });
});
