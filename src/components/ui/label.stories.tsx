import type { Meta, StoryObj } from "@storybook/react-vite"
import { Label } from "@/components/ui/label"

const meta: Meta<typeof Label> = {
  title: "UI/Label",
  component: Label,
  args: {
    children: "Label text",
  },
}

export default meta
type Story = StoryObj<typeof Label>

export const Default: Story = {}

export const WithInput: Story = {
  render: () => (
    <div className="flex flex-col gap-2 max-w-sm">
      <Label htmlFor="name">Full Name</Label>
      <input
        id="name"
        className="h-9 w-full rounded-md border border-input bg-transparent px-2.5 py-1 text-sm shadow-xs"
        placeholder="Enter your name"
      />
    </div>
  ),
}
