import type { Meta, StoryObj } from "@storybook/react-vite"
import { FooterToolsBar } from "@/components/footer-tools-bar"
import type { SizeDpiInfo } from "@/components/image-uploader/size-dpi-availability"

const meta: Meta<typeof FooterToolsBar> = {
  title: "Storefront/FooterToolsBar",
  component: FooterToolsBar,
  argTypes: {
    selectedProportion: {
      control: "select",
      options: ["horizontal", "vertical", "rectangle"],
    },
    selectedPaintingSize: {
      control: "select",
      options: [0, 1, 2, 3, 4, 5],
    },
    paintingShape: {
      control: "select",
      options: ["rectangular", "square"],
    },
  },
  args: {
    onSelectProportion: () => {},
    selectedProportion: "horizontal",
    showCoverageDetails: false,
    isZoomPanMode: false,
    onToggleZoomPan: () => {},
    canToggleZoomPan: true,
    onEnterAiEditMode: () => {},
    canUpdateAiEffects: true,
    onEnterEditMode: () => {},
    canUpdateEffects: true,
    isEditMode: false,
    onSplitImage: () => {},
    canSplitImage: true,
    shouldConfirmSplit: false,
    onReset: () => {},
    canReset: true,
    selectedPaintingSize: 2,
    onSelectPaintingSize: () => {},
    paintingShape: "rectangular",
  },
  parameters: {
    docs: {
      description: {
        component:
          "Footer toolbar combining size selector, shape/proportion tools, frame zoom, AI editor, settings, triptych split, and reset actions.",
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof FooterToolsBar>

export const Default: Story = {}

export const WithDpiAvailability: Story = {
  args: {
    sizesDpiInfo: [
      { sizeIndex: 1, dpi: 320, quality: "excellent", isAvailable: true },
      { sizeIndex: 2, dpi: 200, quality: "good", isAvailable: true },
      { sizeIndex: 3, dpi: 100, quality: "acceptable", isAvailable: true },
      { sizeIndex: 4, dpi: 55, quality: "low", isAvailable: false },
      { sizeIndex: 5, dpi: 30, quality: "low", isAvailable: false },
    ] as SizeDpiInfo[],
  },
}

export const AllSizesExcellent: Story = {
  args: {
    sizesDpiInfo: [
      { sizeIndex: 1, dpi: 960, quality: "excellent", isAvailable: true },
      { sizeIndex: 2, dpi: 640, quality: "excellent", isAvailable: true },
      { sizeIndex: 3, dpi: 480, quality: "excellent", isAvailable: true },
      { sizeIndex: 4, dpi: 360, quality: "excellent", isAvailable: true },
      { sizeIndex: 5, dpi: 300, quality: "excellent", isAvailable: true },
    ] as SizeDpiInfo[],
  },
}

export const SquareWithDpi: Story = {
  args: {
    paintingShape: "square",
    selectedPaintingSize: 2,
    sizesDpiInfo: [
      { sizeIndex: 0, dpi: 500, quality: "excellent", isAvailable: true },
      { sizeIndex: 1, dpi: 300, quality: "excellent", isAvailable: true },
      { sizeIndex: 2, dpi: 200, quality: "good", isAvailable: true },
      { sizeIndex: 3, dpi: 80, quality: "acceptable", isAvailable: true },
      { sizeIndex: 4, dpi: 50, quality: "low", isAvailable: false },
    ] as SizeDpiInfo[],
  },
}

export const ZoomPanActive: Story = {
  args: {
    isZoomPanMode: true,
  },
}

export const EditModeActive: Story = {
  args: {
    isEditMode: true,
  },
}

export const DisabledTools: Story = {
  args: {
    canToggleZoomPan: false,
    canUpdateAiEffects: false,
    canUpdateEffects: false,
    canSplitImage: false,
    canReset: false,
  },
}
