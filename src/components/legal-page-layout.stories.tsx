import type { Meta, StoryObj } from "@storybook/react-vite"
import { LegalPageLayout } from "@/components/legal-page-layout"

const meta: Meta<typeof LegalPageLayout> = {
  title: "Storefront/LegalPageLayout",
  component: LegalPageLayout,
  parameters: {
    docs: {
      description: {
        component:
          "Full-page layout for legal/content pages with their own route. Shows title, subtitle, markdown body in a Card, and last updated date.",
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof LegalPageLayout>

export const Default: Story = {
  args: {
    title: "Terms of Service",
    subtitle: "Last revised January 2026",
    lastUpdated: "2026-01-15",
    markdownContent:
      "## 1. Acceptance of Terms\n\nBy accessing our website, you agree to these terms.\n\n## 2. Services\n\nWe provide canvas printing services from your uploaded images.\n\n## 3. User Content\n\nYou retain ownership of images you upload. We process them solely to fulfill your order.\n\n### 3.1 Image Quality\n\nFor best results, upload images with a minimum resolution of 1000x1000 pixels.\n\n## 4. Payments\n\nAll payments are processed securely through Przelewy24.",
  },
}
