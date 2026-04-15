import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ProcessTimeline } from "./process-timeline";
import { tr } from "@/test/i18n-test";

describe("ProcessTimeline Component", () => {
  it("should render the component", () => {
    const { container } = render(<ProcessTimeline />);
    expect(container).toBeInTheDocument();
  });

  it("should render the process timeline heading", () => {
    render(<ProcessTimeline />);
    expect(screen.getByText(tr("processTimeline.title"))).toBeInTheDocument();
  });

  it("should render all 4 step titles", () => {
    render(<ProcessTimeline />);
    expect(
      screen.getByText(tr("processTimeline.steps.upload.title")),
    ).toBeInTheDocument();
    expect(
      screen.getByText(tr("processTimeline.steps.adjust.title")),
    ).toBeInTheDocument();
    expect(
      screen.getByText(tr("processTimeline.steps.order.title")),
    ).toBeInTheDocument();
    expect(
      screen.getByText(tr("processTimeline.steps.result.title")),
    ).toBeInTheDocument();
  });

  it("should render all 4 step descriptions", () => {
    render(<ProcessTimeline />);
    expect(
      screen.getByText(tr("processTimeline.steps.upload.description")),
    ).toBeInTheDocument();
    expect(
      screen.getByText(tr("processTimeline.steps.adjust.description")),
    ).toBeInTheDocument();
    expect(
      screen.getByText(tr("processTimeline.steps.order.description")),
    ).toBeInTheDocument();
    expect(
      screen.getByText(tr("processTimeline.steps.result.description")),
    ).toBeInTheDocument();
  });

  it("should render 4 step icons", () => {
    const { container } = render(<ProcessTimeline />);
    const svgs = container.querySelectorAll("svg");
    expect(svgs.length).toBeGreaterThanOrEqual(4);
  });

  it("should render arrows between steps", () => {
    const { container } = render(<ProcessTimeline />);
    const arrows = container.querySelectorAll("svg");
    expect(arrows.length).toBeGreaterThanOrEqual(3);
  });

  it("should render a heading element", () => {
    const { container } = render(<ProcessTimeline />);
    const heading = container.querySelector("h2");
    expect(heading).toBeInTheDocument();
  });

  it("should render step items in a grid layout", () => {
    const { container } = render(<ProcessTimeline />);
    const grid = container.querySelector("[class*='grid']");
    expect(grid).toBeInTheDocument();
  });
});
