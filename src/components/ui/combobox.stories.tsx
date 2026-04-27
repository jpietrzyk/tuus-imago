import type { Meta, StoryObj } from "@storybook/react-vite"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"

const frameworks = [
  "Next.js",
  "SvelteKit",
  "Nuxt.js",
  "Remix",
  "Astro",
  "Vite",
  "Gatsby",
]

const meta: Meta<typeof Combobox> = {
  title: "UI/Combobox",
  component: Combobox,
}

export default meta
type Story = StoryObj

export const Default: Story = {
  render: () => (
    <div className="max-w-sm">
      <Combobox items={frameworks}>
        <ComboboxInput placeholder="Select a framework..." />
        <ComboboxContent>
          <ComboboxEmpty>No frameworks found.</ComboboxEmpty>
          <ComboboxList>
            {(item) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  ),
}
