import type { Meta, StoryObj } from "@storybook/react-vite"

const meta: Meta = {
  title: "Design Tokens/Typography",
  parameters: {
    docs: {
      description: {
        component:
          "Typography uses Inter Variable font. The base text style is applied to `<body>` via Tailwind (`font-sans text-foreground bg-background`).",
      },
    },
  },
}

export default meta
type Story = StoryObj

function FontFamily() {
  return (
    <div className="space-y-4 p-4">
      <h3 className="text-lg font-semibold border-b border-border pb-2">Font Family</h3>
      <p className="font-mono text-sm text-muted-foreground">--font-sans: &quot;Inter Variable&quot;, sans-serif</p>
      <p className="text-base">
        The quick brown fox jumps over the lazy dog. 0123456789 !@#$%^&amp;*()
      </p>
    </div>
  )
}

function HeadingScale() {
  const headings = [
    { tag: "h1", className: "text-4xl font-bold", label: "H1 — text-4xl font-bold" },
    { tag: "h2", className: "text-3xl font-semibold", label: "H2 — text-3xl font-semibold" },
    { tag: "h3", className: "text-2xl font-medium", label: "H3 — text-2xl font-medium" },
    { tag: "h4", className: "text-xl font-medium", label: "H4 — text-xl font-medium" },
    { tag: "h5", className: "text-lg font-medium", label: "H5 — text-lg font-medium" },
    { tag: "h6", className: "text-base font-medium", label: "H6 — text-base font-medium" },
  ]

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-lg font-semibold border-b border-border pb-2">Heading Scale</h3>
      <div className="space-y-3">
        {headings.map((h) => (
          <div key={h.tag} className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground font-mono">{h.label}</span>
            <p className={h.className}>The quick brown fox</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function BodyTextSizes() {
  const sizes = [
    { className: "text-xs", label: "text-xs" },
    { className: "text-sm", label: "text-sm" },
    { className: "text-base", label: "text-base (default)" },
    { className: "text-lg", label: "text-lg" },
    { className: "text-xl", label: "text-xl" },
  ]

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-lg font-semibold border-b border-border pb-2">Body Text Sizes</h3>
      <div className="space-y-3">
        {sizes.map((s) => (
          <div key={s.label} className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground font-mono">{s.label}</span>
            <p className={s.className}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function FontWeights() {
  const weights = [
    { className: "font-normal", label: "font-normal (400)" },
    { className: "font-medium", label: "font-medium (500)" },
    { className: "font-semibold", label: "font-semibold (600)" },
    { className: "font-bold", label: "font-bold (700)" },
  ]

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-lg font-semibold border-b border-border pb-2">Font Weights</h3>
      <div className="space-y-3">
        {weights.map((w) => (
          <div key={w.label} className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground font-mono">{w.label}</span>
            <p className={`text-base ${w.className}`}>
              The quick brown fox jumps over the lazy dog
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function TextColors() {
  const colors = [
    { className: "text-foreground", label: "text-foreground" },
    { className: "text-muted-foreground", label: "text-muted-foreground" },
    { className: "text-primary", label: "text-primary" },
    { className: "text-secondary-foreground", label: "text-secondary-foreground" },
    { className: "text-destructive", label: "text-destructive" },
    { className: "text-accent-foreground", label: "text-accent-foreground" },
  ]

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-lg font-semibold border-b border-border pb-2">Text Colors</h3>
      <div className="space-y-2">
        {colors.map((c) => (
          <div key={c.label} className="flex flex-col gap-1">
            <span className="text-xs font-mono text-muted-foreground">{c.label}</span>
            <p className={`text-base ${c.className}`}>
              The quick brown fox jumps over the lazy dog
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export const Overview: Story = {
  render: () => (
    <div className="space-y-10">
      <FontFamily />
      <HeadingScale />
      <BodyTextSizes />
      <FontWeights />
      <TextColors />
    </div>
  ),
}
