import type { Meta, StoryObj } from "@storybook/react-vite"
import { UploaderDropArea } from "@/components/image-uploader/uploader-drop-area"
import * as React from "react"

const meta: Meta<typeof UploaderDropArea> = {
  title: "Storefront/ImageUploader/UploaderDropArea",
  component: UploaderDropArea,
  parameters: {
    docs: {
      description: {
        component:
          "The initial upload area shown before any images are selected. Shows a dashed upload zone or upload/camera action buttons.",
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof UploaderDropArea>

function DropAreaWrapper({ showIcons = false }: { showIcons?: boolean }) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const cameraInputRef = React.useRef<HTMLInputElement>(null)

  return (
    <div className="h-96 w-full max-w-lg border rounded-lg">
      <UploaderDropArea
        showIcons={showIcons}
        fileInputRef={fileInputRef}
        cameraInputRef={cameraInputRef}
        onFileSelect={() => {}}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={(e) => e.preventDefault()}
        onDrop={(e) => e.preventDefault()}
        onShowIcons={() => {}}
      />
    </div>
  )
}

export const Initial: Story = {
  render: () => <DropAreaWrapper />,
}

export const WithIcons: Story = {
  render: () => <DropAreaWrapper showIcons />,
}
