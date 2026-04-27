import type { Meta, StoryObj } from "@storybook/react-vite"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

const meta: Meta<typeof Switch> = {
  title: "UI/Switch",
  component: Switch,
  argTypes: {
    disabled: { control: "boolean" },
  },
}

export default meta
type Story = StoryObj<typeof Switch>

export const Default: Story = {}

export const WithLabel: Story = {
  render: (args) => (
    <div className="flex items-center gap-2">
      <Switch id="airplane-mode" {...args} />
      <Label htmlFor="airplane-mode">Airplane Mode</Label>
    </div>
  ),
}

export const Disabled: Story = {
  args: {
    disabled: true,
  },
  render: (args) => (
    <div className="flex items-center gap-2">
      <Switch id="disabled-switch" {...args} />
      <Label htmlFor="disabled-switch" className="opacity-50">Disabled Switch</Label>
    </div>
  ),
}

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Switch defaultChecked={false} id="off" />
        <Label htmlFor="off">Off</Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch defaultChecked id="on" />
        <Label htmlFor="on">On</Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch disabled id="disabled-off" />
        <Label htmlFor="disabled-off" className="opacity-50">Disabled Off</Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch defaultChecked disabled id="disabled-on" />
        <Label htmlFor="disabled-on" className="opacity-50">Disabled On</Label>
      </div>
    </div>
  ),
}
