import type { Meta, StoryObj } from "@storybook/react-vite"
import { UploaderTools } from "@/components/image-uploader/uploader-tools"

const meta: Meta<typeof UploaderTools> = {
  title: "Storefront/ImageUploader/UploaderTools",
  component: UploaderTools,
  argTypes: {
    selectedProportion: {
      control: "select",
      options: ["horizontal", "vertical", "rectangle"],
    },
    showCoverageDetails: { control: "boolean" },
  },
  args: {
    selectedProportion: "horizontal",
    showCoverageDetails: false,
  },
  parameters: {
    docs: {
      description: {
        component:
          "Proportion selector dropdown (Horizontal/Vertical/Rectangle) with optional coverage percentage display.",
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof UploaderTools>

export const Default: Story = {
  args: {
    onSelectProportion: () => {},
  },
}

export const WithCoverage: Story = {
  args: {
    onSelectProportion: () => {},
    showCoverageDetails: true,
    coveragePercent: {
      horizontal: 85.42,
      vertical: 62.13,
      rectangle: 70.88,
    },
  },
}
