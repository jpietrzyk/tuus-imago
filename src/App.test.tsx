import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { App } from "./App";

describe("App", () => {
  it("renders without crashing", () => {
    const { container } = render(<App />);
    expect(container).toBeDefined();
  });

  it("displays app title", () => {
    render(<App />);
    expect(screen.getByText("Tuus Imago")).toBeDefined();
  });

  it("displays upload widget button", () => {
    render(<App />);
    expect(screen.getByText("Upload Your Photo")).toBeDefined();
  });

  it("displays description text", () => {
    render(<App />);
    expect(
      screen.getByText(
        "Upload your photo for AI enhancement and canvas printing",
      ),
    ).toBeDefined();
  });

  it("displays Legal Information trigger button", () => {
    render(<App />);
    expect(
      screen.getByText("Legal Information & Privacy Policy"),
    ).toBeDefined();
  });
});
