import type { Meta, StoryObj } from "@storybook/react-vite"
import { LegalNavigationSheet } from "@/components/legal-navigation-sheet"

const meta: Meta<typeof LegalNavigationSheet> = {
  title: "Storefront/LegalNavigationSheet",
  component: LegalNavigationSheet,
  parameters: {
    docs: {
      description: {
        component:
          "Bottom drawer with legal/payment/company navigation links. Triggered from the header hamburger menu. Contains three sections with icon-labeled links.",
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof LegalNavigationSheet>

export const Default: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    activeSection: "legal",
    onOpenContentPage: () => {},
  },
}

export const PaymentsSection: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    activeSection: "payments",
    onOpenContentPage: () => {},
  },
}
