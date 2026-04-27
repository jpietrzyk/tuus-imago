import type { Meta, StoryObj } from "@storybook/react-vite"
import { UploaderActionButtons } from "@/components/image-uploader/uploader-action-buttons"

const meta: Meta<typeof UploaderActionButtons> = {
  title: "Storefront/ImageUploader/UploaderActionButtons",
  component: UploaderActionButtons,
  parameters: {
    docs: {
      description: {
        component:
          "Two large action buttons: Upload from Device and Take Photo. Shown after the user clicks the initial upload area.",
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof UploaderActionButtons>

export const Default: Story = {
  render: () => (
    <div className="h-96 w-full max-w-sm border rounded-lg">
      <UploaderActionButtons
        onUploadClick={() => {}}
        onCameraClick={() => {}}
      />
    </div>
  ),
}
