import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { VitePWA } from "vite-plugin-pwa"
import svgr from "vite-plugin-svgr"
import { defineConfig } from "vite"
import { tuusContentPlugin } from "./vite-content-plugin"

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    svgr(),
    tailwindcss(),
    tuusContentPlugin(mode),
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
}))
