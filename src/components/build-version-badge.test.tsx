import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BuildVersionBadge } from "@/components/build-version-badge";
import { APP_VERSION } from "@/lib/app-version";

describe("BuildVersionBadge", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/?build");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    window.history.replaceState({}, "", "/");
  });

  it("shows the running and deployed versions when the build flag is set", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          version: "9.9.9+deploy",
          builtAt: "2026-01-01T00:00:00.000Z",
        }),
      }),
    );

    render(<BuildVersionBadge />);

    expect(screen.getByText(`running: ${APP_VERSION}`)).toBeInTheDocument();
    expect(
      await screen.findByText("deployed: 9.9.9+deploy"),
    ).toBeInTheDocument();
    expect(screen.getByText("Refresh to update")).toBeInTheDocument();
  });

  it("renders nothing without the build flag", () => {
    window.history.replaceState({}, "", "/");

    const { container } = render(<BuildVersionBadge />);

    expect(container).toBeEmptyDOMElement();
  });
});
