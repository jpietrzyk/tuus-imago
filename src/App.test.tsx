import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { App } from "./App";

describe("App", () => {
  it("renders without crashing", () => {
    const { container } = render(<App />);
    expect(container).toBeDefined();
  });

  it("displays background image", () => {
    const { container } = render(<App />);
    const bgDiv = container.firstChild as HTMLElement;

    expect(bgDiv).toHaveClass("min-h-screen");
    expect(bgDiv).toHaveClass("bg-cover");
    expect(bgDiv).toHaveClass("bg-center");
    expect(bgDiv.style.backgroundImage).toBeTruthy();
  });
});
