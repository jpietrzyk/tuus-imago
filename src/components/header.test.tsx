import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, expect, describe, it, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";

vi.mock("@/components/legal-navigation-sheet", () => ({}));

vi.mock("@/locales/i18n", () => ({
  t: (key: string) => key,
}));

const mockSignOut = vi.fn();
const mockNavigate = vi.fn();

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    user: mockAuthState.user,
    loading: mockAuthState.loading,
    signOut: mockSignOut,
  }),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocationState,
  };
});

let mockAuthState: { user: { email: string } | null; loading: boolean };
let mockLocationState: { pathname: string };

function renderHeader(onOpenLegalMenu?: () => void) {
  const legalMenuFn = onOpenLegalMenu ?? vi.fn();
  const result = render(
    <MemoryRouter>
      <HeaderStub onOpenLegalMenu={legalMenuFn} />
    </MemoryRouter>,
  );
  return { ...result, legalMenuFn };
}

import { Header } from "@/components/header";

describe("Header", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState = { user: null, loading: false };
    mockLocationState = { pathname: "/current" };
  });

  it("renders nothing user-related while loading", () => {
    mockAuthState = { user: null, loading: true };
    renderHeader();
    expect(screen.queryByText("auth.signIn")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("auth.accountMenu")).not.toBeInTheDocument();
  });

  it("shows sign-in button when unauthenticated", () => {
    mockAuthState = { user: null, loading: false };
    renderHeader();
    expect(screen.getByText("auth.signIn")).toBeInTheDocument();
  });

  it("sign-in button navigates to /auth with current location in state", async () => {
    mockAuthState = { user: null, loading: false };
    mockLocationState = { pathname: "/somewhere" };
    renderHeader();
    await userEvent.click(screen.getByText("auth.signIn"));
    expect(mockNavigate).toHaveBeenCalledWith("/auth", {
      state: { from: { pathname: "/somewhere" } },
    });
  });

  it("shows user initial from email when authenticated", () => {
    mockAuthState = { user: { email: "alice@example.com" }, loading: false };
    renderHeader();
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("shows '?' when user email is null", () => {
    mockAuthState = { user: { email: null as unknown as string }, loading: false };
    renderHeader();
    expect(screen.getByText("?")).toBeInTheDocument();
  });

  it("handleSignOut calls signOut and navigates to /", async () => {
    mockAuthState = { user: { email: "a@b.com" }, loading: false };
    mockSignOut.mockResolvedValue(undefined);
    renderHeader();
    await userEvent.click(screen.getByLabelText("auth.accountMenu"));
    const signOutItem = screen.getByText("auth.signOut");
    await userEvent.click(signOutItem);
    expect(mockSignOut).toHaveBeenCalledTimes(1);
    await vi.waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  it("legal menu button calls onOpenLegalMenu with 'legal'", async () => {
    const legalMenuFn = vi.fn();
    renderHeader(legalMenuFn);
    await userEvent.click(screen.getByLabelText("common.legalMenu"));
    expect(legalMenuFn).toHaveBeenCalledWith("legal");
  });

  it("dropdown profile item navigates to /account", async () => {
    mockAuthState = { user: { email: "a@b.com" }, loading: false };
    renderHeader();
    await userEvent.click(screen.getByLabelText("auth.accountMenu"));
    await userEvent.click(screen.getByText("auth.profile"));
    expect(mockNavigate).toHaveBeenCalledWith("/account");
  });

  it("dropdown orders item navigates to /account/orders", async () => {
    mockAuthState = { user: { email: "a@b.com" }, loading: false };
    renderHeader();
    await userEvent.click(screen.getByLabelText("auth.accountMenu"));
    await userEvent.click(screen.getByText("auth.orders"));
    expect(mockNavigate).toHaveBeenCalledWith("/account/orders");
  });

  it("dropdown addresses item navigates to /account/addresses", async () => {
    mockAuthState = { user: { email: "a@b.com" }, loading: false };
    renderHeader();
    await userEvent.click(screen.getByLabelText("auth.accountMenu"));
    await userEvent.click(screen.getByText("auth.addresses"));
    expect(mockNavigate).toHaveBeenCalledWith("/account/addresses");
  });

  it("displays user email in dropdown label", async () => {
    mockAuthState = { user: { email: "user@test.com" }, loading: false };
    renderHeader();
    await userEvent.click(screen.getByLabelText("auth.accountMenu"));
    expect(screen.getByText("user@test.com")).toBeInTheDocument();
  });
});

function HeaderStub({ onOpenLegalMenu }: { onOpenLegalMenu: (section: "legal") => void }) {
  return <Header onOpenLegalMenu={onOpenLegalMenu} />;
}
