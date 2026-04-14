import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

vi.mock("@refinedev/core", () => ({
  Refine: ({ children, resources }: { children: React.ReactNode; resources: Array<{ name: string }> }) => (
    <div data-testid="refine-provider">
      <div data-testid="resource-count">{resources.length}</div>
      {resources.map((r) => (
        <span key={r.name} data-testid={`resource-${r.name}`}>{r.name}</span>
      ))}
      {children}
    </div>
  ),
}));

vi.mock("./data-provider", () => ({
  adminDataProvider: {},
}));

vi.mock("./auth-provider", () => ({
  adminAuthProvider: {},
}));

import { AdminApp } from "./AdminApp";

describe("AdminApp", () => {
  it("registers all resources", () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<AdminApp><div>Content</div></AdminApp>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByTestId("resource-count")).toHaveTextContent("8");
    expect(screen.getByTestId("resource-dashboard")).toBeInTheDocument();
    expect(screen.getByTestId("resource-orders")).toBeInTheDocument();
    expect(screen.getByTestId("resource-coupons")).toBeInTheDocument();
    expect(screen.getByTestId("resource-partner_refs")).toBeInTheDocument();
    expect(screen.getByTestId("resource-partners")).toBeInTheDocument();
    expect(screen.getByTestId("resource-customers")).toBeInTheDocument();
    expect(screen.getByTestId("resource-users")).toBeInTheDocument();
    expect(screen.getByTestId("resource-admins")).toBeInTheDocument();
  });

  it("renders children", () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<AdminApp><div>Child Content</div></AdminApp>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Child Content")).toBeInTheDocument();
  });
});
