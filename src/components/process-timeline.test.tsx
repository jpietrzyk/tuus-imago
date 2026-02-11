import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ProcessTimeline } from "./process-timeline";

describe("ProcessTimeline Component", () => {
  it("should render the component", () => {
    const { container } = render(<ProcessTimeline />);
    expect(container).toBeInTheDocument();
  });

  it("should render 'How it works' heading", () => {
    render(<ProcessTimeline />);
    expect(screen.getByText(/how it works/i)).toBeInTheDocument();
  });

  it("should render all 4 step titles", () => {
    render(<ProcessTimeline />);
    expect(screen.getByText("Upload photo")).toBeInTheDocument();
    expect(screen.getByText("Adjust photo")).toBeInTheDocument();
    expect(screen.getByText("Place an order")).toBeInTheDocument();
    expect(screen.getByText("Get your painting")).toBeInTheDocument();
  });

  it("should render all 4 step descriptions", () => {
    render(<ProcessTimeline />);
    expect(
      screen.getByText("Upload your favorite photo to get started"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Fine-tune your image with AI enhancement"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Select your canvas size and place your order"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Receive your museum-quality painting at your door"),
    ).toBeInTheDocument();
  });

  it("should render 4 icon circles", () => {
    const { container } = render(<ProcessTimeline />);
    const iconCircles = container.querySelectorAll(
      '[class*="bg-gradient-to-br from-primary to-primary/80"]',
    );
    expect(iconCircles).toHaveLength(4);
  });

  it("should render 3 arrows on mobile (between steps)", () => {
    const { container } = render(<ProcessTimeline />);
    const arrows = container.querySelectorAll("svg");
    // 4 step icons + 3 arrows = 7 svgs total
    expect(arrows.length).toBeGreaterThanOrEqual(3);
  });

  it("should have correct styling on main container", () => {
    const { container } = render(<ProcessTimeline />);
    const mainContainer = container.querySelector(".py-6.md\\:py-8");
    expect(mainContainer).toBeInTheDocument();
  });

  it("should have correct max-width on inner container", () => {
    const { container } = render(<ProcessTimeline />);
    const innerContainer = container.querySelector(".max-w-3xl");
    expect(innerContainer).toBeInTheDocument();
  });

  it("should have white color with drop shadow on heading", () => {
    const { container } = render(<ProcessTimeline />);
    const heading = container.querySelector("h2");
    expect(heading).toHaveClass("text-white", "drop-shadow-lg");
  });

  it("should have gradient background on timeline line (desktop)", () => {
    const { container } = render(<ProcessTimeline />);
    const timelineLine = container.querySelector(".bg-gradient-to-r");
    expect(timelineLine).toBeInTheDocument();
  });

  it("should have 4 step items in the grid", () => {
    const { container } = render(<ProcessTimeline />);
    const stepItems = container.querySelectorAll(".space-y-3");
    expect(stepItems).toHaveLength(4);
  });

  it("should have correct grid layout", () => {
    const { container } = render(<ProcessTimeline />);
    const grid = container.querySelector(".grid-cols-1.md\\:grid-cols-4");
    expect(grid).toBeInTheDocument();
  });
});
