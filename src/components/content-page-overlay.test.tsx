import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ContentPageOverlay } from "@/components/content-page-overlay";
import type { LegalPageData } from "@/lib/content-loader";
import { t } from "@/locales/i18n";

vi.mock("@/locales/i18n", () => ({
  t: vi.fn((key: string) => key),
}));

vi.mock("@/lib/content-loader", () => ({}));

const fullPage: LegalPageData = {
  title: "Test Title",
  subtitle: "Test Subtitle",
  slug: "test",
  icon: "FileText",
  menuSection: "legal",
  menuOrder: 1,
  lastUpdated: "2025-01-01",
  body: "# Hello\n\nSome **bold** text.",
};

describe("ContentPageOverlay", () => {
  const onClose = vi.fn();
  const page = fullPage;

  beforeEach(() => {
    onClose.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders page data", () => {
    render(<ContentPageOverlay page={page} onClose={onClose} />);
    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test Subtitle")).toBeInTheDocument();
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText(/2025-01-01/)).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    render(<ContentPageOverlay page={page} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText(t("common.backToHome")));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders fallback when page is undefined", () => {
    render(<ContentPageOverlay page={undefined} onClose={onClose} />);
    expect(screen.getByText("common.contentNotFound")).toBeInTheDocument();
    expect(screen.getByText("common.contentNotFoundHint")).toBeInTheDocument();
  });

  it("calls onClose on Escape key", () => {
    render(<ContentPageOverlay page={page} onClose={onClose} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose on backdrop click", () => {
    const { container } = render(
      <ContentPageOverlay page={page} onClose={onClose} />,
    );
    fireEvent.click(container.firstElementChild!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
