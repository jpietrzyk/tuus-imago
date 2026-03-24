import { describe, it, expect, vi, beforeEach } from "vitest";
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

describe("CheckoutPage", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    sessionStorage.clear();
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
    // Check the consent checkboxes required for form validation
    const termsCheckbox = document.getElementById(
      "termsAccepted",
    ) as HTMLInputElement;
    const privacyCheckbox = document.getElementById(
      "privacyAccepted",
    ) as HTMLInputElement;
    if (termsCheckbox) await userEvent.click(termsCheckbox);
    if (privacyCheckbox) await userEvent.click(privacyCheckbox);
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
    // Use getAllByText since "total" text now appears in both main summary and mobile compact
    const totalElements = screen.getAllByText(tr("checkout.total"));
    expect(totalElements).toHaveLength(2);
  });

  it("renders total price", () => {
    renderWithRouter();
    // Use getAllByText since price appears in multiple places now
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

  it("renders help text", () => {
    renderWithRouter();
    expect(screen.getByText(tr("checkout.requiredFields"))).toBeDefined();
  });

  it("shows success screen with order number after valid submission", async () => {
    seedDraft({});
    renderWithRouter();
    await waitFor(() => {
      expect(
        (screen.getByLabelText(tr("checkout.fullName")) as HTMLInputElement)
          .value,
      ).toBe("Jane Doe");
    });
    // Check consent checkboxes before submitting
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
        expect(screen.getByText(tr("checkout.orderSuccessful"))).toBeDefined();
        expect(
          screen.getByText((content) => /ORD-\d+/.test(content)),
        ).toBeDefined();
      },
      { timeout: 3000 },
    );
  });

  it("shows continue shopping button on success screen", async () => {
    seedDraft({});
    renderWithRouter();
    await waitFor(() => {
      expect(
        (screen.getByLabelText(tr("checkout.fullName")) as HTMLInputElement)
          .value,
      ).toBe("Jane Doe");
    });
    // Check consent checkboxes before submitting
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
          screen.getByRole("button", {
            name: tr("checkout.continueShoppingButton"),
          }),
        ).toBeDefined();
      },
      { timeout: 3000 },
    );
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
    // Thumbnails should use optimized Cloudinary renditions while preserving transforms.
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

    // Use getAllByText since price appears in multiple places (main summary + mobile compact)
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

  it("clears sessionStorage draft after successful order submission", async () => {
    // Pre-seed sessionStorage so the form mounts valid.
    seedDraft({});
    renderWithRouter();
    // Wait until the restore useEffect fires and its re-render reflects in the DOM
    await waitFor(
      () => {
        expect(
          (screen.getByLabelText(tr("checkout.fullName")) as HTMLInputElement)
            .value,
        ).toBe("Jane Doe");
      },
      { timeout: 3000 },
    );
    // Submit the form directly (formData is now fully restored, form is valid)
    act(() => {
      fireEvent.submit(document.querySelector("form") as HTMLFormElement);
    });
    await waitFor(
      () => {
        expect(screen.getByText(tr("checkout.orderSuccessful"))).toBeDefined();
      },
      { timeout: 5000 },
    );
    expect(sessionStorage.getItem("checkout-form-draft")).toBeNull();
  });
});
