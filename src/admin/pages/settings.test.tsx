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

const EXCELLENT_ROW = {
  id: "set-3",
  key: "dpi_threshold_excellent",
  value: "300",
  data_type: "integer" as const,
  description: "Excellent marker",
};

const GOOD_ROW = {
  id: "set-4",
  key: "dpi_threshold_good",
  value: "150",
  data_type: "integer" as const,
  description: "Good marker",
};

const ACCEPTABLE_ROW = {
  id: "set-5",
  key: "dpi_threshold_acceptable",
  value: "72",
  data_type: "integer" as const,
  description: "Acceptable marker",
};

const ALL_ROWS = [
  GUARD_ROW,
  THRESHOLD_ROW,
  EXCELLENT_ROW,
  GOOD_ROW,
  ACCEPTABLE_ROW,
];

function setupMocks(rows: unknown[] = ALL_ROWS) {
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
    setupMocks([{ ...GUARD_ROW, value: "false" }, ...ALL_ROWS.slice(1)]);
    renderSettings();

    expect(screen.getByLabelText("Próg DPI")).toBeDisabled();
  });

  it("renders the quality marker fields with default values", () => {
    setupMocks();
    renderSettings();

    expect(screen.getByLabelText("Doskonała (zielony)")).toHaveValue(300);
    expect(screen.getByLabelText("Dobra (żółty)")).toHaveValue(150);
    expect(screen.getByLabelText("Akceptowalna (szary)")).toHaveValue(72);
  });

  it("saves guard, threshold and quality markers on submit", async () => {
    setupMocks();
    mockMutateAsync.mockResolvedValue({ data: {} });
    renderSettings();

    fireEvent.change(screen.getByLabelText("Próg DPI"), {
      target: { value: "100" },
    });
    fireEvent.change(screen.getByLabelText("Doskonała (zielony)"), {
      target: { value: "250" },
    });
    fireEvent.click(screen.getByText("Zapisz zmiany"));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledTimes(5);
    });

    expect(mockMutateAsync).toHaveBeenCalledWith({
      resource: "app_settings",
      id: "set-1",
      values: { value: "true" },
    });
    expect(mockMutateAsync).toHaveBeenCalledWith({
      resource: "app_settings",
      id: "set-2",
      values: { value: "100" },
    });
    expect(mockMutateAsync).toHaveBeenCalledWith({
      resource: "app_settings",
      id: "set-3",
      values: { value: "250" },
    });
    expect(screen.getByText("Ustawienia zapisane.")).toBeInTheDocument();
  });

  it("rejects out-of-order quality thresholds", async () => {
    setupMocks();
    renderSettings();

    fireEvent.change(screen.getByLabelText("Dobra (żółty)"), {
      target: { value: "350" },
    });
    fireEvent.click(screen.getByText("Zapisz zmiany"));

    await waitFor(() => {
      expect(
        screen.getByText(
          "Progi jakości muszą być uporządkowane: Doskonała > Dobra > Akceptowalna.",
        ),
      ).toBeInTheDocument();
    });
    expect(mockMutateAsync).not.toHaveBeenCalled();
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
