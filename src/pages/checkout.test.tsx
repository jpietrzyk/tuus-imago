import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  waitFor,
  act,
  fireEvent,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CheckoutPage } from "./checkout";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { tr } from "@/test/i18n-test";
import { type UploadedSlotResult } from "@/components/image-uploader";
import { getCloudinaryThumbnailUrl } from "@/lib/image-transformations";
import { CANVAS_PRINT_UNIT_PRICE, formatPrice } from "@/lib/pricing";
import { SHIPPING_COUNTRIES } from "@/lib/checkout-constants";

let __mockUser: {
  id: string;
  email: string;
  user_metadata?: Record<string, unknown>;
} | null = null;

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    get user() { return __mockUser; },
    session: __mockUser ? { access_token: "token" } : null,
    loading: false,
    signUp: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    signInWithOAuth: vi.fn(),
    signInWithOtp: vi.fn(),
    resetPassword: vi.fn(),
    updatePassword: vi.fn(),
  }),
}));

vi.mock("@/lib/supabase-client", () => ({
  get supabase() {
    return {
      auth: {
        getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
        onAuthStateChange: vi.fn(() => ({
          data: { subscription: { unsubscribe: vi.fn() } },
        })),
      },
    };
  },
}));

function hasExactTextContent(expectedText: string) {
  return (_content: string, element: Element | null) =>
    element?.textContent?.replace(/\s+/g, " ").trim() ===
    expectedText.replace(/\s+/g, " ").trim();
}

const VALID_DRAFT = {
  name: "Jane Doe",
  email: "jane@example.com",
  phone: "",
  address: "1 Main St",
  city: "Warsaw",
  postalCode: "00-001",
  country: "PL",
};

const ORDER_RESPONSE = {
  orderId: "order-1",
  orderNumber: "TI-2026-000001",
  status: "pending_payment",
};

const P24_SESSION_RESPONSE = {
  orderId: "order-1",
  orderNumber: "TI-2026-000001",
  paymentSessionId: "session-1",
  redirectUrl: "https://sandbox.przelewy24.pl/trnRequest/token-abc",
};

function createFetchMock(
  orderResponse = ORDER_RESPONSE,
  p24Response = P24_SESSION_RESPONSE,
) {
  return vi.fn((url: string) => {
    if (url.includes("create-order")) {
      return Promise.resolve(
        new Response(JSON.stringify(orderResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }
    if (url.includes("create-przelewy24-session")) {
      return Promise.resolve(
        new Response(JSON.stringify(p24Response), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }
    if (url.includes("customer-addresses")) {
      return Promise.resolve(
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }
    return Promise.resolve(
      new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }),
    );
  });
}

describe("CheckoutPage", () => {
  let locationHrefSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    __mockUser = null;
    vi.stubGlobal("fetch", createFetchMock());
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderWithRouter = () => {
    return render(
      <MemoryRouter initialEntries={["/checkout"]}>
        <Routes>
          <Route path="/checkout" element={<CheckoutPage />} />
        </Routes>
      </MemoryRouter>,
    );
  };

  const renderWithSlots = (uploadedSlots: UploadedSlotResult[]) => {
    return render(
      <MemoryRouter
        initialEntries={[{ pathname: "/checkout", state: { uploadedSlots } }]}
      >
        <Routes>
          <Route path="/checkout" element={<CheckoutPage />} />
        </Routes>
      </MemoryRouter>,
    );
  };

  const renderWithSearchParams = (search: string) => {
    return render(
      <MemoryRouter initialEntries={[`/checkout${search}`]}>
        <Routes>
          <Route path="/checkout" element={<CheckoutPage />} />
        </Routes>
      </MemoryRouter>,
    );
  };

  const seedDraft = (draft: Partial<typeof VALID_DRAFT>) => {
    sessionStorage.setItem(
      "checkout-form-draft",
      JSON.stringify({ ...VALID_DRAFT, ...draft }),
    );
  };

  const fillRequiredFields = async () => {
    await userEvent.type(
      screen.getByLabelText(tr("checkout.fullName")),
      "John Doe",
    );
    await userEvent.type(
      screen.getByLabelText(tr("checkout.email")),
      "john@example.com",
    );
    await userEvent.type(
      screen.getByLabelText(tr("checkout.streetAddress")),
      "123 Main Street",
    );
    await userEvent.type(screen.getByLabelText(tr("checkout.city")), "Warsaw");
    await userEvent.type(
      screen.getByLabelText(tr("checkout.postalCode")),
      "00-001",
    );
    const termsCheckbox = document.getElementById(
      "termsAccepted",
    ) as HTMLInputElement;
    const privacyCheckbox = document.getElementById(
      "privacyAccepted",
    ) as HTMLInputElement;
    if (termsCheckbox) await userEvent.click(termsCheckbox);
    if (privacyCheckbox) await userEvent.click(privacyCheckbox);
  };

  const stubLocationHref = () => {
    locationHrefSpy = vi.fn();
    const originalDescriptor = Object.getOwnPropertyDescriptor(
      window,
      "location",
    );
    Object.defineProperty(window, "location", {
      value: {
        ...originalDescriptor?.value,
        set href(url: string) {
          (locationHrefSpy as (url: string) => void)(url);
        },
      },
      writable: true,
      configurable: true,
    });
    return locationHrefSpy;
  };

  it("renders checkout page", () => {
    renderWithRouter();
    expect(screen.getByText(tr("checkout.title"))).toBeDefined();
  });

  it("renders back to upload link", () => {
    renderWithRouter();
    const backButton = screen.getByRole("button", {
      name: tr("checkout.backToUpload"),
    });
    expect(backButton).toBeDefined();
  });

  it("renders personal information section", () => {
    renderWithRouter();
    expect(screen.getByText(tr("checkout.personalInformation"))).toBeDefined();
  });

  it("renders full name input field", () => {
    renderWithRouter();
    const nameInput = screen.getByLabelText(tr("checkout.fullName"));
    expect(nameInput).toBeDefined();
    expect(nameInput.getAttribute("type")).toBe("text");
    expect(nameInput.hasAttribute("required")).toBe(true);
  });

  it("renders email input field", () => {
    renderWithRouter();
    const emailInput = screen.getByLabelText(tr("checkout.email"));
    expect(emailInput).toBeDefined();
    expect(emailInput.getAttribute("type")).toBe("email");
    expect(emailInput.hasAttribute("required")).toBe(true);
  });

  it("renders phone input field", () => {
    renderWithRouter();
    const phoneInput = screen.getByLabelText(tr("checkout.phone"));
    expect(phoneInput).toBeDefined();
    expect(phoneInput.getAttribute("type")).toBe("tel");
    expect(phoneInput.hasAttribute("required")).toBe(false);
  });

  it("renders address input field", () => {
    renderWithRouter();
    const addressInput = screen.getByLabelText(tr("checkout.streetAddress"));
    expect(addressInput).toBeDefined();
    expect(addressInput.getAttribute("type")).toBe("text");
    expect(addressInput.hasAttribute("required")).toBe(true);
  });

  it("renders city input field", () => {
    renderWithRouter();
    const cityInput = screen.getByLabelText(tr("checkout.city"));
    expect(cityInput).toBeDefined();
    expect(cityInput.getAttribute("type")).toBe("text");
  });

  it("renders postal code input field", () => {
    renderWithRouter();
    const postalInput = screen.getByLabelText(tr("checkout.postalCode"));
    expect(postalInput).toBeDefined();
    expect(postalInput.getAttribute("type")).toBe("text");
  });

  it("renders country select field", () => {
    renderWithRouter();
    expect(screen.getByText(tr("checkout.country"))).toBeDefined();
    expect(screen.getByRole("combobox")).toBeDefined();
  });

  it("renders country select with EU/EEA options", async () => {
    renderWithRouter();
    expect(screen.getByRole("combobox")).toBeDefined();
    expect(
      SHIPPING_COUNTRIES.some((country) => country.label === "Poland"),
    ).toBe(true);
    expect(
      SHIPPING_COUNTRIES.some((country) => country.label === "Germany"),
    ).toBe(true);
    expect(
      SHIPPING_COUNTRIES.some((country) => country.label === "Norway"),
    ).toBe(true);
  });

  it("renders address information section", () => {
    renderWithRouter();
    expect(screen.getByText(tr("checkout.addressInformation"))).toBeDefined();
  });

  it("renders order summary section", () => {
    renderWithRouter();
    expect(screen.getByText(tr("checkout.orderSummary"))).toBeDefined();
    expect(screen.getByText(tr("checkout.enhancedPhoto"))).toBeDefined();
    expect(screen.getByText(tr("checkout.canvasPrint"))).toBeDefined();
    const totalElements = screen.getAllByText(tr("checkout.total"));
    expect(totalElements).toHaveLength(2);
  });

  it("renders total price", () => {
    renderWithRouter();
    const priceElements = screen.getAllByText(
      hasExactTextContent(formatPrice(CANVAS_PRINT_UNIT_PRICE)),
    );
    expect(priceElements.length).toBe(2);
  });

  it("renders place order button", () => {
    renderWithRouter();
    const submitButton = screen.getByRole("button", {
      name: tr("checkout.placeOrder"),
    });
    expect(submitButton).toBeDefined();
  });

  it("disables submit button when form is invalid", () => {
    renderWithRouter();
    const submitButton = screen.getByRole("button", {
      name: tr("checkout.placeOrder"),
    });
    expect(submitButton.hasAttribute("disabled")).toBe(true);
  });

  it("enables submit button when all required fields are filled", async () => {
    seedDraft({
      name: "",
      email: "",
      address: "",
      city: "",
      postalCode: "",
    });
    renderWithRouter();
    const submitButton = screen.getByRole("button", {
      name: tr("checkout.placeOrder"),
    });
    expect(submitButton.hasAttribute("disabled")).toBe(true);
    await waitFor(() => {
      expect(screen.getByRole("combobox").textContent).toContain("Poland");
    });
    await fillRequiredFields();
    await waitFor(() => {
      expect(submitButton.hasAttribute("disabled")).toBe(false);
    });
  });

  it("shows inline error on blur for empty required name field", async () => {
    sessionStorage.removeItem("checkout-form-draft");
    renderWithRouter();
    const nameInput = screen.getByLabelText(tr("checkout.fullName"));
    expect((nameInput as HTMLInputElement).value).toBe("");
    await userEvent.click(nameInput);
    await userEvent.tab();
    expect(await screen.findByText(tr("checkout.errorName"))).toBeDefined();
  });

  it("shows inline error on blur for empty email field", async () => {
    renderWithRouter();
    const emailInput = screen.getByLabelText(tr("checkout.email"));
    await userEvent.click(emailInput);
    await userEvent.tab();
    expect(await screen.findByText(tr("checkout.errorEmail"))).toBeDefined();
  });

  it("shows inline error on blur for invalid email format", async () => {
    renderWithRouter();
    const emailInput = screen.getByLabelText(tr("checkout.email"));
    await userEvent.type(emailInput, "not-an-email");
    await userEvent.tab();
    expect(await screen.findByText(tr("checkout.errorEmail"))).toBeDefined();
  });

  it("shows all required field errors simultaneously on empty submit", async () => {
    renderWithRouter();
    const form = document.querySelector("form") as HTMLFormElement;
    act(() => {
      fireEvent.submit(form);
    });
    await waitFor(() => {
      expect(screen.getByText(tr("checkout.errorName"))).toBeDefined();
      expect(screen.getByText(tr("checkout.errorEmail"))).toBeDefined();
      expect(screen.getByText(tr("checkout.errorAddress"))).toBeDefined();
      expect(screen.getByText(tr("checkout.errorCity"))).toBeDefined();
      expect(screen.getByText(tr("checkout.errorPostalCode"))).toBeDefined();
      expect(screen.getByText(tr("checkout.errorCountry"))).toBeDefined();
    });
  });

  it("shows required field indicator for name", () => {
    renderWithRouter();
    expect(screen.getByText(tr("checkout.fullName"))).toBeDefined();
  });

  it("shows required field indicator for address", () => {
    renderWithRouter();
    expect(screen.getByText(tr("checkout.streetAddress"))).toBeDefined();
  });

  it("renders help text", () => {
    renderWithRouter();
    expect(screen.getByText(tr("checkout.requiredFields"))).toBeDefined();
  });

  it("renders uploaded slot images in order summary when passed via location state", () => {
    const mockSlots: UploadedSlotResult[] = [
      {
        slotIndex: 0,
        slotKey: "left",
        transformations: {
          brightness: 0,
          contrast: 0,
          rotation: 0,
          flipHorizontal: false,
          flipVertical: false,
          grayscale: 0,
          blur: 0,
        },
        transformedUrl: "https://res.cloudinary.com/test/image/upload/left.jpg",
        publicId: "tuus-imago/left",
        secureUrl: "https://res.cloudinary.com/test/image/upload/left.jpg",
      },
      {
        slotIndex: 2,
        slotKey: "right",
        transformations: {
          brightness: 10,
          contrast: 0,
          rotation: 0,
          flipHorizontal: false,
          flipVertical: false,
          grayscale: 0,
          blur: 0,
        },
        transformedUrl:
          "https://res.cloudinary.com/test/image/upload/right.jpg",
        publicId: "tuus-imago/right",
        secureUrl: "https://res.cloudinary.com/test/image/upload/right.jpg",
      },
    ];

    renderWithSlots(mockSlots);

    expect(screen.getByText(tr("checkout.uploadedImages"))).toBeDefined();
    expect(screen.getByText(tr("upload.slotLeft"))).toBeDefined();
    expect(screen.getByText(tr("upload.slotRight"))).toBeDefined();

    const images = screen.getAllByRole("img");
    expect(images.length).toBeGreaterThanOrEqual(2);
    expect(images[0]).toHaveAttribute(
      "src",
      getCloudinaryThumbnailUrl(
        "https://res.cloudinary.com/test/image/upload/left.jpg",
        48,
        48,
      ),
    );
    expect(images[1]).toHaveAttribute(
      "src",
      getCloudinaryThumbnailUrl(
        "https://res.cloudinary.com/test/image/upload/right.jpg",
        48,
        48,
      ),
    );

    const imageLinks = screen.getAllByRole("link", {
      name: tr("upload.openUploadedImage"),
    });
    expect(imageLinks[0]).toHaveAttribute(
      "href",
      "https://res.cloudinary.com/test/image/upload/left.jpg",
    );
    expect(imageLinks[1]).toHaveAttribute(
      "href",
      "https://res.cloudinary.com/test/image/upload/right.jpg",
    );
  });

  it("renders static order summary when no slots passed via location state", () => {
    renderWithRouter();
    expect(screen.getByText(tr("checkout.enhancedPhoto"))).toBeDefined();
    expect(screen.getByText(tr("checkout.canvasPrint"))).toBeDefined();
  });

  it("renders total based on uploaded slot count", () => {
    const mockSlots: UploadedSlotResult[] = [
      {
        slotIndex: 0,
        slotKey: "left",
        transformations: {
          brightness: 0,
          contrast: 0,
          rotation: 0,
          flipHorizontal: false,
          flipVertical: false,
          grayscale: 0,
          blur: 0,
        },
        transformedUrl: "https://res.cloudinary.com/test/image/upload/left.jpg",
        publicId: "tuus-imago/left",
        secureUrl: "https://res.cloudinary.com/test/image/upload/left.jpg",
      },
      {
        slotIndex: 2,
        slotKey: "right",
        transformations: {
          brightness: 10,
          contrast: 0,
          rotation: 0,
          flipHorizontal: false,
          flipVertical: false,
          grayscale: 0,
          blur: 0,
        },
        transformedUrl:
          "https://res.cloudinary.com/test/image/upload/right.jpg",
        publicId: "tuus-imago/right",
        secureUrl: "https://res.cloudinary.com/test/image/upload/right.jpg",
      },
    ];

    renderWithSlots(mockSlots);

    const priceElements = screen.getAllByText(
      hasExactTextContent(
        formatPrice(CANVAS_PRINT_UNIT_PRICE * mockSlots.length),
      ),
    );
    expect(priceElements.length).toBe(2);
  });

  it("persists form data to sessionStorage on input change", async () => {
    renderWithRouter();
    await userEvent.type(
      screen.getByLabelText(tr("checkout.fullName")),
      "Jane",
    );
    const saved = sessionStorage.getItem("checkout-form-draft");
    expect(saved).not.toBeNull();
    const parsed = JSON.parse(saved!) as { name: string };
    expect(parsed.name).toBe("Jane");
  });

  it("restores form data from sessionStorage on mount", async () => {
    sessionStorage.setItem(
      "checkout-form-draft",
      JSON.stringify({
        name: "Restored",
        email: "",
        phone: "",
        address: "",
        city: "",
        postalCode: "",
        country: "",
      }),
    );
    renderWithRouter();
    await waitFor(() => {
      expect(
        (screen.getByLabelText(tr("checkout.fullName")) as HTMLInputElement)
          .value,
      ).toBe("Restored");
    });
  });

  it("disables inputs during submission", async () => {
    seedDraft({});
    renderWithRouter();
    await waitFor(() => {
      expect(
        (screen.getByLabelText(tr("checkout.fullName")) as HTMLInputElement)
          .value,
      ).toBe("Jane Doe");
    });

    const nameInput = screen.getByLabelText(tr("checkout.fullName"));
    const emailInput = screen.getByLabelText(tr("checkout.email"));
    const form = document.querySelector("form") as HTMLFormElement;

    act(() => {
      fireEvent.submit(form);
    });

    expect(nameInput.getAttribute("disabled")).toBe("");
    expect(emailInput.getAttribute("disabled")).toBe("");
  });

  it("shows redirecting screen with order number after valid submission", async () => {
    const hrefSpy = stubLocationHref();
    seedDraft({});
    renderWithRouter();
    await waitFor(() => {
      expect(
        (screen.getByLabelText(tr("checkout.fullName")) as HTMLInputElement)
          .value,
      ).toBe("Jane Doe");
    });
    const termsCheckbox = document.getElementById(
      "termsAccepted",
    ) as HTMLInputElement;
    const privacyCheckbox = document.getElementById(
      "privacyAccepted",
    ) as HTMLInputElement;
    if (termsCheckbox) await userEvent.click(termsCheckbox);
    if (privacyCheckbox) await userEvent.click(privacyCheckbox);
    await userEvent.click(
      screen.getByRole("button", { name: tr("checkout.placeOrder") }),
    );
    await waitFor(
      () => {
        expect(
          screen.getByText(tr("checkout.redirectingToPayment")),
        ).toBeDefined();
        expect(screen.getByText("TI-2026-000001")).toBeDefined();
      },
      { timeout: 3000 },
    );
    await waitFor(() => {
      expect(hrefSpy).toHaveBeenCalledWith(
        "https://sandbox.przelewy24.pl/trnRequest/token-abc",
      );
    });
  });

  it("clears sessionStorage draft after successful P24 session creation", async () => {
    stubLocationHref();
    seedDraft({});
    renderWithRouter();
    await waitFor(
      () => {
        expect(
          (screen.getByLabelText(tr("checkout.fullName")) as HTMLInputElement)
            .value,
        ).toBe("Jane Doe");
      },
      { timeout: 3000 },
    );
    act(() => {
      fireEvent.submit(document.querySelector("form") as HTMLFormElement);
    });
    await waitFor(
      () => {
        expect(
          screen.getByText(tr("checkout.redirectingToPayment")),
        ).toBeDefined();
      },
      { timeout: 5000 },
    );
    expect(sessionStorage.getItem("checkout-form-draft")).toBeNull();
  });

  it("keeps sessionStorage draft and shows an error when order API fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: "Could not create order." }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    seedDraft({});
    renderWithRouter();

    await waitFor(() => {
      expect(
        (screen.getByLabelText(tr("checkout.fullName")) as HTMLInputElement)
          .value,
      ).toBe("Jane Doe");
    });

    const termsCheckbox = document.getElementById(
      "termsAccepted",
    ) as HTMLInputElement;
    const privacyCheckbox = document.getElementById(
      "privacyAccepted",
    ) as HTMLInputElement;
    if (termsCheckbox) await userEvent.click(termsCheckbox);
    if (privacyCheckbox) await userEvent.click(privacyCheckbox);

    await userEvent.click(
      screen.getByRole("button", { name: tr("checkout.placeOrder") }),
    );

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Could not create order.",
      );
    });

    const saved = sessionStorage.getItem("checkout-form-draft");
    expect(saved).not.toBeNull();
    expect(
      screen.queryByText(tr("checkout.redirectingToPayment")),
    ).toBeNull();
  });

  it("shows retry screen when P24 session creation fails after order is created", async () => {
    vi.stubGlobal(
      "fetch",
      createFetchMock(ORDER_RESPONSE, undefined).mockImplementation(
        (url: string) => {
          if (url.includes("create-order")) {
            return Promise.resolve(
              new Response(JSON.stringify(ORDER_RESPONSE), {
                status: 200,
                headers: { "Content-Type": "application/json" },
              }),
            );
          }
          if (url.includes("create-przelewy24-session")) {
            return Promise.resolve(
              new Response(
                JSON.stringify({
                  error: "Could not register Przelewy24 transaction.",
                }),
                {
                  status: 502,
                  headers: { "Content-Type": "application/json" },
                },
              ),
            );
          }
          return Promise.resolve(new Response(null, { status: 404 }));
        },
      ),
    );

    seedDraft({});
    renderWithRouter();

    await waitFor(() => {
      expect(
        (screen.getByLabelText(tr("checkout.fullName")) as HTMLInputElement)
          .value,
      ).toBe("Jane Doe");
    });

    const termsCheckbox = document.getElementById(
      "termsAccepted",
    ) as HTMLInputElement;
    const privacyCheckbox = document.getElementById(
      "privacyAccepted",
    ) as HTMLInputElement;
    if (termsCheckbox) await userEvent.click(termsCheckbox);
    if (privacyCheckbox) await userEvent.click(privacyCheckbox);

    await userEvent.click(
      screen.getByRole("button", { name: tr("checkout.placeOrder") }),
    );

    await waitFor(
      () => {
        expect(
          screen.getByText(tr("checkout.paymentRetryTitle")),
        ).toBeDefined();
        expect(screen.getByText("TI-2026-000001")).toBeDefined();
        expect(
          screen.getByRole("button", {
            name: tr("checkout.paymentRetryButton"),
          }),
        ).toBeDefined();
      },
      { timeout: 5000 },
    );
  });

  it("shows payment pending screen when returning from P24 with payment=return", () => {
    renderWithSearchParams(
      "?payment=return&orderId=550e8400-e29b-41d4-a716-446655440000",
    );

    expect(
      screen.getByText(tr("checkout.paymentPendingTitle")),
    ).toBeDefined();
    expect(
      screen.getByText(tr("checkout.paymentPendingMessage")),
    ).toBeDefined();
    expect(
      screen.getByText("550e8400-e29b-41d4-a716-446655440000"),
    ).toBeDefined();
    expect(
      screen.getByRole("button", { name: tr("checkout.backToHomeButton") }),
    ).toBeDefined();
  });

  it("does not show order form when on payment return page", () => {
    renderWithSearchParams("?payment=return&orderId=order-123");

    expect(screen.queryByLabelText(tr("checkout.fullName"))).toBeNull();
    expect(
      screen.queryByRole("button", { name: tr("checkout.placeOrder") }),
    ).toBeNull();
  });

  it("stores pending order ID in sessionStorage when P24 session fails", async () => {
    vi.stubGlobal(
      "fetch",
      createFetchMock(ORDER_RESPONSE, undefined).mockImplementation(
        (url: string) => {
          if (url.includes("create-order")) {
            return Promise.resolve(
              new Response(JSON.stringify(ORDER_RESPONSE), {
                status: 200,
                headers: { "Content-Type": "application/json" },
              }),
            );
          }
          if (url.includes("create-przelewy24-session")) {
            return Promise.resolve(
              new Response(
                JSON.stringify({
                  error: "Could not register Przelewy24 transaction.",
                }),
                {
                  status: 502,
                  headers: { "Content-Type": "application/json" },
                },
              ),
            );
          }
          return Promise.resolve(new Response(null, { status: 404 }));
        },
      ),
    );

    seedDraft({});
    renderWithRouter();

    await waitFor(() => {
      expect(
        (screen.getByLabelText(tr("checkout.fullName")) as HTMLInputElement)
          .value,
      ).toBe("Jane Doe");
    });

    const termsCheckbox = document.getElementById(
      "termsAccepted",
    ) as HTMLInputElement;
    const privacyCheckbox = document.getElementById(
      "privacyAccepted",
    ) as HTMLInputElement;
    if (termsCheckbox) await userEvent.click(termsCheckbox);
    if (privacyCheckbox) await userEvent.click(privacyCheckbox);

    await userEvent.click(
      screen.getByRole("button", { name: tr("checkout.placeOrder") }),
    );

    await waitFor(
      () => {
        expect(
          screen.getByText(tr("checkout.paymentRetryTitle")),
        ).toBeDefined();
      },
      { timeout: 5000 },
    );

    expect(sessionStorage.getItem("checkout-pending-order-id")).toBe("order-1");
  });

  it("clears pending order ID from sessionStorage after successful P24 redirect", async () => {
    stubLocationHref();
    seedDraft({});
    renderWithRouter();
    await waitFor(() => {
      expect(
        (screen.getByLabelText(tr("checkout.fullName")) as HTMLInputElement)
          .value,
      ).toBe("Jane Doe");
    });
    const termsCheckbox = document.getElementById(
      "termsAccepted",
    ) as HTMLInputElement;
    const privacyCheckbox = document.getElementById(
      "privacyAccepted",
    ) as HTMLInputElement;
    if (termsCheckbox) await userEvent.click(termsCheckbox);
    if (privacyCheckbox) await userEvent.click(privacyCheckbox);
    await userEvent.click(
      screen.getByRole("button", { name: tr("checkout.placeOrder") }),
    );
    await waitFor(() => {
      expect(locationHrefSpy).toHaveBeenCalled();
    }, { timeout: 3000 });
    expect(sessionStorage.getItem("checkout-pending-order-id")).toBeNull();
  });

  describe("auth prompt", () => {
    it("shows login prompt banner when user is not logged in", () => {
      __mockUser = null;
      renderWithRouter();
      expect(screen.getByText(tr("checkout.loginPrompt"))).toBeDefined();
    });

    it("shows OAuth buttons when user is not logged in", () => {
      __mockUser = null;
      renderWithRouter();
      expect(screen.getByRole("button", { name: /google/i })).toBeDefined();
      expect(screen.getByRole("button", { name: /facebook/i })).toBeDefined();
      expect(screen.getByRole("button", { name: tr("checkout.loginWithEmail") })).toBeDefined();
    });

    it("does not show login prompt when user is logged in", () => {
      __mockUser = { id: "user-1", email: "john@example.com" };
      renderWithRouter();
      expect(screen.queryByText(tr("checkout.loginPrompt"))).toBeNull();
    });

    it("shows signed-in message when user is logged in", () => {
      __mockUser = { id: "user-1", email: "john@example.com" };
      renderWithRouter();
      expect(screen.getByText(tr("checkout.loggedInAs", { email: "john@example.com" }))).toBeDefined();
    });
  });

  describe("auto-fill for authenticated users", () => {
    it("fills email from auth user profile", async () => {
      __mockUser = { id: "user-1", email: "john@example.com" };
      sessionStorage.removeItem("checkout-form-draft");
      renderWithRouter();
      await waitFor(() => {
        expect(
          (screen.getByLabelText(tr("checkout.email")) as HTMLInputElement).value,
        ).toBe("john@example.com");
      });
    });
  });

  describe("slot persistence for OAuth flow", () => {
    it("persists uploaded slots to sessionStorage", () => {
      const mockSlots: UploadedSlotResult[] = [
        {
          slotIndex: 0,
          slotKey: "left",
          transformations: {
            brightness: 0,
            contrast: 0,
            rotation: 0,
            flipHorizontal: false,
            flipVertical: false,
            grayscale: 0,
            blur: 0,
          },
          transformedUrl: "https://res.cloudinary.com/test/image/upload/left.jpg",
          publicId: "tuus-imago/left",
          secureUrl: "https://res.cloudinary.com/test/image/upload/left.jpg",
        },
      ];
      renderWithSlots(mockSlots);
      const saved = sessionStorage.getItem("checkout-uploaded-slots");
      expect(saved).not.toBeNull();
      const parsed = JSON.parse(saved!);
      expect(parsed).toHaveLength(1);
    });

    it("restores slots from sessionStorage when location state is missing", () => {
      const slotData = [
        {
          slotIndex: 0,
          slotKey: "left",
          transformations: { brightness: 0, contrast: 0, rotation: 0, flipHorizontal: false, flipVertical: false, grayscale: 0, blur: 0 },
          transformedUrl: "https://res.cloudinary.com/test/image/upload/left.jpg",
          publicId: "tuus-imago/left",
          secureUrl: "https://res.cloudinary.com/test/image/upload/left.jpg",
        },
      ];
      sessionStorage.setItem("checkout-uploaded-slots", JSON.stringify(slotData));
      renderWithRouter();
      expect(screen.getByText(tr("upload.slotLeft"))).toBeDefined();
    });
  });
});
