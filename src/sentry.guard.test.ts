import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FUNCTIONS_DIR = resolve(ROOT, "netlify/functions");
const SENTRY_ORG_ID = "o4512118721413120";

function read(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), "utf8");
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.tsx?$/.test(entry.name) ? [full] : [];
  });
}

describe("Sentry guard", () => {
  it("wraps every Netlify function so errors are reported", () => {
    const files = readdirSync(FUNCTIONS_DIR, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".ts"))
      .map((entry) => resolve(FUNCTIONS_DIR, entry.name));

    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const source = readFileSync(file, "utf8");
      expect(
        /withSentry(?:V2)?\(/.test(source),
        `${file} is not wrapped with Sentry`,
      ).toBe(true);
    }
  });

  it("documents the Sentry environment variables", () => {
    const example = read(".env.example");

    expect(example).toContain("VITE_SENTRY_DSN");
    expect(example).toContain("SENTRY_DSN");
    expect(example).toContain("SENTRY_TRACES_SAMPLE_RATE");
  });

  it("allows the Sentry ingest host in the CSP connect-src", () => {
    const headers = read("public/_headers");
    const connect = headers.match(/connect-src ([^;]+);/)?.[1] ?? "";

    expect(connect).toContain("ingest.de.sentry.io");
  });

  it("initializes monitoring and renders an error boundary at boot", () => {
    const main = read("src/main.tsx");

    expect(main).toContain("initSentry()");
    expect(main).toContain("<ErrorBoundary>");
  });

  it("keeps the DSN out of tracked source (env-only)", () => {
    const files = [
      ...sourceFiles(resolve(ROOT, "src")),
      ...sourceFiles(FUNCTIONS_DIR),
    ].filter((file) => !file.endsWith("sentry.guard.test.ts"));

    for (const file of files) {
      const source = readFileSync(file, "utf8");
      expect(
        source,
        `${file} must read the Sentry DSN from the environment`,
      ).not.toContain(SENTRY_ORG_ID);
    }
  });
});
