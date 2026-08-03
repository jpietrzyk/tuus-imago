import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const mockUseList = vi.fn();
const mockMutateAsync = vi.fn();
const mockRefetch = vi.fn();

vi.mock("@refinedev/core", () => ({
  useList: (...args: unknown[]) => mockUseList(...args),
  useUpdate: () => ({ mutateAsync: mockMutateAsync }),
}));

import { SettingsPage } from "./settings";

const GUARD_ROW = {
  id: "set-1",
  key: "dpi_guard",
  value: "true",
  data_type: "boolean" as const,
  description: "Master switch",
};

const THRESHOLD_ROW = {
  id: "set-2",
  key: "dpi_threshold",
  value: "72",
  data_type: "integer" as const,
  description: "Minimum DPI",
};

function setupMocks(rows: unknown[] = [GUARD_ROW, THRESHOLD_ROW]) {
  mockUseList.mockReturnValue({
    result: { data: rows, total: rows.length },
    query: { isFetching: false, refetch: mockRefetch },
  });
}

function renderSettings() {
  return render(
    <MemoryRouter>
      <SettingsPage />
    </MemoryRouter>,
  );
}

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRefetch.mockResolvedValue({});
  });

  it("renders the DPI guard toggle and threshold input", () => {
    setupMocks();
    renderSettings();

    expect(screen.getByText("Ustawienia")).toBeInTheDocument();
    expect(screen.getByLabelText("Strażnik DPI")).toBeInTheDocument();
    expect(screen.getByLabelText("Próg DPI")).toHaveValue(72);
  });

  it("disables the threshold input when the guard is off", () => {
    setupMocks([{ ...GUARD_ROW, value: "false" }, THRESHOLD_ROW]);
    renderSettings();

    expect(screen.getByLabelText("Próg DPI")).toBeDisabled();
  });

  it("saves the guard and threshold on submit", async () => {
    setupMocks();
    mockMutateAsync.mockResolvedValue({ data: {} });
    renderSettings();

    fireEvent.change(screen.getByLabelText("Próg DPI"), {
      target: { value: "150" },
    });
    fireEvent.click(screen.getByText("Zapisz zmiany"));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledTimes(2);
    });

    expect(mockMutateAsync).toHaveBeenCalledWith({
      resource: "app_settings",
      id: "set-1",
      values: { value: "true" },
    });
    expect(mockMutateAsync).toHaveBeenCalledWith({
      resource: "app_settings",
      id: "set-2",
      values: { value: "150" },
    });
    expect(screen.getByText("Ustawienia zapisane.")).toBeInTheDocument();
  });

  it("refetches and shows an error when an update fails", async () => {
    setupMocks();
    mockMutateAsync.mockRejectedValue(new Error("Update failed"));
    renderSettings();

    fireEvent.click(screen.getByText("Zapisz zmiany"));

    await waitFor(() => {
      expect(screen.getByText("Update failed")).toBeInTheDocument();
    });
    expect(mockRefetch).toHaveBeenCalled();
    expect(screen.queryByText("Ustawienia zapisane.")).not.toBeInTheDocument();
  });
});
