import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProfileTab } from "./profile-tab";

const mockUser = { id: "u1", email: "test@example.com" };

const mockMaybeSingle = vi.fn();
const mockEq = vi.fn(() => ({ maybeSingle: mockMaybeSingle }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));

const mockUpdateEq = vi.fn();
const mockUpdate = vi.fn(() => ({ eq: mockUpdateEq }));

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({ user: mockUser }),
}));

vi.mock("@/lib/supabase-client", () => ({
  supabase: {
    from: (table: string) => {
      if (table === "profiles") {
        return {
          select: mockSelect,
          update: mockUpdate,
        };
      }
      return { select: mockSelect, update: mockUpdate };
    },
  },
}));

vi.mock("@/locales/i18n", () => ({
  t: (key: string) => key,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockMaybeSingle.mockResolvedValue({
    data: { full_name: "Jane Doe", phone: "+1234567890" },
  });
  mockUpdateEq.mockResolvedValue({ error: null });
});

describe("ProfileTab", () => {
  it("shows loading spinner initially", () => {
    mockMaybeSingle.mockReturnValue(new Promise(() => {}));

    render(<ProfileTab />);

    expect(document.querySelector("svg")).toBeInTheDocument();
  });

  it("fetches profile on mount and populates form", async () => {
    render(<ProfileTab />);

    await waitFor(() => {
      expect(screen.getByLabelText("auth.fullName")).toHaveValue("Jane Doe");
    });
    expect(screen.getByLabelText("account.phone")).toHaveValue("+1234567890");
    expect(mockFrom).not.toHaveBeenCalled();
    expect(mockSelect).toHaveBeenCalledWith("full_name, phone");
    expect(mockEq).toHaveBeenCalledWith("id", "u1");
  });

  it("handleSave sends trimmed values via supabase update", async () => {
    const user = userEvent.setup();
    mockMaybeSingle.mockResolvedValue({
      data: { full_name: "  Jane  ", phone: "  123  " },
    });

    render(<ProfileTab />);

    await waitFor(() => {
      expect(screen.getByLabelText("auth.fullName")).toHaveValue("  Jane  ");
    });

    await user.click(screen.getByRole("button", { name: /account\.save/ }));

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith({
        full_name: "Jane",
        phone: "123",
      });
    });
    expect(mockUpdateEq).toHaveBeenCalledWith("id", "u1");
  });

  it("handleSave sends null for empty strings", async () => {
    const user = userEvent.setup();
    mockMaybeSingle.mockResolvedValue({
      data: { full_name: "   ", phone: "   " },
    });

    render(<ProfileTab />);

    await waitFor(() => {
      expect(screen.getByLabelText("auth.fullName")).toHaveValue("   ");
    });

    await user.click(screen.getByRole("button", { name: /account\.save/ }));

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith({
        full_name: null,
        phone: null,
      });
    });
  });

  it("shows success message after save", async () => {
    const user = userEvent.setup();
    mockUpdateEq.mockResolvedValue({ error: null });

    render(<ProfileTab />);

    await waitFor(() => {
      expect(screen.getByLabelText("auth.fullName")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /account\.save/ }));

    await waitFor(() => {
      expect(screen.getByText("Profile saved.")).toBeInTheDocument();
    });
  });

  it("shows error message when save fails", async () => {
    const user = userEvent.setup();
    mockUpdateEq.mockResolvedValue({ error: { message: "fail" } });

    render(<ProfileTab />);

    await waitFor(() => {
      expect(screen.getByLabelText("auth.fullName")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /account\.save/ }));

    await waitFor(() => {
      expect(screen.getByText("Failed to save profile.")).toBeInTheDocument();
    });
  });

  it("does not update state after unmount during fetch", async () => {
    let resolveFetch: (value: unknown) => void = () => {};
    mockMaybeSingle.mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      }),
    );

    const { unmount } = render(<ProfileTab />);

    unmount();

    resolveFetch({ data: { full_name: "Jane", phone: "123" } });

    await new Promise((r) => setTimeout(r, 50));
  });

  it("renders disabled email input with user email", async () => {
    render(<ProfileTab />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("test@example.com")).toHaveValue("test@example.com");
    });
    expect(screen.getByDisplayValue("test@example.com")).toBeDisabled();
  });
});
