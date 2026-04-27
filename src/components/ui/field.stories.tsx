import type { Meta, StoryObj } from "@storybook/react-vite"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"

const meta: Meta<typeof Field> = {
  title: "UI/Field",
  component: Field,
  argTypes: {
    orientation: {
      control: "select",
      options: ["vertical", "horizontal", "responsive"],
    },
  },
  args: {
    orientation: "vertical",
  },
}

export default meta
type Story = StoryObj<typeof Field>

export const Default: Story = {
  render: (args) => (
    <FieldGroup className="max-w-sm">
      <Field {...args}>
        <FieldLabel htmlFor="name">Name</FieldLabel>
        <Input id="name" placeholder="Enter your name" />
      </Field>
      <Field {...args}>
        <FieldLabel htmlFor="email">Email</FieldLabel>
        <FieldDescription>We&apos;ll never share your email.</FieldDescription>
        <Input id="email" type="email" placeholder="you@example.com" />
      </Field>
    </FieldGroup>
  ),
}

export const WithError: Story = {
  render: () => (
    <FieldGroup className="max-w-sm">
      <Field>
        <FieldLabel htmlFor="err-input">Username</FieldLabel>
        <Input id="err-input" aria-invalid value="john@#" />
        <FieldError errors={[{ message: "Username can only contain letters and numbers." }]} />
      </Field>
    </FieldGroup>
  ),
}

export const Horizontal: Story = {
  render: () => (
    <FieldGroup className="max-w-md">
      <Field orientation="horizontal">
        <FieldLabel htmlFor="notifications">Enable notifications</FieldLabel>
        <Switch id="notifications" defaultChecked />
      </Field>
    </FieldGroup>
  ),
}
