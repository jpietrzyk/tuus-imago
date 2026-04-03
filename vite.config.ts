import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import decapCms from "vite-plugin-decap-cms"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    decapCms({
      config: {
        backend: {
          name: "git-gateway",
          branch: "main",
        },
        locale: "pl",
        mediaFolder: "content/media",
        publicFolder: "/content/media",
        collections: [
          {
            name: "legal",
            label: "Strony informacyjne",
            folder: "content/legal",
            create: false,
            extension: "md",
            format: "frontmatter",
            summary: "{{title}} (/{{slug}})",
            fields: [
              { name: "title", label: "Tytuł", widget: "string" },
              { name: "subtitle", label: "Podtytuł", widget: "string" },
              { name: "slug", label: "URL Slug", widget: "string", hint: "np. terms, privacy, shipping" },
              { name: "icon", label: "Ikona menu", widget: "select", options: ["FileText", "Shield", "Cookie", "CheckCircle", "Lock", "RotateCcw", "Truck", "AlertCircle", "BadgeDollarSign", "Building2", "Mail"] },
              { name: "menuSection", label: "Sekcja menu", widget: "select", options: ["legal", "payments", "company"] },
              { name: "menuOrder", label: "Kolejność w menu", widget: "number", valueType: "int", min: 1, max: 20 },
              { name: "lastUpdated", label: "Ostatnia aktualizacja", widget: "datetime", format: "YYYY-MM-DD", dateFormat: "DD.MM.YYYY" },
              { name: "body", label: "Treść", widget: "markdown", hint: "Treść strony w formacie Markdown" },
            ],
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
