/// <reference types="@testing-library/jest-dom" />

import { render, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { MemoryRouter } from "react-router-dom";
import { App } from "./App";
import type { LegalPageData } from "@/lib/content-loader";

function fixturePage(overrides?: Partial<LegalPageData>): LegalPageData {
  return {
    title: "Test Page Title",
    subtitle: "Test subtitle",
    slug: "test",
    icon: "FileText",
    menuSection: "legal",
    menuOrder: 1,
    lastUpdated: "2025-01-01",
    body: "Test body content",
    ...overrides,
  };
}

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

vi.mock("@/lib/cloudinary-upload", () => ({
  uploadImageToCloudinary: vi.fn(async () => ({
    asset: {
      public_id: "upload-center",
      secure_url: "https://res.cloudinary.com/test/image/upload/v1/center.jpg",
      width: 1200,
      height: 800,
      bytes: 1234,
      format: "jpg",
      url: "https://res.cloudinary.com/test/image/upload/v1/center.jpg",
    },
    transformedUrl:
      "https://res.cloudinary.com/test/image/upload/v1/center.jpg",
    transformations: {
      rotation: 0,
      flipHorizontal: false,
      flipVertical: false,
      brightness: 0,
      contrast: 0,
      grayscale: 0,
      blur: 0,
    },
  })),
}));

function installMatchMediaMock(matches: boolean) {
  const listeners: ((e: MediaQueryListEvent) => void)[] = [];

  const mql = {
    matches,
    media: "(min-width: 768px)",
    addEventListener: vi.fn((_event: string, handler: (e: MediaQueryListEvent) => void) => {
      listeners.push(handler);
    }),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
    onchange: null,
  };

  const original = window.matchMedia;
  window.matchMedia = vi.fn(() => mql) as unknown as typeof window.matchMedia;

  return { mql, listeners, original };
}

function installViewportStub(width: number, height: number) {
  const originalWidth = window.innerWidth;
  const originalHeight = window.innerHeight;
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, "innerHeight", {
    writable: true,
    configurable: true,
    value: height,
  });
  return () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: originalWidth,
    });
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: originalHeight,
    });
  };
}

describe("StorefrontApp background image", () => {
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    vi.restoreAllMocks();
  });

  it("uses mobile background with cover sizing when viewport is below 768px", () => {
    const restoreViewport = installViewportStub(390, 844);
    const { mql } = installMatchMediaMock(false);

    const { container } = render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    expect(mql.addEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass("h-screen");
    const bgStyle = wrapper.style.backgroundImage;
    expect(bgStyle).toContain("bg_mobile");
    expect(bgStyle).not.toContain("bg_desktop");
    expect(wrapper.style.backgroundSize).toBe("cover");
    expect(wrapper.style.backgroundAttachment).toBe("");
    restoreViewport();
  });

  it("uses desktop background zoomed out to reveal more image on wide viewports", () => {
    const restoreViewport = installViewportStub(1920, 1080);
    const { mql } = installMatchMediaMock(true);

    const { container } = render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    expect(mql.addEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass("h-screen");
    const bgStyle = wrapper.style.backgroundImage;
    expect(bgStyle).toContain("bg_desktop");
    expect(bgStyle).not.toContain("bg_mobile");
    expect(wrapper.style.backgroundSize).toBe("100% 1164px");
    expect(wrapper.style.backgroundAttachment).toBe("");
    restoreViewport();
  });

  it("keeps desktop background at cover sizing when the viewport already matches the image aspect", () => {
    const restoreViewport = installViewportStub(1500, 1000);
    installMatchMediaMock(true);

    const { container } = render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.backgroundSize).toBe("100% 1000px");
    restoreViewport();
  });

  it("updates desktop background size when the window is resized", async () => {
    const restoreViewport = installViewportStub(1920, 1080);
    installMatchMediaMock(true);

    const { container } = render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.backgroundSize).toBe("100% 1164px");

    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 2560 });
    await act(async () => {
      window.dispatchEvent(new Event("resize"));
    });

    await waitFor(() => {
      expect(wrapper.style.backgroundSize).toBe("100% 1552px");
    });
    restoreViewport();
  });

  it("removes matchMedia listener on unmount", () => {
    const { mql } = installMatchMediaMock(true);

    const { unmount } = render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    unmount();

    expect(mql.removeEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );
  });

  it("updates background when viewport crosses breakpoint", async () => {
    const restoreViewport = installViewportStub(1920, 1080);
    const { mql, listeners } = installMatchMediaMock(true);

    const { container } = render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.backgroundImage).toContain("bg_desktop");
    expect(wrapper.style.backgroundSize).toBe("100% 1164px");

    (mql as unknown as { matches: boolean }).matches = false;
    await act(async () => {
      for (const listener of listeners) {
        listener({
          matches: false,
          media: "(min-width: 768px)",
        } as MediaQueryListEvent);
      }
    });

    await waitFor(() => {
      expect(wrapper.style.backgroundImage).toContain("bg_mobile");
    });
    expect(wrapper.style.backgroundImage).not.toContain("bg_desktop");
    expect(wrapper.style.backgroundSize).toBe("cover");
    restoreViewport();
  });
});
