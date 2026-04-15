import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AboutContent } from "./about-content";

describe("AboutContent", () => {
  it("renders all section headings", () => {
    render(<AboutContent />);
    expect(screen.getByText("Our Mission")).toBeInTheDocument();
    expect(screen.getByText("Our Story")).toBeInTheDocument();
    expect(screen.getByText("What We Do")).toBeInTheDocument();
    expect(screen.getByText("Our Values")).toBeInTheDocument();
    expect(screen.getByText("Get in Touch")).toBeInTheDocument();
  });
});
