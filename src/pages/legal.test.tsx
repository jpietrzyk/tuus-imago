import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { LegalPage } from "./legal";

describe("LegalPage Component", () => {
  it("should render the Legal Information page title", () => {
    render(
      <MemoryRouter>
        <LegalPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Legal Information",
    );
  });

  it("should render the page description", () => {
    render(
      <MemoryRouter>
        <LegalPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/Privacy Policy and Terms of Service/i),
    ).toBeInTheDocument();
  });

  it("should render the Back to Home link", () => {
    render(
      <MemoryRouter>
        <LegalPage />
      </MemoryRouter>,
    );

    const backLink = screen.getByRole("link", { name: /back to home/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute("href", "/");
  });

  it("should render the Privacy Policy section", () => {
    render(
      <MemoryRouter>
        <LegalPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: /privacy policy/i }),
    ).toBeInTheDocument();
  });

  it("should render the Terms of Service section", () => {
    render(
      <MemoryRouter>
        <LegalPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: /terms of service/i }),
    ).toBeInTheDocument();
  });

  it("should render the Contact & Support section", () => {
    render(
      <MemoryRouter>
        <LegalPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: /contact & support/i }),
    ).toBeInTheDocument();
  });

  it("should render all privacy policy subsections", () => {
    render(
      <MemoryRouter>
        <LegalPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/data collection/i)).toBeInTheDocument();
    expect(screen.getByText(/data storage/i)).toBeInTheDocument();
    expect(screen.getByText(/data usage/i)).toBeInTheDocument();
    expect(screen.getByText(/data retention/i)).toBeInTheDocument();
  });

  it("should render all terms of service subsections", () => {
    render(
      <MemoryRouter>
        <LegalPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/service use/i)).toBeInTheDocument();
    expect(screen.getByText(/content ownership/i)).toBeInTheDocument();
    expect(screen.getByText(/refund policy/i)).toBeInTheDocument();
    expect(screen.getByText(/limitation of liability/i)).toBeInTheDocument();
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

    expect(screen.getByText(/Last updated: February 2025/)).toBeInTheDocument();
  });

  it("should render privacy policy description", () => {
    render(
      <MemoryRouter>
        <LegalPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/At Tuus Imago, we take your privacy seriously/i),
    ).toBeInTheDocument();
  });

  it("should render terms of service description", () => {
    render(
      <MemoryRouter>
        <LegalPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(
        /By using our services, you agree to the following terms and conditions/i,
      ),
    ).toBeInTheDocument();
  });
});
