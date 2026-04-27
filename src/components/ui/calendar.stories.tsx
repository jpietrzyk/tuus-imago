import type { Meta, StoryObj } from "@storybook/react-vite"
import { Calendar } from "@/components/ui/calendar"
import * as React from "react"

const meta: Meta<typeof Calendar> = {
  title: "UI/Calendar",
  component: Calendar,
}

export default meta
type Story = StoryObj<typeof Calendar>

export const Default: Story = {
  render: function CalendarStory() {
    const [date, setDate] = React.useState<Date | undefined>(new Date())
    return <Calendar mode="single" selected={date} onSelect={setDate} />
  },
}
