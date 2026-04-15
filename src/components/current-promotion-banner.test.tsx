import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CurrentPromotionBanner } from "@/components/current-promotion-banner";

describe("CurrentPromotionBanner", () => {
  it("renders slogan when provided", () => {
    render(<CurrentPromotionBanner slogan="Spring Sale -20%!" />);
    expect(screen.getByText("Spring Sale -20%!")).toBeInTheDocument();
  });

  it("renders nothing when slogan is null", () => {
    const { container } = render(<CurrentPromotionBanner slogan={null} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders nothing when slogan is undefined", () => {
    const { container } = render(<CurrentPromotionBanner slogan={undefined} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders nothing when slogan is empty string", () => {
    const { container } = render(<CurrentPromotionBanner slogan="" />);
    expect(container.innerHTML).toBe("");
  });

  it("applies correct styling classes", () => {
    render(<CurrentPromotionBanner slogan="Test" />);
    const el = screen.getByText("Test");
    expect(el.className).toContain("bg-blue-100");
    expect(el.className).toContain("text-blue-700");
  });
});
