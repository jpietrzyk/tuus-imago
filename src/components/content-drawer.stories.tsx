import type { Meta, StoryObj } from "@storybook/react-vite"
import { ContentDrawer } from "@/components/content-drawer"

const meta: Meta<typeof ContentDrawer> = {
  title: "Storefront/ContentDrawer",
  component: ContentDrawer,
  parameters: {
    docs: {
      description: {
        component:
          "A right-side drawer used for legal/content pages. Wraps the vaul Drawer with custom styling, close button, and title.",
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof ContentDrawer>

export const Default: Story = {
  render: () => (
    <ContentDrawer title="Privacy Policy" defaultOpen>
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          This is sample content inside the drawer. In production it renders markdown content from CMS.
        </p>
        <p className="text-sm">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </p>
      </div>
    </ContentDrawer>
  ),
}
