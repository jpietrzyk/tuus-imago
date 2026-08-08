import { describe, expect, it } from "vitest";

import {
  getAllPages,
  getPageBySlug,
  getPagesBySection,
} from "./content-loader";

describe("content-loader", () => {
  it("exposes pages sorted by menu order", () => {
    const pages = getAllPages();
    expect(pages.length).toBeGreaterThan(0);
    for (let i = 1; i < pages.length; i++) {
      expect(pages[i].menuOrder).toBeGreaterThanOrEqual(pages[i - 1].menuOrder);
    }
  });

  it("finds a page by slug", () => {
    const page = getPageBySlug("about");
    expect(page?.title).toBe("O nas");
    expect(page?.menuSection).toBe("company");
  });

  it("returns undefined for unknown slug", () => {
    expect(getPageBySlug("does-not-exist")).toBeUndefined();
  });

  it("filters pages by section", () => {
    const legal = getPagesBySection("legal");
    expect(legal.every((p) => p.menuSection === "legal")).toBe(true);
    expect(legal.some((p) => p.slug === "terms")).toBe(true);

    const payments = getPagesBySection("payments");
    expect(payments.some((p) => p.slug === "payments")).toBe(true);
  });
});
