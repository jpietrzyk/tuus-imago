import { FileText, Info, Shield } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function LegalContent() {
  return (
    <>
      {/* Privacy Policy Section */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-600" />
          <h3 className="text-lg font-semibold">Privacy Policy</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          At Tuus Imago, we take your privacy seriously. All uploaded photos are
          processed securely and are used solely for the purpose of AI
          enhancement and canvas printing services.
        </p>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">Data Collection:</strong> We
            only collect the photos you upload and any necessary contact
            information for service delivery.
          </p>
          <p>
            <strong className="text-foreground">Data Storage:</strong> Your
            photos are stored securely on encrypted cloud servers.
          </p>
          <p>
            <strong className="text-foreground">Data Usage:</strong> Photos are
            used exclusively for processing and delivering your orders. We never
            share your images with third parties without explicit consent.
          </p>
          <p>
            <strong className="text-foreground">Data Retention:</strong> Your
            data is retained only as long as necessary to complete your order
            and provide customer support.
          </p>
        </div>
      </section>

      <Separator />

      {/* Terms of Service Section */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-blue-600" />
          <h3 className="text-lg font-semibold">Terms of Service</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          By using our services, you agree to the following terms and
          conditions.
        </p>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">Service Use:</strong> You agree
            to use our AI enhancement and printing services only for lawful
            purposes and in accordance with these Terms.
          </p>
          <p>
            <strong className="text-foreground">Content Ownership:</strong> You
            retain full ownership of all photos you upload. Tuus Imago obtains a
            limited license to process and deliver your photos.
          </p>
          <p>
            <strong className="text-foreground">Refund Policy:</strong> Refunds
            are available within 30 days of delivery if the product quality does
            not meet our standards.
          </p>
          <p>
            <strong className="text-foreground">
              Limitation of Liability:
            </strong>{" "}
            We are not liable for any damages arising from the use of our
            services beyond the purchase price of your order.
          </p>
        </div>
      </section>

      <Separator />

      {/* Contact Information */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-blue-600" />
          <h3 className="text-lg font-semibold">Contact & Support</h3>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            For any questions regarding our privacy policy or terms of service,
            please contact us:
          </p>
          <div className="pl-4 space-y-1">
            <p>
              <strong className="text-foreground">Email:</strong>{" "}
              support@tuusimago.com
            </p>
            <p>
              <strong className="text-foreground">Phone:</strong> +48 123 456
              789
            </p>
            <p>
              <strong className="text-foreground">Address:</strong> 123
              Innovation Street, Warsaw, Poland
            </p>
          </div>
        </div>
      </section>

      <Separator />

      {/* Last Updated */}
      <div className="text-xs text-muted-foreground text-center pt-2">
        Last updated: February 2025
      </div>
    </>
  );
}
