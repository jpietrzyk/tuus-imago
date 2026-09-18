import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/lib/app-version", () => ({
  APP_VERSION: "test-version",
  fetchDeployedVersion: vi.fn().mockResolvedValue({
    version: "deployed-version",
    builtAt: "2026-01-01T00:00:00.000Z",
  }),
}));

import { DiagnosticsOverlay } from "@/components/diagnostics-overlay";
import { clearDiagnostics, recordDiagnostic } from "@/lib/diagnostics-log";

function setSearch(search: string) {
  window.history.replaceState({}, "", `/${search}`);
}

describe("DiagnosticsOverlay", () => {
  beforeEach(() => {
    clearDiagnostics();
  });

  afterEach(async () => {
    cleanup();
    clearDiagnostics();
    setSearch("");
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  it("stays hidden without the ?diag flag", () => {
    setSearch("");
    render(<DiagnosticsOverlay />);

    expect(screen.queryByTestId("diagnostics-overlay")).toBeNull();
  });

  it("renders the journal with running and deployed versions when enabled", async () => {
    setSearch("?diag");
    recordDiagnostic("boot", {
      kind: "boot",
      data: { navType: "reload", route: "/prepare-painting" },
    });
    recordDiagnostic("controllerchange-reload", {
      kind: "reload",
      detail: "a new service worker took control",
    });

    render(<DiagnosticsOverlay />);

    expect(screen.getByTestId("diagnostics-overlay")).toBeInTheDocument();
    expect(screen.getAllByTestId("diagnostics-entry")).toHaveLength(2);
    expect(
      screen.getByText(/running: test-version/),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/deployed: deployed-version/),
    ).toBeInTheDocument();
    expect(screen.getByTestId("diagnostics-last-reload")).toHaveTextContent(
      "controllerchange-reload",
    );
    expect(screen.getByText(/navType=reload/)).toBeInTheDocument();
  });

  it("clears the journal from the overlay", async () => {
    setSearch("?debug");
    recordDiagnostic("boot");
    const user = userEvent.setup();

    render(<DiagnosticsOverlay />);
    expect(screen.getAllByTestId("diagnostics-entry")).toHaveLength(1);

    await user.click(screen.getByTestId("diagnostics-clear"));

    expect(screen.queryAllByTestId("diagnostics-entry")).toHaveLength(0);
    expect(screen.getByText("journal is empty")).toBeInTheDocument();
  });
});
