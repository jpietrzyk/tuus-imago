import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AddressesTab } from "./addresses-tab";

const mockGetAddresses = vi.fn();
const mockCreateAddress = vi.fn();
const mockUpdateAddress = vi.fn();
const mockDeleteAddress = vi.fn();

vi.mock("@/lib/orders-api", () => ({
  getCustomerAddresses: (...args: unknown[]) => mockGetAddresses(...args),
  createCustomerAddress: (...args: unknown[]) => mockCreateAddress(...args),
  updateCustomerAddress: (...args: unknown[]) => mockUpdateAddress(...args),
  deleteCustomerAddress: (...args: unknown[]) => mockDeleteAddress(...args),
}));

vi.mock("@/lib/checkout-constants", () => ({
  SHIPPING_COUNTRIES: [{ value: "PL", label: "Poland" }],
}));

vi.mock("@/locales/i18n", () => ({
  t: (key: string) => key,
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    MemoryRouter: actual.MemoryRouter,
    Routes: actual.Routes,
    Route: actual.Route,
  };
});

vi.mock("@/lib/supabase-client", () => ({
  get supabase() {
    return {
      auth: {
        getSession: vi.fn(() =>
          Promise.resolve({ data: { session: null } }),
        ),
        onAuthStateChange: vi.fn(() => ({
          data: { subscription: { unsubscribe: vi.fn() } },
        })),
      },
    };
  },
}));

const MOCK_ADDRESS = {
  id: "addr-1",
  label: "Home",
  name: "Jane Doe",
  phone: "+48123456789",
  address: "1 Main St",
  city: "Warsaw",
  postal_code: "00-001",
  country: "PL",
  is_default: true,
};

const MOCK_ADDRESS_2 = {
  id: "addr-2",
  label: "Office",
  name: "Jane Doe",
  phone: null,
  address: "2 Side St",
  city: "Krakow",
  postal_code: "30-001",
  country: "PL",
  is_default: false,
};

function renderComponent() {
  return render(
    <MemoryRouter initialEntries={["/account"]}>
      <Routes>
        <Route path="/account" element={<AddressesTab />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("AddressesTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAddresses.mockResolvedValue([]);
    mockCreateAddress.mockResolvedValue({});
    mockUpdateAddress.mockResolvedValue({});
    mockDeleteAddress.mockResolvedValue({});
  });

  it("shows loading spinner initially", () => {
    mockGetAddresses.mockReturnValue(new Promise(() => {}));
    renderComponent();
    expect(document.querySelector("svg")).toBeInTheDocument();
  });

  it("shows empty state when no addresses", async () => {
    mockGetAddresses.mockResolvedValue([]);
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("account.noAddresses")).toBeInTheDocument();
    });
  });

  it("renders address list with default badge", async () => {
    mockGetAddresses.mockResolvedValue([MOCK_ADDRESS]);
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("Home")).toBeInTheDocument();
    });
    expect(screen.getByText("account.default")).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("1 Main St")).toBeInTheDocument();
    expect(screen.getByText("00-001 Warsaw")).toBeInTheDocument();
  });

  it("renders address without default badge when not default", async () => {
    mockGetAddresses.mockResolvedValue([MOCK_ADDRESS_2]);
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("Office")).toBeInTheDocument();
    });
    expect(screen.queryByText("account.default")).not.toBeInTheDocument();
  });

  it("click add button shows form", async () => {
    mockGetAddresses.mockResolvedValue([]);
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("account.noAddresses")).toBeInTheDocument();
    });
    await userEvent.click(
      screen.getByRole("button", { name: /account\.addAddress/ }),
    );
    expect(screen.getByText("account.addAddress")).toBeInTheDocument();
    expect(screen.getByLabelText("account.addressLabel")).toBeInTheDocument();
    expect(screen.getByLabelText("auth.fullName")).toBeInTheDocument();
    expect(screen.getByLabelText("account.phone")).toBeInTheDocument();
    expect(screen.getByLabelText("checkout.streetAddress")).toBeInTheDocument();
    expect(screen.getByLabelText("checkout.city")).toBeInTheDocument();
    expect(screen.getByLabelText("checkout.postalCode")).toBeInTheDocument();
    expect(screen.getByLabelText("account.defaultAddress")).toBeInTheDocument();
  });

  it("click edit button populates form", async () => {
    mockGetAddresses.mockResolvedValue([MOCK_ADDRESS]);
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("Home")).toBeInTheDocument();
    });
    const editButtons = screen.getAllByRole("button");
    const editBtn = editButtons.find((btn) =>
      btn.querySelector("svg.lucide-pencil"),
    );
    expect(editBtn).toBeDefined();
    await userEvent.click(editBtn!);
    await waitFor(() => {
      expect(screen.getByText("account.editAddress")).toBeInTheDocument();
    });
    expect(
      (screen.getByLabelText("account.addressLabel") as HTMLInputElement).value,
    ).toBe("Home");
    expect(
      (screen.getByLabelText("auth.fullName") as HTMLInputElement).value,
    ).toBe("Jane Doe");
    expect(
      (screen.getByLabelText("account.phone") as HTMLInputElement).value,
    ).toBe("+48123456789");
    expect(
      (screen.getByLabelText("checkout.streetAddress") as HTMLInputElement)
        .value,
    ).toBe("1 Main St");
    expect(
      (screen.getByLabelText("checkout.city") as HTMLInputElement).value,
    ).toBe("Warsaw");
    expect(
      (screen.getByLabelText("checkout.postalCode") as HTMLInputElement).value,
    ).toBe("00-001");
  });

  it("save (create) calls createCustomerAddress", async () => {
    mockGetAddresses.mockResolvedValue([]);
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("account.noAddresses")).toBeInTheDocument();
    });
    await userEvent.click(
      screen.getByRole("button", { name: /account\.addAddress/ }),
    );
    await userEvent.type(screen.getByLabelText("auth.fullName"), "Jane Doe");
    await userEvent.type(
      screen.getByLabelText("checkout.streetAddress"),
      "1 Main St",
    );
    await userEvent.type(screen.getByLabelText("checkout.city"), "Warsaw");
    await userEvent.type(
      screen.getByLabelText("checkout.postalCode"),
      "00-001",
    );
    await userEvent.click(
      screen.getByRole("button", { name: /account\.save/ }),
    );
    await waitFor(() => {
      expect(mockCreateAddress).toHaveBeenCalledTimes(1);
    });
    const calledArg = mockCreateAddress.mock.calls[0][0];
    expect(calledArg.name).toBe("Jane Doe");
    expect(calledArg.address).toBe("1 Main St");
    expect(calledArg.city).toBe("Warsaw");
    expect(calledArg.postal_code).toBe("00-001");
  });

  it("save (update) calls updateCustomerAddress", async () => {
    mockGetAddresses.mockResolvedValue([MOCK_ADDRESS]);
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("Home")).toBeInTheDocument();
    });
    const editButtons = screen.getAllByRole("button");
    const editBtn = editButtons.find((btn) =>
      btn.querySelector("svg.lucide-pencil"),
    );
    await userEvent.click(editBtn!);
    await waitFor(() => {
      expect(screen.getByText("account.editAddress")).toBeInTheDocument();
    });
    const nameInput = screen.getByLabelText("auth.fullName");
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "John Doe");
    await userEvent.click(
      screen.getByRole("button", { name: /account\.save/ }),
    );
    await waitFor(() => {
      expect(mockUpdateAddress).toHaveBeenCalledTimes(1);
    });
    expect(mockUpdateAddress).toHaveBeenCalledWith(
      "addr-1",
      expect.objectContaining({ name: "John Doe" }),
    );
  });

  it("cancel returns to list", async () => {
    mockGetAddresses.mockResolvedValue([MOCK_ADDRESS]);
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("Home")).toBeInTheDocument();
    });
    const editButtons = screen.getAllByRole("button");
    const editBtn = editButtons.find((btn) =>
      btn.querySelector("svg.lucide-pencil"),
    );
    await userEvent.click(editBtn!);
    await waitFor(() => {
      expect(screen.getByText("account.editAddress")).toBeInTheDocument();
    });
    await userEvent.click(
      screen.getByRole("button", { name: /account\.cancel/ }),
    );
    await waitFor(() => {
      expect(screen.getByText("Home")).toBeInTheDocument();
    });
    expect(screen.queryByText("account.editAddress")).not.toBeInTheDocument();
  });

  it("delete calls deleteCustomerAddress", async () => {
    mockGetAddresses.mockResolvedValue([MOCK_ADDRESS]);
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("Home")).toBeInTheDocument();
    });
    const deleteButtons = screen.getAllByRole("button");
    const deleteBtn = deleteButtons.find((btn) =>
      btn.querySelector("svg.lucide-trash-2"),
    );
    expect(deleteBtn).toBeDefined();
    await userEvent.click(deleteBtn!);
    await waitFor(() => {
      expect(mockDeleteAddress).toHaveBeenCalledWith("addr-1");
    });
  });

  it("shows error when loading addresses fails", async () => {
    mockGetAddresses.mockRejectedValue(new Error("fail"));
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("Could not load addresses.")).toBeInTheDocument();
    });
  });

  it("shows error when save fails", async () => {
    mockGetAddresses.mockResolvedValue([]);
    mockCreateAddress.mockRejectedValue(new Error("fail"));
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("account.noAddresses")).toBeInTheDocument();
    });
    await userEvent.click(
      screen.getByRole("button", { name: /account\.addAddress/ }),
    );
    await userEvent.type(screen.getByLabelText("auth.fullName"), "Jane Doe");
    await userEvent.type(
      screen.getByLabelText("checkout.streetAddress"),
      "1 Main St",
    );
    await userEvent.type(screen.getByLabelText("checkout.city"), "Warsaw");
    await userEvent.type(
      screen.getByLabelText("checkout.postalCode"),
      "00-001",
    );
    await userEvent.click(
      screen.getByRole("button", { name: /account\.save/ }),
    );
    await waitFor(() => {
      expect(screen.getByText("Could not save address.")).toBeInTheDocument();
    });
  });

  it("shows error when delete fails", async () => {
    mockGetAddresses.mockResolvedValue([MOCK_ADDRESS]);
    mockDeleteAddress.mockRejectedValue(new Error("fail"));
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("Home")).toBeInTheDocument();
    });
    const deleteButtons = screen.getAllByRole("button");
    const deleteBtn = deleteButtons.find((btn) =>
      btn.querySelector("svg.lucide-trash-2"),
    );
    await userEvent.click(deleteBtn!);
    await waitFor(() => {
      expect(screen.getByText("Could not delete address.")).toBeInTheDocument();
    });
  });
});
