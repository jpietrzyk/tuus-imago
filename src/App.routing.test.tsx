/// <reference types="@testing-library/jest-dom" />

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { App } from "./App";
import { tr } from "@/test/i18n-test";
import type { LegalPageData } from "@/lib/content-loader";

function checkoutButtonLabel(): RegExp {
  const base = tr("checkout.openCheckout").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${base}`);
}

const fixturePage = (overrides?: Partial<LegalPageData>): LegalPageData => ({
  title: "Test Page Title",
  subtitle: "Test subtitle",
  slug: "test",
  icon: "FileText",
  menuSection: "legal",
  menuOrder: 1,
  lastUpdated: "2025-01-01",
  body: "Test body content",
  ...overrides,
});

vi.mock("@/lib/content-loader", () => ({
  getPageBySlug: vi.fn((slug: string) => {
    const pages: Record<string, ReturnType<typeof fixturePage>> = {
      consents: fixturePage({ slug: "consents" }),
      contact: fixturePage({ slug: "contact" }),
      cookies: fixturePage({ slug: "cookies" }),
      privacy: fixturePage({ slug: "privacy" }),
      returns: fixturePage({ slug: "returns" }),
      security: fixturePage({ slug: "security" }),
      shipping: fixturePage({ slug: "shipping" }),
      terms: fixturePage({ slug: "terms" }),
      about: fixturePage({ slug: "about" }),
      legal: fixturePage({ slug: "legal" }),
      complaint: fixturePage({ slug: "complaint" }),
      payments: fixturePage({ slug: "payments" }),
    };
    return pages[slug];
  }),
  getAllPages: vi.fn(() => []),
  getPagesBySection: vi.fn(() => []),
}));

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    user: null,
    session: null,
    loading: false,
    signUp: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    signInWithOAuth: vi.fn(),
    signInWithOtp: vi.fn(),
    resetPassword: vi.fn(),
    updatePassword: vi.fn(),
  }),
  POST_AUTH_REDIRECT_KEY: "checkout-oauth-redirect",
}));

const { supabaseMock } = vi.hoisted(() => ({
  supabaseMock: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  },
}));

vi.mock("@/lib/supabase-client", () => ({
  supabase: supabaseMock,
}));

vi.mock("@/lib/cloudinary-upload", () => ({
  uploadImageToCloudinary: vi.fn(
    async (input: {
      context?: string;
      transformations: {
        rotation: number;
        flipHorizontal: boolean;
        flipVertical: boolean;
        brightness: number;
        contrast: number;
        grayscale: number;
        blur: number;
      };
    }) => {
      const slotMatch = input.context?.match(/slot=(left|center|right)/);
      const slotKey = slotMatch?.[1] ?? "center";

      return {
        asset: {
          public_id: `upload-${slotKey}`,
          secure_url: `https://res.cloudinary.com/test/image/upload/v1/${slotKey}.jpg`,
          width: 1200,
          height: 800,
          bytes: 1234,
          format: "jpg",
          url: `https://res.cloudinary.com/test/image/upload/v1/${slotKey}.jpg`,
        },
        transformedUrl: `https://res.cloudinary.com/test/image/upload/v1/${slotKey}.jpg`,
        transformations: input.transformations,
      };
    },
  ),
}));

describe("App Component Routing", () => {
  it.each([
    "/consents",
    "/contact",
    "/cookies",
    "/privacy",
    "/returns",
    "/security",
    "/shipping",
    "/terms",
  ])(
    "should render legal route %s without runtime errors",
    (route) => {
      render(
        <MemoryRouter initialEntries={[route]}>
          <App />
        </MemoryRouter>,
      );

      expect(
        screen.getByRole("button", { name: tr("common.backToHome") }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 1 }),
      ).toBeInTheDocument();
    },
  );

  it("should render upload entry page when route is /", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    const uploadEntryLink = screen.getByRole("link", {
      name: tr("homeUploadEntry.ctaText"),
    });

    expect(uploadEntryLink).toBeInTheDocument();
    expect(uploadEntryLink).toHaveAttribute("href", "/upload");
    expect(screen.getByText(tr("homeUploadEntry.ctaText"))).toBeInTheDocument();
  });

  it("should render landing page when route is /how-it-works", () => {
    render(
      <MemoryRouter initialEntries={["/how-it-works"]}>
        <App />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("button", { name: tr("landing.cta.button") }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: tr("landing.hero.title") }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(tr("landing.hero.description")),
    ).toBeInTheDocument();
  });

  it("should render about page when route is /about", () => {
    render(
      <MemoryRouter initialEntries={["/about"]}>
        <App />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("button", { name: tr("common.backToHome") }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1 }),
    ).toBeInTheDocument();
  });

  it("should render legal page when route is /legal", () => {
    render(
      <MemoryRouter initialEntries={["/legal"]}>
        <App />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("button", { name: tr("common.backToHome") }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1 }),
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
      screen.getByText(/TuusImago/),
    ).toBeInTheDocument();

    // Footer should also be on /about route
    rerender(
      <MemoryRouter initialEntries={["/about"]}>
        <App />
      </MemoryRouter>,
    );
    expect(
      screen.getByText(/TuusImago/),
    ).toBeInTheDocument();

    // Footer should also be on /legal route
    rerender(
      <MemoryRouter initialEntries={["/legal"]}>
        <App />
      </MemoryRouter>,
    );
    expect(
      screen.getByText(/TuusImago/),
    ).toBeInTheDocument();
  });

  it("should render header with logo link on all routes", () => {
    const { rerender } = render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    const homeLogoLink = screen.getByRole("link", {
      name: "Tuus Imago – home",
    });
    expect(homeLogoLink).toBeInTheDocument();
    expect(homeLogoLink).toHaveAttribute("href", "/");

    rerender(
      <MemoryRouter initialEntries={["/about"]}>
        <App />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("link", { name: "Tuus Imago – home" }),
    ).toHaveAttribute("href", "/");
  });

  it("should render footer links on all pages", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    const legalButtons = screen.getAllByRole("button", {
      name: tr("common.legalMenu"),
    });

    expect(legalButtons.length).toBeGreaterThanOrEqual(2);
  });

  it("should render payments action in header", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("button", { name: tr("common.paymentsP24") }),
    ).toBeInTheDocument();
  });

  it("should render upload page when route is /upload", () => {
    render(
      <MemoryRouter initialEntries={["/upload"]}>
        <App />
      </MemoryRouter>,
    );

    // Check for upload page elements
    expect(
      screen.getByRole("button", { name: "Upload from device" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Open camera" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: checkoutButtonLabel() }),
    ).not.toBeInTheDocument();
  });

  it("should render upload button on /how-it-works page", () => {
    render(
      <MemoryRouter initialEntries={["/how-it-works"]}>
        <App />
      </MemoryRouter>,
    );

    // Upload button should be on how-it-works page
    expect(
      screen.getByRole("button", { name: tr("landing.cta.button") }),
    ).toBeInTheDocument();
  });

  it("should not render upload button on about page", () => {
    render(
      <MemoryRouter initialEntries={["/about"]}>
        <App />
      </MemoryRouter>,
    );

    // Upload button should NOT be on about page
    expect(
      screen.queryByRole("button", { name: tr("landing.cta.button") }),
    ).not.toBeInTheDocument();
  });

  it("should not render upload button on legal page", () => {
    render(
      <MemoryRouter initialEntries={["/legal"]}>
        <App />
      </MemoryRouter>,
    );

    // Upload button should NOT be on legal page
    expect(
      screen.queryByRole("button", { name: tr("landing.cta.button") }),
    ).not.toBeInTheDocument();
  });

  it("should not render footer checkout CTA on non-upload routes", () => {
    render(
      <MemoryRouter initialEntries={["/about"]}>
        <App />
      </MemoryRouter>,
    );

    expect(
      screen.queryByRole("button", { name: checkoutButtonLabel() }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: tr("uploader.resetSlots") }),
    ).not.toBeInTheDocument();
  });

  it("should show footer reset CTA on upload route only after selecting an image", async () => {
    render(
      <MemoryRouter initialEntries={["/upload"]}>
        <App />
      </MemoryRouter>,
    );

    expect(
      screen.queryByRole("button", { name: tr("uploader.resetSlots") }),
    ).not.toBeInTheDocument();

    const input = document.querySelector(
      'input[type="file"][accept*="image/jpeg"]',
    ) as HTMLInputElement | null;

    expect(input).toBeDefined();

    if (input) {
      fireEvent.change(input, {
        target: {
          files: [new File(["test"], "test.jpg", { type: "image/jpeg" })],
        },
      });

      await screen.findByRole("img", { name: "Preview" });

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: tr("uploader.resetSlots") }),
        ).toBeInTheDocument();
      });
    }
  });

  it("should show footer checkout CTA on upload route after selecting an image", async () => {
    render(
      <MemoryRouter initialEntries={["/upload"]}>
        <App />
      </MemoryRouter>,
    );

    expect(
      screen.queryByRole("button", {
        name: checkoutButtonLabel(),
      }),
    ).not.toBeInTheDocument();

    const input = document.querySelector(
      'input[type="file"][accept*="image/jpeg"]',
    ) as HTMLInputElement | null;

    expect(input).toBeDefined();

    if (input) {
      fireEvent.change(input, {
        target: {
          files: [new File(["test"], "test.jpg", { type: "image/jpeg" })],
        },
      });

      await waitFor(() => {
        expect(
          screen.getByRole("button", {
            name: checkoutButtonLabel(),
          }),
        ).toBeInTheDocument();
      });
    }
  });

  it("should send only checked uploaded slots to checkout", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/upload"]}>
        <App />
      </MemoryRouter>,
    );

    const input = document.querySelector(
      'input[type="file"][accept*="image/jpeg"]',
    ) as HTMLInputElement | null;

    expect(input).toBeDefined();

    if (!input) {
      return;
    }

    fireEvent.change(input, {
      target: {
        files: [new File(["left"], "left.jpg", { type: "image/jpeg" })],
      },
    });

    await screen.findByRole("img", { name: "Preview" });

    await user.click(screen.getByTestId("uploader-slot-dot-2"));

    const editorInput = document.querySelector(
      'input[type="file"][accept="image/jpeg,image/png,image/webp"]',
    ) as HTMLInputElement | null;

    expect(editorInput).toBeDefined();

    if (editorInput) {
      fireEvent.change(editorInput, {
        target: {
          files: [new File(["right"], "right.jpg", { type: "image/jpeg" })],
        },
      });
    }

    await waitFor(() => {
      expect(
        screen.getByTestId("uploader-slider-side-right").querySelector("img"),
      ).toBeTruthy();
    });

    await user.click(
      screen.getByRole("button", {
        name: checkoutButtonLabel(),
      }),
    );

    await user.click(
      screen.getByRole("checkbox", {
        name: tr("checkout.orderSelectionCheckboxAria", {
          slot: tr("upload.slotRight"),
        }),
      }),
    );

    await user.click(
      screen.getByRole("button", {
        name: tr("checkout.proceedToCheckout"),
      }),
    );

    await screen.findByRole("heading", { name: tr("checkout.title") });

    expect(screen.getByText(tr("upload.slotCenter"))).toBeInTheDocument();
    expect(screen.queryByText(tr("upload.slotRight"))).not.toBeInTheDocument();
  });

  it("should render back navigation button on about page", () => {
    render(
      <MemoryRouter initialEntries={["/about"]}>
        <App />
      </MemoryRouter>,
    );

    const backButton = screen.getByRole("button", {
      name: tr("common.backToHome"),
    });
    expect(backButton).toBeInTheDocument();
  });

  it("should render back navigation button on legal page", () => {
    render(
      <MemoryRouter initialEntries={["/legal"]}>
        <App />
      </MemoryRouter>,
    );

    const backButton = screen.getByRole("button", {
      name: tr("common.backToHome"),
    });
    expect(backButton).toBeInTheDocument();
  });

  it("should have correct layout structure", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    // App should be wrapped in a div with h-screen and flex flex-col
    const appWrapper = container.firstChild as HTMLElement;
    expect(appWrapper).toHaveClass("h-screen", "flex", "flex-col");
  });
});
