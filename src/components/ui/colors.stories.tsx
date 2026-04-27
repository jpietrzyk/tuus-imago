import type { Meta, StoryObj } from "@storybook/react-vite"

const colorTokens = [
  { name: "background", var: "--background", description: "Page background" },
  { name: "foreground", var: "--foreground", description: "Primary text" },
  { name: "card", var: "--card", description: "Card background" },
  { name: "card-foreground", var: "--card-foreground", description: "Card text" },
  { name: "popover", var: "--popover", description: "Popover background" },
  { name: "popover-foreground", var: "--popover-foreground", description: "Popover text" },
  { name: "primary", var: "--primary", description: "Primary actions" },
  { name: "primary-foreground", var: "--primary-foreground", description: "Text on primary" },
  { name: "secondary", var: "--secondary", description: "Secondary background" },
  { name: "secondary-foreground", var: "--secondary-foreground", description: "Text on secondary" },
  { name: "muted", var: "--muted", description: "Muted background" },
  { name: "muted-foreground", var: "--muted-foreground", description: "Muted text" },
  { name: "accent", var: "--accent", description: "Accent background" },
  { name: "accent-foreground", var: "--accent-foreground", description: "Text on accent" },
  { name: "destructive", var: "--destructive", description: "Error/destructive" },
  { name: "border", var: "--border", description: "Borders" },
  { name: "input", var: "--input", description: "Input borders" },
  { name: "ring", var: "--ring", description: "Focus rings" },
]

const chartTokens = [
  { name: "chart-1", var: "--chart-1" },
  { name: "chart-2", var: "--chart-2" },
  { name: "chart-3", var: "--chart-3" },
  { name: "chart-4", var: "--chart-4" },
  { name: "chart-5", var: "--chart-5" },
]

const sidebarTokens = [
  { name: "sidebar", var: "--sidebar" },
  { name: "sidebar-foreground", var: "--sidebar-foreground" },
  { name: "sidebar-primary", var: "--sidebar-primary" },
  { name: "sidebar-primary-foreground", var: "--sidebar-primary-foreground" },
  { name: "sidebar-accent", var: "--sidebar-accent" },
  { name: "sidebar-accent-foreground", var: "--sidebar-accent-foreground" },
  { name: "sidebar-border", var: "--sidebar-border" },
  { name: "sidebar-ring", var: "--sidebar-ring" },
]

function ColorSwatch({ name, cssVar, description }: { name: string; cssVar: string; description?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className="h-16 w-full rounded-lg border border-border shadow-sm"
        style={{ backgroundColor: `var(${cssVar})` }}
      />
      <div className="space-y-0.5">
        <p className="text-sm font-medium">{name}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
        <p className="font-mono text-xs text-muted-foreground">
          var({cssVar})
        </p>
      </div>
    </div>
  )
}

function ColorSection({ title, tokens }: { title: string; tokens: { name: string; var: string; description?: string }[] }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold border-b border-border pb-2">{title}</h3>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {tokens.map((token) => (
          <ColorSwatch key={token.name} name={token.name} cssVar={token.var} description={token.description} />
        ))}
      </div>
    </div>
  )
}

function RadiusDemo() {
  const radii = [
    { name: "radius-sm", var: "--radius-sm" },
    { name: "radius-md", var: "--radius-md" },
    { name: "radius-lg", var: "--radius-lg" },
    { name: "radius-xl", var: "--radius-xl" },
    { name: "radius-2xl", var: "--radius-2xl" },
    { name: "radius-3xl", var: "--radius-3xl" },
    { name: "radius-4xl", var: "--radius-4xl" },
  ]

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold border-b border-border pb-2">Border Radius</h3>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
        {radii.map((r) => (
          <div key={r.name} className="flex flex-col items-center gap-2">
            <div
              className="h-16 w-16 bg-primary border border-border"
              style={{ borderRadius: `var(${r.var})` }}
            />
            <p className="text-xs font-medium">{r.name}</p>
            <p className="font-mono text-xs text-muted-foreground">var({r.var})</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function ColorsAll() {
  return (
    <div className="space-y-10 p-4">
      <ColorSection title="Core Colors" tokens={colorTokens} />
      <ColorSection title="Chart Colors" tokens={chartTokens} />
      <ColorSection title="Sidebar Colors" tokens={sidebarTokens} />
      <RadiusDemo />
    </div>
  )
}

const meta: Meta = {
  title: "Design Tokens/Colors",
  component: ColorsAll,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "All color tokens defined as CSS custom properties (oklch). Switch between Light and Dark themes using the Theme toolbar button.",
      },
    },
  },
}

export default meta
type Story = StoryObj

export const All: Story = {
  render: () => <ColorsAll />,
}
