import { describe, expect, it } from "vitest";
import createOrderFunction from "../functions/create-order";
import cloudinarySignatureFunction from "../functions/cloudinary-signature";

/**
 * Netlify only applies an in-source `config` (including `rateLimit`) when the
 * module has a default export and no named `handler` export. These smoke tests
 * make sure the v2 signature stays wired, since the config is otherwise a
 * silent no-op and CI would still pass.
 */
describe("netlify v2 default exports", () => {
  it("exposes create-order as a Request -> Response function", async () => {
    const response = await createOrderFunction(
      new Request("https://example.com/.netlify/functions/create-order", {
        method: "GET",
      }),
    );

    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(405);
  });

  it("exposes cloudinary-signature as a Request -> Response function", async () => {
    const response = await cloudinarySignatureFunction(
      new Request(
        "https://example.com/.netlify/functions/cloudinary-signature",
        { method: "GET" },
      ),
    );

    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(405);
  });
});
