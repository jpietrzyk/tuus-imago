import type { Meta, StoryObj } from "@storybook/react-vite"
import { CurrentPromotionBanner } from "@/components/current-promotion-banner"

const meta: Meta<typeof CurrentPromotionBanner> = {
  title: "Storefront/CurrentPromotionBanner",
  component: CurrentPromotionBanner,
  parameters: {
    docs: {
      description: {
        component:
          "A small pill-shaped banner displayed in the header when an active promotion is running. Renders nothing when no slogan is provided.",
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof CurrentPromotionBanner>

export const WithSlogan: Story = {
  args: {
    slogan: "Free shipping this week!",
  },
}

export const NoSlogan: Story = {
  args: {
    slogan: null,
  },
  render: (args) => (
    <div className="flex items-center gap-2 p-4">
      <span className="text-sm text-muted-foreground">(renders nothing)</span>
      <CurrentPromotionBanner {...args} />
    </div>
  ),
}
