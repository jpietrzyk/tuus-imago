import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { ReturnsPage } from "./returns";
import { tr } from "@/test/i18n-test";

describe("ReturnsPage Component", () => {
  it("should render the returns page title", () => {
    render(
      <MemoryRouter>
        <ReturnsPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      tr("returns.title"),
    );
  });

  it("should render the page subtitle", () => {
    render(
      <MemoryRouter>
        <ReturnsPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(tr("returns.subtitle"))).toBeInTheDocument();
  });

  it("should render the back to home link", () => {
    render(
      <MemoryRouter>
        <ReturnsPage />
      </MemoryRouter>,
    );

    const backLink = screen.getByRole("link", {
      name: tr("common.backToHome"),
    });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute("href", "/");
  });

  it("should render the right of withdrawal section", () => {
    render(
      <MemoryRouter>
        <ReturnsPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", {
        name: tr("returns.rightOfWithdrawal.title"),
      }),
    ).toBeInTheDocument();
  });

  it("should render the right of withdrawal period description", () => {
    render(
      <MemoryRouter>
        <ReturnsPage />
      </MemoryRouter>,
    );

    // The page mentions 14 days in the withdrawal section
    expect(screen.getAllByText(/14 dni/i).length).toBeGreaterThan(0);
  });

  it("should render the return costs section", () => {
    render(
      <MemoryRouter>
        <ReturnsPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: tr("returns.returnCosts.title") }),
    ).toBeInTheDocument();
  });

  it("should render the refund section", () => {
    render(
      <MemoryRouter>
        <ReturnsPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: tr("returns.refund.title") }),
    ).toBeInTheDocument();
  });

  it("should render the contact section", () => {
    render(
      <MemoryRouter>
        <ReturnsPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: tr("returns.contact.title") }),
    ).toBeInTheDocument();
  });

  it("should render the contact email", () => {
    render(
      <MemoryRouter>
        <ReturnsPage />
      </MemoryRouter>,
    );

    const emailLink = screen.getByRole("link", {
      name: tr("returns.contact.emailAddress"),
    });
    expect(emailLink).toBeInTheDocument();
    expect(emailLink).toHaveAttribute("href", "mailto:returns@tuusimago.com");
  });
});
