/// <reference types="@testing-library/jest-dom" />

import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { App } from "./App";

describe("App Component Routing", () => {
  it("should render landing page when route is /", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    // Check for main landing page elements
    expect(
      screen.getByRole("button", { name: /upload your photo/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /paint your photo/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /we print your ai-enhanced images on professional canvas/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /real looking paintings crafted with museum-quality materials/i,
      ),
    ).toBeInTheDocument();
  });

  it("should render About page when route is /about", () => {
    render(
      <MemoryRouter initialEntries={["/about"]}>
        <App />
      </MemoryRouter>,
    );

    // Check for about page elements
    expect(
      screen.getByRole("heading", { name: /about us/i }),
    ).toBeInTheDocument();
  });

  it("should render Legal page when route is /legal", () => {
    render(
      <MemoryRouter initialEntries={["/legal"]}>
        <App />
      </MemoryRouter>,
    );

    // Check for legal page elements
    expect(
      screen.getByRole("heading", { name: /legal information/i }),
    ).toBeInTheDocument();
  });

  it("should render footer on all routes", () => {
    const { rerender } = render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    // Footer should be on home page
    expect(
      screen.getByText(/tuus imago. all rights reserved/i),
    ).toBeInTheDocument();

    // Footer should also be on /about route
    rerender(
      <MemoryRouter initialEntries={["/about"]}>
        <App />
      </MemoryRouter>,
    );
    expect(
      screen.getByText(/tuus imago. all rights reserved/i),
    ).toBeInTheDocument();

    // Footer should also be on /legal route
    rerender(
      <MemoryRouter initialEntries={["/legal"]}>
        <App />
      </MemoryRouter>,
    );
    expect(
      screen.getByText(/tuus imago. all rights reserved/i),
    ).toBeInTheDocument();
  });

  it("should render Footer links on all pages", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    // Check for about and legal links in footer
    const aboutLink = screen.getByRole("link", { name: /about us/i });
    const legalLink = screen.getByRole("link", { name: /legal & privacy/i });

    expect(aboutLink).toBeInTheDocument();
    expect(aboutLink).toHaveAttribute("href", "/about");
    expect(legalLink).toBeInTheDocument();
    expect(legalLink).toHaveAttribute("href", "/legal");
  });

  it("should render upload page when route is /upload", () => {
    render(
      <MemoryRouter initialEntries={["/upload"]}>
        <App />
      </MemoryRouter>,
    );

    // Check for upload page elements
    expect(
      screen.getByText(/Click to upload or drag and drop your image here/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/supports jpg, png, and webp/i),
    ).toBeInTheDocument();
  });

  it("should render upload button on landing page", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    // Upload button should be on landing page
    expect(
      screen.getByRole("button", { name: /upload your photo/i }),
    ).toBeInTheDocument();
  });

  it("should not render upload button on About page", () => {
    render(
      <MemoryRouter initialEntries={["/about"]}>
        <App />
      </MemoryRouter>,
    );

    // Upload button should NOT be on about page
    expect(
      screen.queryByRole("button", { name: /upload your photo/i }),
    ).not.toBeInTheDocument();
  });

  it("should not render upload button on Legal page", () => {
    render(
      <MemoryRouter initialEntries={["/legal"]}>
        <App />
      </MemoryRouter>,
    );

    // Upload button should NOT be on legal page
    expect(
      screen.queryByRole("button", { name: /upload your photo/i }),
    ).not.toBeInTheDocument();
  });

  it("should render Back to Home link on About page", () => {
    render(
      <MemoryRouter initialEntries={["/about"]}>
        <App />
      </MemoryRouter>,
    );

    const backLink = screen.getByRole("link", { name: /back to home/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute("href", "/");
  });

  it("should render Back to Home link on Legal page", () => {
    render(
      <MemoryRouter initialEntries={["/legal"]}>
        <App />
      </MemoryRouter>,
    );

    const backLink = screen.getByRole("link", { name: /back to home/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute("href", "/");
  });

  it("should have correct layout structure", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    // App should be wrapped in a div with h-screen and flex flex-col
    const appWrapper = container.firstChild as HTMLElement;
    expect(appWrapper).toHaveClass(
      "h-screen",
      "flex",
      "flex-col",
      "overflow-hidden",
    );
  });
});
