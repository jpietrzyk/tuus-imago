import type { Meta, StoryObj } from "@storybook/react-vite"
import * as React from "react"
import * as LucideIcons from "lucide-react"

const meta: Meta = {
  title: "Design Tokens/Icons",
  parameters: {
    docs: {
      description: {
        component:
          "All icons from lucide-react. Use the search control to filter. Import individual icons: `import { MailIcon } from 'lucide-react'`",
      },
    },
  },
}

export default meta
type Story = StoryObj

const iconNames = Object.keys(LucideIcons).filter(
  (name) => name.endsWith("Icon") && typeof (LucideIcons as Record<string, unknown>)[name] === "function"
)

function IconGallery() {
  const [search, setSearch] = React.useState("")

  const filtered = iconNames.filter((name) =>
    name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search icons..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-64 rounded-md border border-input bg-transparent px-2.5 py-1 text-sm shadow-xs"
        />
        <span className="text-sm text-muted-foreground">
          {filtered.length} / {iconNames} icons
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
        {filtered.slice(0, 200).map((name) => {
          const Icon = (LucideIcons as Record<string, React.ComponentType<{ className?: string }>>)[name]
          return (
            <button
              key={name}
              type="button"
              className="flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs hover:bg-muted transition-colors"
              title={name}
              onClick={() => navigator.clipboard.writeText(name)}
            >
              <Icon className="size-5" />
              <span className="truncate w-full text-center text-muted-foreground">
                {name.replace("Icon", "")}
              </span>
            </button>
          )
        })}
      </div>
      {filtered.length > 200 && (
        <p className="text-sm text-muted-foreground">
          Showing 200 of {filtered.length} icons. Use search to narrow results.
        </p>
      )}
    </div>
  )
}

export const Gallery: Story = {
  render: () => <IconGallery />,
}
