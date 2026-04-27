import type { Meta, StoryObj } from "@storybook/react-vite"

const meta: Meta = {
  title: "Design Tokens/Spacing",
  parameters: {
    docs: {
      description: {
        component:
          "Tailwind CSS spacing scale and border radius tokens used across the design system.",
      },
    },
  },
}

export default meta
type Story = StoryObj

function SpacingScale() {
  const spacings = [
    { value: "0.5", rem: "0.125rem", px: "2px" },
    { value: "1", rem: "0.25rem", px: "4px" },
    { value: "1.5", rem: "0.375rem", px: "6px" },
    { value: "2", rem: "0.5rem", px: "8px" },
    { value: "2.5", rem: "0.625rem", px: "10px" },
    { value: "3", rem: "0.75rem", px: "12px" },
    { value: "4", rem: "1rem", px: "16px" },
    { value: "5", rem: "1.25rem", px: "20px" },
    { value: "6", rem: "1.5rem", px: "24px" },
    { value: "8", rem: "2rem", px: "32px" },
    { value: "10", rem: "2.5rem", px: "40px" },
    { value: "12", rem: "3rem", px: "48px" },
    { value: "16", rem: "4rem", px: "64px" },
    { value: "20", rem: "5rem", px: "80px" },
    { value: "24", rem: "6rem", px: "96px" },
  ]

  const maxRem = 6

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-lg font-semibold border-b border-border pb-2">Spacing Scale</h3>
      <div className="space-y-2">
        {spacings.map((s) => {
          const remValue = parseFloat(s.rem)
          const widthPercent = (remValue / maxRem) * 100
          return (
            <div key={s.value} className="flex items-center gap-3">
              <span className="w-12 text-right font-mono text-sm text-muted-foreground shrink-0">
                p-{s.value}
              </span>
              <div
                className="h-4 rounded-sm bg-primary/20 border border-primary/40"
                style={{ width: `${widthPercent}%`, minWidth: "2px" }}
              />
              <span className="font-mono text-xs text-muted-foreground shrink-0">
                {s.rem} ({s.px})
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function BorderRadii() {
  const radii = [
    { name: "radius-sm", var: "--radius-sm", tailwind: "rounded-sm" },
    { name: "radius-md", var: "--radius-md", tailwind: "rounded-md" },
    { name: "radius-lg", var: "--radius-lg", tailwind: "rounded-lg" },
    { name: "radius-xl", var: "--radius-xl", tailwind: "rounded-xl" },
    { name: "radius-2xl", var: "--radius-2xl", tailwind: "rounded-2xl" },
    { name: "radius-3xl", var: "--radius-3xl", tailwind: "rounded-3xl" },
    { name: "radius-4xl", var: "--radius-4xl", tailwind: "rounded-4xl" },
  ]

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-lg font-semibold border-b border-border pb-2">Border Radius</h3>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
        {radii.map((r) => (
          <div key={r.name} className="flex flex-col items-center gap-2">
            <div
              className="h-20 w-20 bg-primary border border-border"
              style={{ borderRadius: `var(${r.var})` }}
            />
            <p className="text-xs font-medium">{r.tailwind}</p>
            <p className="font-mono text-xs text-muted-foreground">var({r.var})</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function GapExamples() {
  const gaps = ["gap-1", "gap-2", "gap-3", "gap-4", "gap-6", "gap-8"]

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-lg font-semibold border-b border-border pb-2">Gap Examples</h3>
      <div className="space-y-4">
        {gaps.map((gap) => (
          <div key={gap}>
            <span className="text-xs font-mono text-muted-foreground mb-1 block">{gap}</span>
            <div className={`flex ${gap}`}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-10 flex-1 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground"
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export const Overview: Story = {
  render: () => (
    <div className="space-y-10">
      <SpacingScale />
      <BorderRadii />
      <GapExamples />
    </div>
  ),
}
