import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import svgr from "vite-plugin-svgr"
import { defineConfig } from "vite"
import { tuusContentPlugin } from "./vite-content-plugin"

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    svgr(),
    tailwindcss(),
    tuusContentPlugin(mode),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}))
