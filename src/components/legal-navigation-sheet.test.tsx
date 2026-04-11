import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { LegalNavigationSheet } from "./legal-navigation-sheet";
import { tr } from "@/test/i18n-test";

const legalPages = [
  { title: "Legal Page A", slug: "legal-a", icon: "FileText", menuSection: "legal", menuOrder: 1 },
  { title: "Legal Page B", slug: "legal-b", icon: "Shield", menuSection: "legal", menuOrder: 2 },
];

const paymentPages = [
  { title: "Payment Page A", slug: "pay-a", icon: "BadgeDollarSign", menuSection: "payments", menuOrder: 1 },
];

const companyPages = [
  { title: "Company Page A", slug: "comp-a", icon: "Building2", menuSection: "company", menuOrder: 1 },
  { title: "Company Page B", slug: "comp-b", icon: "Mail", menuSection: "company", menuOrder: 2 },
];

vi.mock("@/lib/content-loader", () => ({
  getPagesBySection: vi.fn((section: string) => {
    if (section === "legal") return legalPages;
    if (section === "payments") return paymentPages;
    if (section === "company") return companyPages;
    return [];
  }),
  getPageBySlug: vi.fn(() => undefined),
  getAllPages: vi.fn(() => []),
}));

function renderSheet(
  props: Partial<Parameters<typeof LegalNavigationSheet>[0]> = {},
) {
  const defaults = {
    open: true,
    onOpenChange: vi.fn(),
    onOpenContentPage: vi.fn(),
    activeSection: "legal" as const,
  };
  return render(
    <MemoryRouter>
      <LegalNavigationSheet {...defaults} {...props} />
    </MemoryRouter>,
  );
}

describe("LegalNavigationSheet", () => {
  it("renders title and subtitle when open", () => {
    renderSheet();

    expect(screen.getByText(tr("legalMenu.title"))).toBeInTheDocument();
    expect(screen.getByText(tr("legalMenu.subtitle"))).toBeInTheDocument();
  });

  it("does not render content when closed", () => {
    renderSheet({ open: false });

    expect(screen.queryByText(tr("legalMenu.title"))).not.toBeInTheDocument();
  });

  it("renders links for all legal section pages", () => {
    renderSheet();

    legalPages.forEach((page) => {
      expect(
        screen.getByRole("button", { name: page.title }),
      ).toBeInTheDocument();
    });
  });

  it("renders links for all company section pages", () => {
    renderSheet();

    companyPages.forEach((page) => {
      expect(
        screen.getByRole("button", { name: page.title }),
      ).toBeInTheDocument();
    });
  });

  it("renders links for all payment section pages", () => {
    renderSheet();

    paymentPages.forEach((page) => {
      expect(
        screen.getByRole("button", { name: page.title }),
      ).toBeInTheDocument();
    });
  });

  it("renders payment intro text", () => {
    renderSheet();

    expect(screen.getByText(tr("legalMenu.paymentIntro"))).toBeInTheDocument();
  });

  it("renders section navigation buttons", () => {
    renderSheet();

    expect(
      screen.getByRole("button", { name: tr("common.legalMenu") }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: tr("common.paymentsP24") }),
    ).toBeInTheDocument();
  });

  it("calls onOpenChange(false) when close button is clicked", () => {
    const onOpenChange = vi.fn();
    renderSheet({ onOpenChange });

    fireEvent.click(
      screen.getByRole("button", { name: tr("legalMenu.close") }),
    );

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("calls onOpenChange(false) when a legal link is clicked", () => {
    const onOpenChange = vi.fn();
    const onOpenContentPage = vi.fn();
    renderSheet({ onOpenChange, onOpenContentPage });

    fireEvent.click(screen.getByRole("button", { name: legalPages[0].title }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onOpenContentPage).toHaveBeenCalledWith(legalPages[0].slug);
  });

  it("calls onOpenChange(false) when a company link is clicked", () => {
    const onOpenChange = vi.fn();
    const onOpenContentPage = vi.fn();
    renderSheet({ onOpenChange, onOpenContentPage });

    fireEvent.click(screen.getByRole("button", { name: companyPages[0].title }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onOpenContentPage).toHaveBeenCalledWith(companyPages[0].slug);
  });

  it("legal nav button has secondary variant when activeSection is legal", () => {
    renderSheet({ activeSection: "legal" });

    const legalButton = screen.getByRole("button", {
      name: tr("common.legalMenu"),
    });
    expect(legalButton.className).toMatch(/secondary/);
  });

  it("payments nav button has secondary variant when activeSection is payments", () => {
    renderSheet({ activeSection: "payments" });

    const paymentsButton = screen.getByRole("button", {
      name: tr("common.paymentsP24"),
    });
    expect(paymentsButton.className).toMatch(/secondary/);
  });
});
