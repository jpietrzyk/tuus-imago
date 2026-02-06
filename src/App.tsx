import { useState } from "react";
import bgImage from "@/assets/bg_v1.jpg";
import {
  CloudinaryUploadWidget,
  type UploadResult,
} from "@/components/CloudinaryUploadWidget";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  FileText,
} from "lucide-react";
import { ContentDrawer } from "@/components/ContentDrawer";
import { LegalContent } from "@/components/content/LegalContent";
import { Button } from "@/components/ui/button";

export function App() {
  const [uploadedImage, setUploadedImage] = useState<UploadResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleUploadSuccess = (result: UploadResult) => {
    setUploadedImage(result);
    setUploadError(null);
    setIsSuccess(true);
    // Auto-hide success message after 3 seconds
    setTimeout(() => setIsSuccess(false), 3000);
  };

  const handleUploadError = (error: string) => {
    setUploadError(error);
    setUploadedImage(null);
    setIsSuccess(false);
    // Auto-hide error message after 5 seconds
    setTimeout(() => setUploadError(null), 5000);
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center flex items-center justify-center p-4 transition-all duration-500 ease-in-out"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div
        className={`w-full max-w-2xl transition-all duration-500 ease-in-out ${
          isDrawerOpen
            ? "translate-x-[-20%] scale-95"
            : "translate-x-0 scale-100"
        }`}
      >
        <Card className="bg-white/95 backdrop-blur-sm shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-gray-900">
              Tuus Imago
            </CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Upload your photo for AI enhancement and canvas printing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status Messages */}
            {isSuccess && (
              <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg border border-green-200">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">
                  Photo uploaded successfully!
                </span>
              </div>
            )}

            {uploadError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">{uploadError}</span>
              </div>
            )}

            {/* Upload Widget */}
            <div className="flex flex-col items-center gap-4">
              <CloudinaryUploadWidget
                onUploadSuccess={handleUploadSuccess}
                onUploadError={handleUploadError}
                buttonText="Upload Your Photo"
                className="w-full max-w-sm py-6 text-lg font-semibold"
              />

              <p className="text-sm text-gray-500 text-center">
                Supports JPG, PNG, and WebP files up to 10MB
              </p>
            </div>

            {/* Uploaded Image Preview */}
            {uploadedImage && (
              <div className="space-y-3 pt-4 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Uploaded Photo
                </h3>
                <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                  <img
                    src={uploadedImage.info.secure_url}
                    alt="Uploaded photo"
                    className="w-full h-auto"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 bg-gray-50 rounded">
                    <span className="font-medium text-gray-700">
                      Dimensions:
                    </span>
                    <span className="ml-2 text-gray-600">
                      {uploadedImage.info.width} × {uploadedImage.info.height}px
                    </span>
                  </div>
                  <div className="p-2 bg-gray-50 rounded">
                    <span className="font-medium text-gray-700">Size:</span>
                    <span className="ml-2 text-gray-600">
                      {(uploadedImage.info.bytes / 1024).toFixed(2)} KB
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Legal Information Button */}
            <div className="pt-4 border-t border-gray-200">
              <ContentDrawer
                open={isDrawerOpen}
                onOpenChange={setIsDrawerOpen}
                title="Legal Information"
                trigger={
                  <Button
                    variant="ghost"
                    className="w-full text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Legal Information & Privacy Policy
                  </Button>
                }
              >
                <LegalContent />
              </ContentDrawer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default App;
