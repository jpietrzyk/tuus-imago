import type { Meta, StoryObj } from "@storybook/react-vite"
import { ContentPageOverlay } from "@/components/content-page-overlay"

const meta: Meta<typeof ContentPageOverlay> = {
  title: "Storefront/ContentPageOverlay",
  component: ContentPageOverlay,
  parameters: {
    docs: {
      description: {
        component:
          "Full-screen overlay for displaying legal/content pages. Renders markdown content inside a Card with title, subtitle, and close button. Closes on Escape key or clicking the backdrop.",
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof ContentPageOverlay>

export const WithContent: Story = {
  args: {
    page: {
      slug: "privacy",
      title: "Privacy Policy",
      subtitle: "How we handle your data",
      body: "## Introduction\n\nWe take your privacy seriously. This policy explains how we collect, use, and protect your personal data.\n\n## Data Collection\n\n- **Images you upload** are processed to create canvas prints\n- **Contact information** is used only for order fulfillment\n- **Payment data** is handled by Przelewy24\n\n## Your Rights\n\nYou have the right to access, correct, or delete your personal data at any time.",
      lastUpdated: "2026-01-15",
      section: "legal",
      icon: "Shield",
    },
    onClose: () => {},
  },
}

export const PageNotFound: Story = {
  args: {
    page: undefined,
    onClose: () => {},
  },
}
