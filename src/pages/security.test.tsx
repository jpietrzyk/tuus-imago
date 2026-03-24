import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { SecurityPage } from "./security";
import { tr } from "@/test/i18n-test";

describe("SecurityPage Component", () => {
  it("should render the security page title", () => {
    render(
      <MemoryRouter>
        <SecurityPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      tr("security.title"),
    );
  });

  it("should render the page subtitle", () => {
    render(
      <MemoryRouter>
        <SecurityPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(tr("security.subtitle"))).toBeInTheDocument();
  });

  it("should render the back to home link", () => {
    render(
      <MemoryRouter>
        <SecurityPage />
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
        <SecurityPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: tr("security.main.title") }),
    ).toBeInTheDocument();
  });

  it("should render the main section description", () => {
    render(
      <MemoryRouter>
        <SecurityPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(tr("security.main.description")),
    ).toBeInTheDocument();
  });

  it("should render the last updated text", () => {
    render(
      <MemoryRouter>
        <SecurityPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(tr("security.lastUpdated"))).toBeInTheDocument();
  });
});
