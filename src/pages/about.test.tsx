import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AboutPage } from "./about";
import { t } from "@/locales/i18n";

vi.mock("@/lib/content-loader", () => ({
  getPageBySlug: vi.fn((slug: string) =>
    slug === "about"
      ? {
          title: "Test Title",
          subtitle: "Test Subtitle",
          slug: "about",
          icon: "Building2",
          menuSection: "company",
          menuOrder: 1,
          lastUpdated: "2025-02-01",
          body: "## Section One\n\n## Section Two",
        }
      : undefined,
  ),
  getAllPages: vi.fn(() => []),
  getPagesBySection: vi.fn(() => []),
}));

describe("AboutPage Component", () => {
  it("should render the page heading", () => {
    render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("should render the close button", () => {
    render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>,
    );

    const closeButton = screen.getByRole("button", {
      name: t("common.backToHome"),
    });
    expect(closeButton).toBeInTheDocument();
  });

  it("should render the last updated text", () => {
    render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Ostatnia aktualizacja:/)).toBeInTheDocument();
  });

  it("should render markdown content in prose container", () => {
    const { container } = render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>,
    );

    expect(container.querySelector(".legal-markdown")).toBeInTheDocument();
  });
});
