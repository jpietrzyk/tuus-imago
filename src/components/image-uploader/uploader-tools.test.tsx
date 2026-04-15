import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { UploaderTools } from "./uploader-tools";

const defaultProps = {
  onSelectProportion: vi.fn(),
  selectedProportion: "horizontal" as const,
};

describe("UploaderTools", () => {
  it("renders proportion dropdown trigger", () => {
    render(<UploaderTools {...defaultProps} />);
    expect(screen.getByTestId("image-proportions-dropdown-trigger")).toBeInTheDocument();
  });

  it("renders dropdown trigger with selected proportion label", () => {
    render(<UploaderTools {...defaultProps} />);
    expect(screen.getByTestId("image-proportions-dropdown-trigger")).toHaveAttribute(
      "aria-label",
      "Horizontal",
    );
  });

  it("renders trigger with different selected proportion", () => {
    render(
      <UploaderTools {...defaultProps} selectedProportion="vertical" />,
    );
    expect(screen.getByTestId("image-proportions-dropdown-trigger")).toHaveAttribute(
      "aria-label",
      "Vertical",
    );
  });

  it("shows coverage hint when showCoverageDetails and valid coverage", () => {
    render(
      <UploaderTools
        {...defaultProps}
        showCoverageDetails
        coveragePercent={{ horizontal: 75.123 }}
      />,
    );
    expect(screen.getByTestId("selected-coverage-hint")).toBeInTheDocument();
    expect(screen.getByText(/75\.12%/)).toBeInTheDocument();
  });

  it("hides coverage hint when showCoverageDetails=false", () => {
    render(
      <UploaderTools
        {...defaultProps}
        showCoverageDetails={false}
        coveragePercent={{ horizontal: 75.123 }}
      />,
    );
    expect(screen.queryByTestId("selected-coverage-hint")).not.toBeInTheDocument();
  });
});
