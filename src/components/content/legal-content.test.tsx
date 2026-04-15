import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LegalContent } from "./legal-content";

describe("LegalContent", () => {
  it("renders all section headings", () => {
    render(<LegalContent />);
    expect(screen.getByText("Privacy Policy")).toBeInTheDocument();
    expect(screen.getByText("Terms of Service")).toBeInTheDocument();
    expect(screen.getByText("Contact & Support")).toBeInTheDocument();
  });
});
