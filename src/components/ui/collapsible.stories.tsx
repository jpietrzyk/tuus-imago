import type { Meta, StoryObj } from "@storybook/react-vite"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDownIcon } from "lucide-react"

const meta: Meta<typeof Collapsible> = {
  title: "UI/Collapsible",
  component: Collapsible,
}

export default meta
type Story = StoryObj<typeof Collapsible>

export const Default: Story = {
  render: () => (
    <Collapsible className="w-80 space-y-2">
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border p-3 text-sm font-medium hover:bg-muted">
        Click to expand
        <ChevronDownIcon className="size-4 transition-transform" />
      </CollapsibleTrigger>
      <CollapsibleContent className="rounded-md border p-3 text-sm text-muted-foreground">
        This content is collapsible. Click the trigger above to toggle visibility.
      </CollapsibleContent>
    </Collapsible>
  ),
}

export const Multiple: Story = {
  render: () => (
    <div className="w-80 space-y-2">
      {["Section 1", "Section 2", "Section 3"].map((title, i) => (
        <Collapsible key={title} defaultOpen={i === 0}>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border p-3 text-sm font-medium hover:bg-muted">
            {title}
            <ChevronDownIcon className="size-4 transition-transform" />
          </CollapsibleTrigger>
          <CollapsibleContent className="rounded-md border border-t-0 p-3 text-sm text-muted-foreground">
            Content for {title.toLowerCase()}. This can contain any components.
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  ),
}
