import type { Meta, StoryObj } from "@storybook/react-vite"
import { Textarea } from "@/components/ui/textarea"

const meta: Meta<typeof Textarea> = {
  title: "UI/Textarea",
  component: Textarea,
  argTypes: {
    placeholder: { control: "text" },
    disabled: { control: "boolean" },
  },
  args: {
    placeholder: "Type a message...",
  },
}

export default meta
type Story = StoryObj<typeof Textarea>

export const Default: Story = {}

export const WithValue: Story = {
  args: {
    value: "This is some text in a textarea. It automatically grows with content thanks to field-sizing-content.",
    readOnly: true,
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: "Disabled textarea",
  },
}

export const Invalid: Story = {
  args: {
    "aria-invalid": true,
    placeholder: "Invalid textarea",
  },
}
