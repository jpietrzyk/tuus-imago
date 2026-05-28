import type { Meta, StoryObj } from "@storybook/react-vite"
import { SizeSelector } from "@/components/image-uploader/size-selector"
import type { SizeDpiInfo } from "@/components/image-uploader/size-dpi-availability"

const meta: Meta<typeof SizeSelector> = {
  title: "Storefront/ImageUploader/SizeSelector",
  component: SizeSelector,
  argTypes: {
    shape: {
      control: "select",
      options: ["rectangular", "square"],
    },
    selectedIndex: {
      control: "select",
      options: [0, 1, 2, 3, 4],
    },
    hidden: { control: "boolean" },
  },
  args: {
    shape: "rectangular",
    selectedIndex: 2,
    hidden: false,
    onSelectSize: () => {},
  },
  parameters: {
    docs: {
      description: {
        component:
          "Print size selector with DPI-based availability indicators. Available sizes show a colored quality dot (green=excellent, yellow=good, gray=acceptable). Unavailable sizes are disabled with dimmed styling.",
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof SizeSelector>

export const Default: Story = {}

export const AllAvailableExcellent: Story = {
  args: {
    shape: "rectangular",
    selectedIndex: 2,
    sizesDpiInfo: [
      { sizeIndex: 0, dpi: 960, quality: "excellent", isAvailable: true },
      { sizeIndex: 1, dpi: 640, quality: "excellent", isAvailable: true },
      { sizeIndex: 2, dpi: 480, quality: "excellent", isAvailable: true },
      { sizeIndex: 3, dpi: 360, quality: "excellent", isAvailable: true },
      { sizeIndex: 4, dpi: 300, quality: "excellent", isAvailable: true },
    ] as SizeDpiInfo[],
  },
}

export const MixedAvailability: Story = {
  args: {
    shape: "rectangular",
    selectedIndex: 1,
    sizesDpiInfo: [
      { sizeIndex: 0, dpi: 320, quality: "excellent", isAvailable: true },
      { sizeIndex: 1, dpi: 200, quality: "good", isAvailable: true },
      { sizeIndex: 2, dpi: 100, quality: "acceptable", isAvailable: true },
      { sizeIndex: 3, dpi: 55, quality: "low", isAvailable: false },
      { sizeIndex: 4, dpi: 30, quality: "low", isAvailable: false },
    ] as SizeDpiInfo[],
  },
}

export const MostlyUnavailable: Story = {
  args: {
    shape: "rectangular",
    selectedIndex: 0,
    sizesDpiInfo: [
      { sizeIndex: 0, dpi: 100, quality: "acceptable", isAvailable: true },
      { sizeIndex: 1, dpi: 60, quality: "low", isAvailable: false },
      { sizeIndex: 2, dpi: 45, quality: "low", isAvailable: false },
      { sizeIndex: 3, dpi: 30, quality: "low", isAvailable: false },
      { sizeIndex: 4, dpi: 20, quality: "low", isAvailable: false },
    ] as SizeDpiInfo[],
  },
}

export const SquareShape: Story = {
  args: {
    shape: "square",
    selectedIndex: 2,
    sizesDpiInfo: [
      { sizeIndex: 0, dpi: 500, quality: "excellent", isAvailable: true },
      { sizeIndex: 1, dpi: 300, quality: "excellent", isAvailable: true },
      { sizeIndex: 2, dpi: 200, quality: "good", isAvailable: true },
      { sizeIndex: 3, dpi: 80, quality: "acceptable", isAvailable: true },
      { sizeIndex: 4, dpi: 50, quality: "low", isAvailable: false },
    ] as SizeDpiInfo[],
  },
}

export const Hidden: Story = {
  args: {
    hidden: true,
  },
}
