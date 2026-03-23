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
import { CANVAS_PRINT_UNIT_PRICE, formatPrice } from "@/lib/pricing";

function hasExactTextContent(expectedText: string) {
  return (_content: string, element: Element | null) =>
    element?.textContent?.replace(/\s+/g, " ").trim() ===
    expectedText.replace(/\s+/g, " ").trim();
}

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
    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.click(
      await screen.findByRole("option", { name: "Poland" }),
    );
  };

  it("renders checkout page", () => {
    renderWithRouter();
    expect(screen.getByText(tr("checkout.title"))).toBeDefined();
  });

  it("renders back to upload link", () => {
    renderWithRouter();
    const backLink = screen.getByRole("link", {
      name: tr("checkout.backToUpload"),
    });
    expect(backLink).toBeDefined();
    expect(backLink).toHaveAttribute("href", "/upload");
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
    await userEvent.click(screen.getByRole("combobox"));
    expect(await screen.findByRole("option", { name: "Poland" })).toBeDefined();
    expect(
      await screen.findByRole("option", { name: "Germany" }),
    ).toBeDefined();
    expect(await screen.findByRole("option", { name: "Norway" })).toBeDefined();
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
    expect(screen.getByText(tr("checkout.total"))).toBeDefined();
  });

  it("renders total price", () => {
    renderWithRouter();
    expect(
      screen.getByText(
        hasExactTextContent(formatPrice(CANVAS_PRINT_UNIT_PRICE)),
      ),
    ).toBeDefined();
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
    renderWithRouter();
    const submitButton = screen.getByRole("button", {
      name: tr("checkout.placeOrder"),
    });
    expect(submitButton.hasAttribute("disabled")).toBe(true);
    await fillRequiredFields();
    await waitFor(() => {
      expect(submitButton.hasAttribute("disabled")).toBe(false);
    });
  });

  it("shows inline error on blur for empty required name field", async () => {
    renderWithRouter();
    const nameInput = screen.getByLabelText(tr("checkout.fullName"));
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
    const submitButton = screen.getByRole("button", {
      name: tr("checkout.placeOrder"),
    });
    await userEvent.click(submitButton);
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
    renderWithRouter();

    await fillRequiredFields();

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
    renderWithRouter();
    await fillRequiredFields();
    await userEvent.click(
      screen.getByRole("button", { name: tr("checkout.placeOrder") }),
    );
    await waitFor(() => {
      expect(screen.getByText(tr("checkout.orderSuccessful"))).toBeDefined();
      expect(
        screen.getByText((content) => /ORD-\d+/.test(content)),
      ).toBeDefined();
    });
  });

  it("shows continue shopping button on success screen", async () => {
    renderWithRouter();
    await fillRequiredFields();
    await userEvent.click(
      screen.getByRole("button", { name: tr("checkout.placeOrder") }),
    );
    await waitFor(() => {
      expect(
        screen.getByRole("button", {
          name: tr("checkout.continueShoppingButton"),
        }),
      ).toBeDefined();
    });
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
      "https://res.cloudinary.com/test/image/upload/c_fill,g_auto,h_48,w_48/f_auto/q_auto/left.jpg",
    );
    expect(images[1]).toHaveAttribute(
      "src",
      "https://res.cloudinary.com/test/image/upload/c_fill,g_auto,h_48,w_48/f_auto/q_auto/right.jpg",
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

    expect(
      screen.getByText(
        hasExactTextContent(
          formatPrice(CANVAS_PRINT_UNIT_PRICE * mockSlots.length),
        ),
      ),
    ).toBeDefined();
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
    // Pre-seed sessionStorage so the form mounts valid (avoids the combobox interaction)
    sessionStorage.setItem(
      "checkout-form-draft",
      JSON.stringify({
        name: "Jane Doe",
        email: "jane@example.com",
        phone: "",
        address: "1 Main St",
        city: "Warsaw",
        postalCode: "00-001",
        country: "Poland",
      }),
    );
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
