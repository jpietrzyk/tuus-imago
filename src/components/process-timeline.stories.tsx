import type { Meta, StoryObj } from "@storybook/react-vite"
import { ProcessTimeline } from "@/components/process-timeline"

const meta: Meta<typeof ProcessTimeline> = {
  title: "Storefront/ProcessTimeline",
  component: ProcessTimeline,
  parameters: {
    docs: {
      description: {
        component:
          "4-step timeline shown on the landing page: Upload → Adjust → Order → Result. Uses lucide-react icons and i18n translations.",
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof ProcessTimeline>

export const Default: Story = {}
