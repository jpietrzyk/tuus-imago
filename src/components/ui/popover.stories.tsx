import type { Meta, StoryObj } from "@storybook/react-vite"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"

const meta: Meta<typeof Popover> = {
  title: "UI/Popover",
  component: Popover,
}

export default meta
type Story = StoryObj

export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Open Popover</Button>
      </PopoverTrigger>
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>Dimensions</PopoverTitle>
          <PopoverDescription>Set the dimensions for the layer.</PopoverDescription>
        </PopoverHeader>
        <div className="flex gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Width</label>
            <input className="h-8 rounded-md border border-input px-2 text-sm" defaultValue="100%" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Max width</label>
            <input className="h-8 rounded-md border border-input px-2 text-sm" defaultValue="300px" />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
}
