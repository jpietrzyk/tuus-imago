import type { Meta, StoryObj } from "@storybook/react-vite"
import { Footer } from "@/components/footer"
import { MemoryRouter } from "react-router-dom"

function Wrapper({ children }: { children: React.ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>
}

const meta: Meta<typeof Footer> = {
  title: "Storefront/Footer",
  component: Footer,
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
          "Bottom bar of the storefront. Shows copyright, reset button (when uploading), and checkout dropup (when images are ready).",
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof Footer>

export const Default: Story = {
  args: {
    onOpenContentPage: () => {},
  },
}

export const WithReset: Story = {
  args: {
    onOpenContentPage: () => {},
    showReset: true,
    onReset: () => {},
  },
}
