import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { ConsentsPage } from "./consents";
import { tr } from "@/test/i18n-test";

describe("ConsentsPage Component", () => {
  it("should render the consents page title", () => {
    render(
      <MemoryRouter>
        <ConsentsPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      tr("consents.title"),
    );
  });

  it("should render the page subtitle", () => {
    render(
      <MemoryRouter>
        <ConsentsPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(tr("consents.subtitle"))).toBeInTheDocument();
  });

  it("should render the back to home link", () => {
    render(
      <MemoryRouter>
        <ConsentsPage />
      </MemoryRouter>,
    );

    const backLink = screen.getByRole("link", {
      name: tr("common.backToHome"),
    });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute("href", "/");
  });

  it("should render the main section title", () => {
    render(
      <MemoryRouter>
        <ConsentsPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: tr("consents.main.title") }),
    ).toBeInTheDocument();
  });

  it("should render the main section description", () => {
    render(
      <MemoryRouter>
        <ConsentsPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(tr("consents.main.description")),
    ).toBeInTheDocument();
  });

  it("should render the last updated text", () => {
    render(
      <MemoryRouter>
        <ConsentsPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(tr("consents.lastUpdated"))).toBeInTheDocument();
  });
});
