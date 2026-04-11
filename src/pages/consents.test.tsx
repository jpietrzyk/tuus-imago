import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { ConsentsPage } from "./consents";
import { t } from "@/locales/i18n";

vi.mock("@/lib/content-loader", () => ({
  getPageBySlug: vi.fn((slug: string) =>
    slug === "consents"
      ? {
          title: "Test Title",
          subtitle: "Test Subtitle",
          slug: "consents",
          icon: "CheckCircle",
          menuSection: "legal",
          menuOrder: 8,
          lastUpdated: "2025-02-01",
          body: "## Section One\n\n## Section Two",
        }
      : undefined,
  ),
  getAllPages: vi.fn(() => []),
  getPagesBySection: vi.fn(() => []),
}));

describe("ConsentsPage Component", () => {
  it("should render the page heading", () => {
    render(
      <MemoryRouter>
        <ConsentsPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("should render the close button", () => {
    render(
      <MemoryRouter>
        <ConsentsPage />
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
        <ConsentsPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Ostatnia aktualizacja:/)).toBeInTheDocument();
  });

  it("should render markdown content in prose container", () => {
    const { container } = render(
      <MemoryRouter>
        <ConsentsPage />
      </MemoryRouter>,
    );

    expect(container.querySelector(".legal-markdown")).toBeInTheDocument();
  });
});
