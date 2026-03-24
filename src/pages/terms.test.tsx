import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { TermsPage } from "./terms";
import { tr } from "@/test/i18n-test";

describe("TermsPage Component", () => {
  it("should render the terms page title", () => {
    render(
      <MemoryRouter>
        <TermsPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      tr("terms.title"),
    );
  });

  it("should render the page subtitle", () => {
    render(
      <MemoryRouter>
        <TermsPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(tr("terms.subtitle"))).toBeInTheDocument();
  });

  it("should render the back to home link", () => {
    render(
      <MemoryRouter>
        <TermsPage />
      </MemoryRouter>,
    );

    const backLink = screen.getByRole("link", {
      name: tr("common.backToHome"),
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
      screen.getByRole("heading", { name: tr("terms.scope.title") }),
    ).toBeInTheDocument();
  });

  it("should render the ordering process section", () => {
    render(
      <MemoryRouter>
        <TermsPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: tr("terms.ordering.title") }),
    ).toBeInTheDocument();
  });

  it("should render the pricing section", () => {
    render(
      <MemoryRouter>
        <TermsPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: tr("terms.pricing.title") }),
    ).toBeInTheDocument();
  });

  it("should render the delivery section", () => {
    render(
      <MemoryRouter>
        <TermsPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: tr("terms.delivery.title") }),
    ).toBeInTheDocument();
  });

  it("should render the liability section", () => {
    render(
      <MemoryRouter>
        <TermsPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: tr("terms.liability.title") }),
    ).toBeInTheDocument();
  });

  it("should render the consumer rights section", () => {
    render(
      <MemoryRouter>
        <TermsPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: tr("terms.consumerRights.title") }),
    ).toBeInTheDocument();
  });

  it("should render the contact section", () => {
    render(
      <MemoryRouter>
        <TermsPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: tr("terms.contact.title") }),
    ).toBeInTheDocument();
  });
});
