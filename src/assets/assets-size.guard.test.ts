import { describe, it, expect } from "vitest";
import { statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ASSETS_DIR = dirname(fileURLToPath(import.meta.url));

const MAX_BACKGROUND_ASSET_BYTES = 350 * 1024;

const BACKGROUND_ASSETS = ["bg_desktop.webp", "bg_mobile.webp"];

describe("background asset size guard", () => {
  it.each(BACKGROUND_ASSETS)(
    "%s is optimized and under the size budget",
    (filename) => {
      const stats = statSync(resolve(ASSETS_DIR, filename));
      const sizeKb = (stats.size / 1024).toFixed(1);

      expect(
        stats.size,
        `${filename} is ${sizeKb}KB but must be under ${MAX_BACKGROUND_ASSET_BYTES / 1024}KB`,
      ).toBeLessThan(MAX_BACKGROUND_ASSET_BYTES);
    },
  );
});
