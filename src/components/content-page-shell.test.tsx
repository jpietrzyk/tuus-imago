import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { ContentPageShell } from "./content-page-shell";
import { t } from "@/locales/i18n";

vi.mock("@/lib/content-loader", () => ({
  getPageBySlug: vi.fn(),
  getAllPages: vi.fn(() => []),
  getPagesBySection: vi.fn(() => []),
}));

describe("ContentPageShell Component", () => {
  it("should render content when page is found", () => {
    render(
      <MemoryRouter>
        <ContentPageShell
          page={{
            title: "Test Title",
            subtitle: "Test Subtitle",
            slug: "test",
            icon: "FileText",
            menuSection: "legal",
            menuOrder: 1,
            lastUpdated: "2025-01-01",
            body: "## Heading",
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Test Title",
    );
    expect(screen.getByText(/Ostatnia aktualizacja:/)).toBeInTheDocument();
  });

  it("should render children when page is found", () => {
    render(
      <MemoryRouter>
        <ContentPageShell
          page={{
            title: "Test Title",
            subtitle: "Test Subtitle",
            slug: "test",
            icon: "FileText",
            menuSection: "legal",
            menuOrder: 1,
            lastUpdated: "2025-01-01",
            body: "Body text",
          }}
        >
          <div data-testid="child-content">Child content</div>
        </ContentPageShell>
      </MemoryRouter>,
    );

    expect(screen.getByTestId("child-content")).toBeInTheDocument();
  });

  it("should render fallback UI when page is undefined", () => {
    render(
      <MemoryRouter>
        <ContentPageShell page={undefined} />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: t("common.contentNotFound") }),
    ).toBeInTheDocument();
    expect(screen.getByText(t("common.contentNotFoundHint"))).toBeInTheDocument();
  });

  it("should render back to home link in fallback UI", () => {
    render(
      <MemoryRouter>
        <ContentPageShell page={undefined} />
      </MemoryRouter>,
    );

    const backLink = screen.getByRole("link", {
      name: t("common.backToHome"),
    });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute("href", "/");
  });
});
