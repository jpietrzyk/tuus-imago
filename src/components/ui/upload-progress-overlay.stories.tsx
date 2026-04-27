import type { Meta, StoryObj } from "@storybook/react-vite"
import { UploadProgressOverlay } from "@/components/ui/upload-progress-overlay"

const meta: Meta<typeof UploadProgressOverlay> = {
  title: "Storefront/ImageUploader/UploadProgressOverlay",
  component: UploadProgressOverlay,
  argTypes: {
    progress: { control: { type: "range", min: 0, max: 100 } },
    isIndeterminate: { control: "boolean" },
    label: { control: "text" },
  },
  args: {
    isVisible: true,
    progress: 55,
    label: "Uploading...",
    isIndeterminate: false,
  },
  parameters: {
    docs: {
      description: {
        component:
          "Semi-transparent overlay with progress bar, shown during image upload.",
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof UploadProgressOverlay>

export const Determinate: Story = {
  render: (args) => (
    <div className="relative h-48 w-64 rounded-lg bg-muted">
      <UploadProgressOverlay {...args} />
    </div>
  ),
}

export const Indeterminate: Story = {
  args: {
    isIndeterminate: true,
    label: "Processing...",
  },
  render: (args) => (
    <div className="relative h-48 w-64 rounded-lg bg-muted">
      <UploadProgressOverlay {...args} />
    </div>
  ),
}

export const ProgressLevels: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      {[0, 25, 50, 75, 100].map((p) => (
        <div key={p} className="flex flex-col gap-2 items-center">
          <div className="relative h-32 w-48 rounded-lg bg-muted">
            <UploadProgressOverlay isVisible progress={p} label={`${p}%`} />
          </div>
          <span className="text-xs text-muted-foreground">{p}%</span>
        </div>
      ))}
    </div>
  ),
}
