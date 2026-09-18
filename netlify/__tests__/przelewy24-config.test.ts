import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getP24Config } from "../functions/_shared/przelewy24";

const REQUIRED_ENV: Record<string, string> = {
  P24_MERCHANT_ID: "12345",
  P24_POS_ID: "12345",
  P24_CRC: "crc-key",
  P24_API_KEY: "api-key",
};

const MANAGED_KEYS = [
  ...Object.keys(REQUIRED_ENV),
  "P24_API_BASE_URL",
  "P24_STATUS_URL",
  "SITE_URL",
  "URL",
  "P24_ALLOW_SANDBOX",
];

describe("getP24Config production safety", () => {
  beforeEach(() => {
    for (const key of MANAGED_KEYS) {
      delete process.env[key];
    }
    Object.assign(process.env, REQUIRED_ENV);
  });

  afterEach(() => {
    for (const key of MANAGED_KEYS) {
      delete process.env[key];
    }
  });

  it("requires P24_API_BASE_URL for a non-local site instead of defaulting to sandbox", () => {
    process.env.SITE_URL = "https://tuusimago.com";

    expect(() => getP24Config()).toThrow(/P24_API_BASE_URL must be set/);
  });

  it("rejects a sandbox base URL for a non-local site without the explicit override", () => {
    process.env.SITE_URL = "https://tuusimago.com";
    process.env.P24_API_BASE_URL = "https://sandbox.przelewy24.pl/api/v1";

    expect(() => getP24Config()).toThrow(/sandbox/i);
  });

  it("allows the sandbox against a non-local site only with P24_ALLOW_SANDBOX=true", () => {
    process.env.SITE_URL = "https://tuusimago.com";
    process.env.P24_API_BASE_URL = "https://sandbox.przelewy24.pl/api/v1";
    process.env.P24_ALLOW_SANDBOX = "true";

    const config = getP24Config();

    expect(config.apiBaseUrl).toBe("https://sandbox.przelewy24.pl/api/v1");
  });

  it("allows the sandbox for a local site without an override", () => {
    process.env.SITE_URL = "http://localhost:8888";

    const config = getP24Config();

    expect(config.apiBaseUrl).toBe("https://sandbox.przelewy24.pl/api/v1");
  });

  it("treats an IPv6 loopback site as local", () => {
    process.env.SITE_URL = "http://[::1]:8888";

    const config = getP24Config();

    expect(config.apiBaseUrl).toBe("https://sandbox.przelewy24.pl/api/v1");
  });

  it("accepts the production API base URL for a non-local site", () => {
    process.env.SITE_URL = "https://tuusimago.com";
    process.env.P24_API_BASE_URL = "https://secure.przelewy24.pl/api/v1";

    const config = getP24Config();

    expect(config.apiBaseUrl).toBe("https://secure.przelewy24.pl/api/v1");
    expect(config.panelBaseUrl).toBe("https://secure.przelewy24.pl");
    expect(config.statusUrl).toBe(
      "https://tuusimago.com/.netlify/functions/przelewy24-webhook",
    );
  });

  it("still fails when required P24 credentials are missing", () => {
    process.env.SITE_URL = "https://tuusimago.com";
    delete process.env.P24_CRC;

    expect(() => getP24Config()).toThrow(/Missing P24_MERCHANT_ID/);
  });
});
