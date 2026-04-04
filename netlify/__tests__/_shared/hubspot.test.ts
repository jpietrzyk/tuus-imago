import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildContactProperties,
  getHubSpotConfig,
  upsertHubSpotContact,
  type HubSpotConfig,
} from "../../functions/_shared/hubspot";

describe("getHubSpotConfig", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns config when access token is set", () => {
    process.env.HS_PRIVATE_APP_ACCESS_TOKEN = "pat-test-token-123";

    const config = getHubSpotConfig();

    expect(config).toEqual({
      accessToken: "pat-test-token-123",
      apiBaseUrl: "https://api.hubapi.com",
    });
  });

  it("uses custom API base URL when set", () => {
    process.env.HS_PRIVATE_APP_ACCESS_TOKEN = "pat-test-token-123";
    process.env.HUBSPOT_API_BASE_URL = "https://api.hubapi.eu";

    const config = getHubSpotConfig();

    expect(config.apiBaseUrl).toBe("https://api.hubapi.eu");
  });

  it("throws when access token is missing", () => {
    delete process.env.HS_PRIVATE_APP_ACCESS_TOKEN;
    delete process.env.HUBSPOT_API_BASE_URL;

    expect(() => getHubSpotConfig()).toThrow("Missing HS_PRIVATE_APP_ACCESS_TOKEN");
  });
});

describe("buildContactProperties", () => {
  it("splits full name into first and last name", () => {
    const order = {
      id: "order-1",
      order_number: "TI-2026-000001",
      status: "pending_payment",
      customer_name: "Jan Kowalski",
      customer_email: "jan@example.com",
      customer_phone: "48123456789",
      shipping_address: "Main 1",
      shipping_city: "Warsaw",
      shipping_postal_code: "00-001",
      shipping_country: "PL",
      total_price: 200,
      items_count: 2,
      marketing_consent: true,
      created_at: "2026-04-04T12:00:00Z",
    };

    const properties = buildContactProperties(order as never);

    expect(properties.firstname).toBe("Jan");
    expect(properties.lastname).toBe("Kowalski");
    expect(properties.email).toBe("jan@example.com");
    expect(properties.phone).toBe("48123456789");
    expect(properties.address).toBe("Main 1");
    expect(properties.city).toBe("Warsaw");
    expect(properties.zip).toBe("00-001");
    expect(properties.country).toBe("PL");
    expect(properties.lifecyclestage).toBe("lead");
    expect(properties.tuus_imago_order_number).toBe("TI-2026-000001");
    expect(properties.tuus_imago_order_value).toBe(200);
    expect(properties.tuus_imago_items_count).toBe(2);
    expect(properties.tuus_imago_checkout_date).toBe("2026-04-04T12:00:00Z");
    expect(properties.tuus_imago_marketing_consent).toBe("true");
    expect(properties.tuus_imago_order_status).toBe("pending_payment");
  });

  it("puts full name in lastname when no space", () => {
    const order = {
      id: "order-2",
      order_number: "TI-2026-000002",
      status: "pending_payment",
      customer_name: "Madonna",
      customer_email: "madonna@example.com",
      customer_phone: null,
      shipping_address: "Street 5",
      shipping_city: "Berlin",
      shipping_postal_code: "10115",
      shipping_country: "DE",
      total_price: "99.99",
      items_count: 1,
      marketing_consent: false,
      created_at: "2026-04-04T10:00:00Z",
    };

    const properties = buildContactProperties(order as never);

    expect(properties.lastname).toBe("Madonna");
    expect(properties.firstname).toBeUndefined();
    expect(properties.tuus_imago_order_value).toBe(99.99);
    expect(properties.tuus_imago_marketing_consent).toBe("false");
  });

  it("handles three-part names by splitting on last space", () => {
    const order = {
      id: "order-3",
      order_number: "TI-2026-000003",
      status: "pending_payment",
      customer_name: "Maria Anna Schmidt",
      customer_email: "maria@example.com",
      customer_phone: null,
      shipping_address: "",
      shipping_city: "",
      shipping_postal_code: "",
      shipping_country: "",
      total_price: 150,
      items_count: 1,
      marketing_consent: false,
      created_at: "2026-04-04T08:00:00Z",
    };

    const properties = buildContactProperties(order as never);

    expect(properties.firstname).toBe("Maria Anna");
    expect(properties.lastname).toBe("Schmidt");
  });

  it("omits optional fields when empty", () => {
    const order = {
      id: "order-4",
      order_number: "TI-2026-000004",
      status: "pending_payment",
      customer_name: "Test User",
      customer_email: "test@example.com",
      customer_phone: null,
      shipping_address: "",
      shipping_city: "",
      shipping_postal_code: "",
      shipping_country: "",
      total_price: 0,
      items_count: 0,
      marketing_consent: false,
      created_at: "2026-04-04T00:00:00Z",
    };

    const properties = buildContactProperties(order as never);

    expect(properties.phone).toBeUndefined();
    expect(properties.address).toBeUndefined();
    expect(properties.city).toBeUndefined();
    expect(properties.zip).toBeUndefined();
    expect(properties.country).toBeUndefined();
  });
});

describe("upsertHubSpotContact", () => {
  const config: HubSpotConfig = {
    accessToken: "pat-test-token-123",
    apiBaseUrl: "https://api.hubapi.com",
  };

  const properties = {
    firstname: "Jan",
    lastname: "Kowalski",
    email: "jan@example.com",
    lifecyclestage: "lead",
  };

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("calls the upsert endpoint with correct auth header and body", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({ id: "hubspot-contact-001", properties: { email: "jan@example.com" } }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const result = await upsertHubSpotContact(config, properties);

    expect(result.id).toBe("hubspot-contact-001");

    expect(fetch).toHaveBeenCalledWith(
      "https://api.hubapi.com/crm/v3/objects/contacts/jan%40example.com?idProperty=email",
      expect.objectContaining({
        method: "PATCH",
        headers: expect.objectContaining({
          Authorization: "Bearer pat-test-token-123",
          "Content-Type": "application/json",
        }),
      }),
    );

    const callArgs = vi.mocked(fetch).mock.calls[0]!;
    const body = JSON.parse(callArgs[1]!.body as string);
    expect(body).toEqual({ properties });
  });

  it("throws on non-ok response", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response("Server Error", { status: 500 }),
    );

    await expect(upsertHubSpotContact(config, properties)).rejects.toThrow(
      "HubSpot contact upsert failed (status 500)",
    );
  });
});
