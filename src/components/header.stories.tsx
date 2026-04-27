import type { Meta, StoryObj } from "@storybook/react-vite"
import { Header } from "@/components/header"
import { MemoryRouter } from "react-router-dom"

function Wrapper({ children }: { children: React.ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>
}

const meta: Meta<typeof Header> = {
  title: "Storefront/Header",
  component: Header,
  decorators: [
    (Story) => (
      <Wrapper>
        <Story />
      </Wrapper>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          "Top bar of the storefront. Contains logo, promotion banner (optional), user menu, and legal menu trigger. Requires `react-router-dom` context.",
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof Header>

export const Default: Story = {
  args: {
    onOpenLegalMenu: () => {},
  },
}

export const WithPromotion: Story = {
  args: {
    onOpenLegalMenu: () => {},
    promotionSlogan: "Free shipping this week!",
  },
}
