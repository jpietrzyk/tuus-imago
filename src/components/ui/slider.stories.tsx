import type { Meta, StoryObj } from "@storybook/react-vite"
import { Slider } from "@/components/ui/slider"

const meta: Meta<typeof Slider> = {
  title: "UI/Slider",
  component: Slider,
  argTypes: {
    min: { control: "number" },
    max: { control: "number" },
    step: { control: "number" },
    value: { control: "number" },
    disabled: { control: "boolean" },
  },
  args: {
    min: 0,
    max: 100,
    step: 1,
    value: 50,
  },
}

export default meta
type Story = StoryObj<typeof Slider>

export const Default: Story = {
  render: (args) => <Slider className="w-64" {...args} />,
}

export const Disabled: Story = {
  args: {
    disabled: true,
    value: 30,
  },
  render: (args) => <Slider className="w-64" {...args} />,
}

export const Ranges: Story = {
  render: () => (
    <div className="flex flex-col gap-6 w-64">
      <div className="flex flex-col gap-2">
        <span className="text-sm text-muted-foreground">0–10 (step 1)</span>
        <Slider min={0} max={10} step={1} value={5} />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm text-muted-foreground">0–1 (step 0.01)</span>
        <Slider min={0} max={1} step={0.01} value={0.5} />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm text-muted-foreground">0–1000 (step 100)</span>
        <Slider min={0} max={1000} step={100} value={400} />
      </div>
    </div>
  ),
}
