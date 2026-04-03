import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { SecurityPage } from "./security";
import { t } from "@/locales/i18n";

vi.mock("@/lib/content-loader", () => ({
  getPageBySlug: vi.fn((slug: string) =>
    slug === "security"
      ? {
          title: "Test Title",
          subtitle: "Test Subtitle",
          slug: "security",
          icon: "Lock",
          menuSection: "legal",
          menuOrder: 7,
          lastUpdated: "2025-02-01",
          body: "## Section One\n\n## Section Two",
        }
      : undefined,
  ),
  getAllPages: vi.fn(() => []),
  getPagesBySection: vi.fn(() => []),
}));

describe("SecurityPage Component", () => {
  it("should render the page heading", () => {
    render(
      <MemoryRouter>
        <SecurityPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("should render the back to home link", () => {
    render(
      <MemoryRouter>
        <SecurityPage />
      </MemoryRouter>,
    );

    const backLink = screen.getByRole("link", {
      name: t("common.backToHome"),
    });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute("href", "/");
  });

  it("should render the last updated text", () => {
    render(
      <MemoryRouter>
        <SecurityPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Ostatnia aktualizacja:/)).toBeInTheDocument();
  });

  it("should render markdown content in prose container", () => {
    const { container } = render(
      <MemoryRouter>
        <SecurityPage />
      </MemoryRouter>,
    );

    expect(container.querySelector(".legal-markdown")).toBeInTheDocument();
  });
});
