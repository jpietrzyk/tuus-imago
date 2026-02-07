import { Heart, Users, Award, Target } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function AboutContent() {
  return (
    <>
      {/* Our Mission Section */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-blue-600" />
          <h3 className="text-lg font-semibold">Our Mission</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          At Tuus Imago, we believe that every photo tells a unique story. Our
          mission is to help you preserve and enhance your most precious
          memories through cutting-edge AI technology and premium canvas
          printing services.
        </p>
      </section>

      <Separator />

      {/* Our Story Section */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-blue-600" />
          <h3 className="text-lg font-semibold">Our Story</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Founded in 2024, Tuus Imago was born from a passion for photography
          and a vision to make professional photo enhancement accessible to
          everyone. We combine years of experience in digital imaging with
          state-of-the-art artificial intelligence to deliver stunning results.
        </p>
      </section>

      <Separator />

      {/* What We Do Section */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-blue-600" />
          <h3 className="text-lg font-semibold">What We Do</h3>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">AI Enhancement:</strong> We use
            advanced artificial intelligence to automatically enhance your
            photos, improving colors, sharpness, and overall quality.
          </p>
          <p>
            <strong className="text-foreground">Canvas Printing:</strong> Your
            enhanced photos are printed on premium canvas using archival-quality
            inks that ensure vibrant colors for generations to come.
          </p>
          <p>
            <strong className="text-foreground">Custom Framing:</strong> Choose
            from a variety of frame options to perfectly complement your artwork
            and home décor.
          </p>
        </div>
      </section>

      <Separator />

      {/* Our Values Section */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-blue-600" />
          <h3 className="text-lg font-semibold">Our Values</h3>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">Quality First:</strong> We never
            compromise on quality, from the enhancement algorithms to the
            printing process and final delivery.
          </p>
          <p>
            <strong className="text-foreground">Customer Satisfaction:</strong>
            Your happiness is our priority. We work tirelessly to ensure you
            love every photo you receive.
          </p>
          <p>
            <strong className="text-foreground">Innovation:</strong> We
            continuously invest in the latest AI and imaging technologies to
            bring you the best results possible.
          </p>
          <p>
            <strong className="text-foreground">Sustainability:</strong> We are
            committed to environmentally responsible practices, from
            eco-friendly inks to sustainable packaging materials.
          </p>
        </div>
      </section>

      <Separator />

      {/* Contact Information */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-blue-600" />
          <h3 className="text-lg font-semibold">Get in Touch</h3>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            Have questions or want to learn more? We'd love to hear from you!
          </p>
          <div className="pl-4 space-y-1">
            <p>
              <strong className="text-foreground">Email:</strong>{" "}
              info@tuusimago.com
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
