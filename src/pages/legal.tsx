import { FileText, Info, Shield } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

export function LegalPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back to Home Link */}
        <Link
          to="/"
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors mb-6"
        >
          ← Back to Home
        </Link>

        {/* Page Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Legal Information
          </h1>
          <p className="text-lg text-gray-600">
            Privacy Policy and Terms of Service
          </p>
        </div>

        {/* Main Content */}
        <Card>
          <CardContent className="pt-6 space-y-8">
            {/* Privacy Policy Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">Privacy Policy</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                At Tuus Imago, we take your privacy seriously. All uploaded
                photos are processed securely and are used solely for the
                purpose of AI enhancement and canvas printing services.
              </p>
              <div className="space-y-3 text-gray-700">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Data Collection
                  </h3>
                  <p className="text-sm">
                    We only collect the photos you upload and any necessary
                    contact information for service delivery.
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Data Storage
                  </h3>
                  <p className="text-sm">
                    Your photos are stored securely on encrypted cloud servers.
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Data Usage
                  </h3>
                  <p className="text-sm">
                    Photos are used exclusively for processing and delivering
                    your orders. We never share your images with third parties
                    without explicit consent.
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Data Retention
                  </h3>
                  <p className="text-sm">
                    Your data is retained only as long as necessary to complete
                    your order and provide customer support.
                  </p>
                </div>
              </div>
            </section>

            <Separator />

            {/* Terms of Service Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">Terms of Service</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                By using our services, you agree to the following terms and
                conditions.
              </p>
              <div className="space-y-3 text-gray-700">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Service Use
                  </h3>
                  <p className="text-sm">
                    You agree to use our AI enhancement and printing services
                    only for lawful purposes and in accordance with these Terms.
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Content Ownership
                  </h3>
                  <p className="text-sm">
                    You retain full ownership of all photos you upload. Tuus
                    Imago obtains a limited license to process and deliver your
                    photos.
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Refund Policy
                  </h3>
                  <p className="text-sm">
                    Refunds are available within 30 days of delivery if the
                    product quality does not meet our standards.
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Limitation of Liability
                  </h3>
                  <p className="text-sm">
                    We are not liable for any damages arising from the use of
                    our services beyond the purchase price of your order.
                  </p>
                </div>
              </div>
            </section>

            <Separator />

            {/* Contact Information */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">Contact & Support</h2>
              </div>
              <div className="text-gray-700">
                <p className="mb-4">
                  For any questions regarding our privacy policy or terms of
                  service, please contact us:
                </p>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p>
                    <span className="font-semibold text-gray-900">Email:</span>{" "}
                    <a
                      href="mailto:support@tuusimago.com"
                      className="text-blue-600 hover:underline"
                    >
                      support@tuusimago.com
                    </a>
                  </p>
                  <p>
                    <span className="font-semibold text-gray-900">Phone:</span>{" "}
                    +48 123 456 789
                  </p>
                  <p>
                    <span className="font-semibold text-gray-900">
                      Address:
                    </span>{" "}
                    123 Innovation Street, Warsaw, Poland
                  </p>
                </div>
              </div>
            </section>

            <Separator />

            {/* Last Updated */}
            <div className="text-xs text-gray-500 text-center pt-2">
              Last updated: February 2025
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
