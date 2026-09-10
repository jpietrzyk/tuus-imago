/// <reference types="@testing-library/jest-dom" />

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MemoryRouter, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { App } from "./App";
import { tr } from "@/test/i18n-test";
import type { LegalPageData } from "@/lib/content-loader";

function checkoutButtonLabel(): RegExp {
  const base = tr("checkout.openCheckout").replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );
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
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
}));

vi.mock("@/lib/supabase-client", () => ({
  supabase: supabaseMock,
}));

const mockLoadImageDimensions = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ width: 3000, height: 2000 }),
);

vi.mock("@/components/image-uploader/load-image-dimensions", () => ({
  loadImageDimensions: mockLoadImageDimensions,
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
  ])("should render legal route %s without runtime errors", (route) => {
    render(
      <MemoryRouter initialEntries={[route]}>
        <App />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("button", { name: tr("common.backToHome") }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

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
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
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
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("should render footer on all routes", () => {
    const { rerender } = render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    // Footer should be on home page
    expect(screen.getByText(/TuusImago/)).toBeInTheDocument();

    // Footer should also be on /about route
    rerender(
      <MemoryRouter initialEntries={["/about"]}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByText(/TuusImago/)).toBeInTheDocument();

    // Footer should also be on /legal route
    rerender(
      <MemoryRouter initialEntries={["/legal"]}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByText(/TuusImago/)).toBeInTheDocument();
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

  it("should render legal menu button in header and clickable copyright in footer", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("button", { name: tr("common.legalMenu") }),
    ).toBeInTheDocument();

    expect(screen.getByText(/TuusImago.com/)).toBeInTheDocument();
  });

  it("should render legal menu action in header", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("button", { name: tr("common.legalMenu") }),
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
      screen.getByRole("button", { name: tr("upload.uploadFromDevice") }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: tr("upload.openCamera") }),
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

    // Multi-file selection fills the empty slots in one go (center first,
    // then the left slot) — no slot switcher needed.
    fireEvent.change(input, {
      target: {
        files: [
          new File(["center"], "center.jpg", { type: "image/jpeg" }),
          new File(["left"], "left.jpg", { type: "image/jpeg" }),
        ],
      },
    });

    await screen.findByRole("img", { name: "Preview" });

    await user.click(
      await screen.findByRole("button", {
        name: tr("checkout.orderSelectionButton"),
      }),
    );

    await user.click(
      await screen.findByRole("checkbox", {
        name: tr("checkout.orderSelectionCheckboxAria", {
          slot: tr("upload.slotLeft"),
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
    expect(screen.queryByText(tr("upload.slotLeft"))).not.toBeInTheDocument();
  });

  it("should not render the upload slot switcher on /upload nor persist it on /checkout", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/upload"]}>
        <App />
      </MemoryRouter>,
    );

    const input = document.querySelector(
      'input[type="file"][accept*="image/jpeg"]',
    ) as HTMLInputElement | null;

    expect(input).not.toBeNull();

    fireEvent.change(input!, {
      target: {
        files: [new File(["center"], "center.jpg", { type: "image/jpeg" })],
      },
    });

    await screen.findByRole("img", { name: "Preview" });

    // The footer slot switcher is hidden from the product UI everywhere:
    // desktop users switch slots via the side/triptych panel previews and
    // mobile users swipe the slider.
    expect(screen.queryByTestId("uploader-slot-dots")).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: tr("checkout.orderSelectionButton"),
      }),
    );

    await user.click(
      screen.getByRole("button", {
        name: tr("checkout.proceedToCheckout"),
      }),
    );

    await screen.findByRole("heading", { name: tr("checkout.title") });

    // The upload-specific slot switcher must not persist onto /checkout
    expect(screen.queryByTestId("uploader-slot-dots")).not.toBeInTheDocument();
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

describe("upload flow routes (/upload ↔ /prepare-painting)", () => {
  let currentPathname = "";

  function LocationProbe() {
    const location = useLocation();
    useEffect(() => {
      currentPathname = location.pathname;
    }, [location.pathname]);
    return null;
  }

  function renderAtRoute(route: string) {
    const renderResult = render(
      <MemoryRouter initialEntries={[route]}>
        <LocationProbe />
        <App />
      </MemoryRouter>,
    );
    return renderResult;
  }

  function expectPathnameEventually(pathname: string) {
    return waitFor(() => {
      expect(currentPathname).toBe(pathname);
    });
  }

  function selectPhoto() {
    const input = document.querySelector(
      'input[type="file"][accept*="image/jpeg"]',
    ) as HTMLInputElement | null;
    expect(input).not.toBeNull();

    fireEvent.change(input!, {
      target: {
        files: [new File(["photo"], "photo.jpg", { type: "image/jpeg" })],
      },
    });
  }

  beforeEach(() => {
    sessionStorage.clear();
    currentPathname = "";
    mockLoadImageDimensions.mockReset().mockResolvedValue({
      width: 3000,
      height: 2000,
    });
  });

  afterEach(() => {
    sessionStorage.clear();
    vi.unstubAllGlobals();
  });

  it("syncs the URL to /prepare-painting after selecting a photo and back to /upload after reset", async () => {
    renderAtRoute("/upload");

    selectPhoto();
    await screen.findByRole("img", { name: "Preview" });

    await expectPathnameEventually("/prepare-painting");

    // The editor state survived the URL switch (same component instance).
    expect(screen.getByRole("img", { name: "Preview" })).toBeInTheDocument();

    // Resetting clears the selection and returns to the selection step.
    fireEvent.click(
      screen.getByRole("button", { name: tr("uploader.resetSlots") }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: tr("uploader.resetSlotsConfirmAction"),
      }),
    );

    await expectPathnameEventually("/upload");
    await waitFor(() => {
      expect(screen.queryByRole("img", { name: "Preview" })).toBeNull();
    });
  });

  it("redirects /prepare-painting to /upload when opened without a selection", async () => {
    renderAtRoute("/prepare-painting");

    await expectPathnameEventually("/upload");

    // The selection screen is showing.
    expect(
      screen.getByRole("button", { name: tr("upload.uploadFromDevice") }),
    ).toBeInTheDocument();
  });

  it("blocks ordering an unprintable slot in the checkout dropup", async () => {
    const user = userEvent.setup();

    // 1200x800 photo: ~50 DPI at the smallest 60x40 cm size — no offered
    // size passes the 72 DPI guard, so the slot must not be orderable.
    mockLoadImageDimensions.mockResolvedValueOnce({
      width: 1200,
      height: 800,
    });

    renderAtRoute("/upload");

    selectPhoto();
    await screen.findByRole("img", { name: "Preview" });
    await expectPathnameEventually("/prepare-painting");

    await user.click(
      await screen.findByRole("button", {
        name: tr("checkout.orderSelectionButton"),
      }),
    );

    expect(
      await screen.findByText(tr("checkout.slotNotPrintable")),
    ).toBeInTheDocument();

    const checkbox = screen.getByRole("checkbox", {
      name: tr("checkout.orderSelectionCheckboxAria", {
        slot: tr("upload.slotCenter"),
      }),
    });
    expect(checkbox).toBeDisabled();
    expect(checkbox).not.toBeChecked();

    // No printable slot is checked — the checkout CTA stays disabled.
    expect(
      screen.getByRole("button", {
        name: tr("checkout.proceedToCheckout"),
      }),
    ).toBeDisabled();
  });

  it("re-enables checkout when an unprintable slot becomes printable again", async () => {
    const user = userEvent.setup();

    // 1700x1300 auto-selects the horizontal 3:2 frame, whose 1700x1133
    // resting crop is just below the 72 DPI bar at the smallest 60x40
    // print — the slot starts unprintable. Switching to the square frame
    // crops 1300x1300 (~82 DPI at 40x40), so the SAME slot becomes
    // printable again without going through an empty-slot reset.
    mockLoadImageDimensions.mockResolvedValueOnce({
      width: 1700,
      height: 1300,
    });

    renderAtRoute("/upload");

    selectPhoto();
    await screen.findByRole("img", { name: "Preview" });
    await expectPathnameEventually("/prepare-painting");

    await user.click(
      await screen.findByRole("button", {
        name: tr("checkout.orderSelectionButton"),
      }),
    );

    const unprintableCheckbox = screen.getByRole("checkbox", {
      name: tr("checkout.orderSelectionCheckboxAria", {
        slot: tr("upload.slotCenter"),
      }),
    });
    await waitFor(() => {
      expect(unprintableCheckbox).toBeDisabled();
    });
    expect(unprintableCheckbox).not.toBeChecked();
    expect(
      screen.getByRole("button", {
        name: tr("checkout.proceedToCheckout"),
      }),
    ).toBeDisabled();

    fireEvent.pointerDown(
      screen.getByTestId("image-proportions-dropdown-trigger"),
    );
    fireEvent.click(screen.getByRole("menuitem", { name: /^Rectangle/ }));

    await user.click(
      await screen.findByRole("button", {
        name: tr("checkout.orderSelectionButton"),
      }),
    );

    const recoveredCheckbox = await screen.findByRole("checkbox", {
      name: tr("checkout.orderSelectionCheckboxAria", {
        slot: tr("upload.slotCenter"),
      }),
    });
    await waitFor(() => {
      expect(recoveredCheckbox).toBeEnabled();
    });
    expect(recoveredCheckbox).toBeChecked();
    expect(
      screen.getByRole("button", {
        name: tr("checkout.proceedToCheckout"),
      }),
    ).toBeEnabled();
  });

  it("allows checkout with a printable slot while another slot is unprintable", async () => {
    const user = userEvent.setup();

    // Multi-pick: the first photo (center slot) is unprintable, the second
    // (left slot) is printable. Ordering must stay possible for the
    // printable one.
    mockLoadImageDimensions
      .mockResolvedValueOnce({ width: 1200, height: 800 })
      .mockResolvedValueOnce({ width: 3000, height: 2000 });

    renderAtRoute("/upload");

    const input = document.querySelector(
      'input[type="file"][accept*="image/jpeg"]',
    ) as HTMLInputElement;
    fireEvent.change(input, {
      target: {
        files: [
          new File(["small"], "small.jpg", { type: "image/jpeg" }),
          new File(["big"], "big.jpg", { type: "image/jpeg" }),
        ],
      },
    });

    await screen.findByRole("img", { name: "Preview" });
    await expectPathnameEventually("/prepare-painting");

    await user.click(
      await screen.findByRole("button", {
        name: tr("checkout.orderSelectionButton"),
      }),
    );

    const smallCheckbox = await screen.findByRole("checkbox", {
      name: tr("checkout.orderSelectionCheckboxAria", {
        slot: tr("upload.slotCenter"),
      }),
    });
    await waitFor(() => {
      expect(smallCheckbox).toBeDisabled();
    });

    const bigCheckbox = screen.getByRole("checkbox", {
      name: tr("checkout.orderSelectionCheckboxAria", {
        slot: tr("upload.slotLeft"),
      }),
    });
    expect(bigCheckbox).toBeEnabled();
    expect(bigCheckbox).toBeChecked();

    // A printable slot is checked — the checkout CTA is active.
    expect(
      screen.getByRole("button", {
        name: tr("checkout.proceedToCheckout"),
      }),
    ).toBeEnabled();
  });
});
