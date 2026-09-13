import path from "path"
import { execSync } from "node:child_process"
import { readFileSync } from "node:fs"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { VitePWA } from "vite-plugin-pwa"
import svgr from "vite-plugin-svgr"
import { defineConfig, type Plugin } from "vite"
import { tuusContentPlugin } from "./vite-content-plugin"

interface BuildInfo {
  version: string
  builtAt: string
}

function resolveGitSha(): string {
  const fromEnv = process.env.COMMIT_REF ?? process.env.GITHUB_SHA
  if (fromEnv) {
    return fromEnv.slice(0, 7)
  }

  try {
    return execSync("git rev-parse --short HEAD", {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim()
  } catch {
    return "unknown"
  }
}

function resolveBuildInfo(): BuildInfo {
  const pkg = JSON.parse(
    readFileSync(path.resolve(__dirname, "package.json"), "utf8"),
  ) as { version?: string }

  return {
    version: `${pkg.version ?? "0.0.0"}+${resolveGitSha()}`,
    builtAt: new Date().toISOString(),
  }
}

/**
 * Emits `/version.json` (not precached, served no-cache) so a running client can
 * compare its baked-in version against the deployed one and force-refresh.
 */
function buildVersionPlugin(info: BuildInfo): Plugin {
  return {
    name: "tuus-build-version",
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "version.json",
        source: JSON.stringify(info),
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const buildInfo = resolveBuildInfo()

  return {
    define: {
      __APP_VERSION__: JSON.stringify(buildInfo.version),
      __APP_BUILD_TIME__: JSON.stringify(buildInfo.builtAt),
    },
    plugins: [
      react(),
      svgr(),
      tailwindcss(),
      tuusContentPlugin(mode),
      buildVersionPlugin(buildInfo),
      VitePWA({
        registerType: "autoUpdate",
        manifest: false,
        workbox: {
          navigateFallback: "/index.html",
          globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff2}"],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "cloudinary-images",
                expiration: {
                  maxEntries: 200,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                  purgeOnQuotaError: true,
                },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
        devOptions: {
          enabled: process.env.VITE_PWA_DEV === "1",
          type: "module",
        },
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }
})
