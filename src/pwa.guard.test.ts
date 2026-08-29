import { describe, it, expect } from "vitest";
import { readFileSync, existsSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_PATH = resolve(ROOT, "public/manifest.webmanifest");

interface ManifestIcon {
  src: string;
  sizes: string;
  type: string;
  purpose?: string;
}

interface WebManifest {
  name: string;
  short_name: string;
  description: string;
  id: string;
  start_url: string;
  scope: string;
  display: string;
  theme_color: string;
  background_color: string;
  icons: ManifestIcon[];
}

function readManifest(): WebManifest {
  return JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as WebManifest;
}

function pngDimensions(filePath: string): { width: number; height: number } {
  const buf = readFileSync(filePath);
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

describe("PWA guard", () => {
  it("manifest.webmanifest is valid JSON with required installability fields", () => {
    const manifest = readManifest();

    expect(manifest.name).toBe("Tuus Imago");
    expect(manifest.short_name.length).toBeGreaterThan(0);
    expect(manifest.short_name.length).toBeLessThanOrEqual(12);
    expect(manifest.display).toBe("standalone");
    expect(manifest.start_url).toBe("/");
    expect(manifest.scope).toBe("/");
    expect(manifest.theme_color).toMatch(/^#/);
    expect(manifest.background_color).toMatch(/^#/);
  });

  it("manifest declares resolvable 192 and 512 icons for any and maskable purposes", () => {
    const manifest = readManifest();
    const sizes = manifest.icons.map((icon) => icon.sizes);

    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");

    for (const purpose of ["any", "maskable"]) {
      const matching = manifest.icons.filter(
        (icon) => icon.purpose === purpose,
      );
      expect(
        matching.map((icon) => icon.sizes),
        `purpose "${purpose}" covers 192 and 512`,
      ).toEqual(expect.arrayContaining(["192x192", "512x512"]));
    }

    for (const icon of manifest.icons) {
      const iconPath = resolve(ROOT, "public", icon.src.replace(/^\//, ""));
      expect(existsSync(iconPath), `${icon.src} exists`).toBe(true);
    }
  });

  it("manifest icon files match their declared dimensions", () => {
    const manifest = readManifest();

    for (const icon of manifest.icons) {
      const iconPath = resolve(ROOT, "public", icon.src.replace(/^\//, ""));
      const [declaredWidth, declaredHeight] = icon.sizes
        .split("x")
        .map(Number);
      const { width, height } = pngDimensions(iconPath);

      expect({ width, height }, `${icon.src} is ${width}x${height}`).toEqual({
        width: declaredWidth,
        height: declaredHeight,
      });
    }
  });

  it("apple-touch-icon and favicon fallbacks exist in public/", () => {
    for (const file of [
      "public/apple-touch-icon.png",
      "public/favicon.ico",
      "public/favicon-96x96.png",
    ]) {
      const filePath = resolve(ROOT, file);
      expect(existsSync(filePath), `${file} exists`).toBe(true);
      expect(statSync(filePath).size, `${file} is not empty`).toBeGreaterThan(
        0,
      );
    }
  });

  it("index.html links the manifest and PWA meta tags", () => {
    const html = readFileSync(resolve(ROOT, "index.html"), "utf8");

    expect(html).toContain('<link rel="manifest" href="/manifest.webmanifest"');
    expect(html).toContain('rel="apple-touch-icon"');
    expect(html).toContain('name="theme-color"');
    expect(html).toContain('name="apple-mobile-web-app-capable"');
    expect(html).toContain("viewport-fit=cover");
  });

  it("netlify.toml prevents caching of the service worker and manifest", () => {
    const toml = readFileSync(resolve(ROOT, "netlify.toml"), "utf8");

    expect(toml).toContain('for = "/sw.js"');
    expect(toml).toContain("no-cache");
    expect(toml).toContain('for = "/manifest.webmanifest"');
    expect(toml).toContain("must-revalidate");
  });

  it("vite config registers the PWA plugin with auto-update", () => {
    const config = readFileSync(resolve(ROOT, "vite.config.ts"), "utf8");

    expect(config).toContain("VitePWA(");
    expect(config).toContain('registerType: "autoUpdate"');
    expect(config).toContain('navigateFallback: "/index.html"');
  });
});
