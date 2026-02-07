import { Heart, Users, Award, Target } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

export function AboutPage() {
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">About Us</h1>
          <p className="text-lg text-gray-600">
            Learn more about Tuus Imago and our mission
          </p>
        </div>

        {/* Main Content */}
        <Card>
          <CardContent className="pt-6 space-y-8">
            {/* Our Mission Section */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">Our Mission</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                At Tuus Imago, we believe that every photo tells a unique story.
                Our mission is to help you preserve and enhance your most
                precious memories through cutting-edge AI technology and premium
                canvas printing services.
              </p>
            </section>

            <Separator />

            {/* Our Story Section */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">Our Story</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                Founded in 2024, Tuus Imago was born from a passion for
                photography and a vision to make professional photo enhancement
                accessible to everyone. We combine years of experience in
                digital imaging with state-of-the-art artificial intelligence to
                deliver stunning results.
              </p>
            </section>

            <Separator />

            {/* What We Do Section */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">What We Do</h2>
              </div>
              <div className="space-y-3 text-gray-700">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    AI Enhancement
                  </h3>
                  <p>
                    We use advanced artificial intelligence to automatically
                    enhance your photos, improving colors, sharpness, and
                    overall quality.
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Canvas Printing
                  </h3>
                  <p>
                    Your enhanced photos are printed on premium canvas using
                    archival-quality inks that ensure vibrant colors for
                    generations to come.
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Custom Framing
                  </h3>
                  <p>
                    Choose from a variety of frame options to perfectly
                    complement your artwork and home décor.
                  </p>
                </div>
              </div>
            </section>

            <Separator />

            {/* Our Values Section */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">Our Values</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-4 text-gray-700">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Quality First
                  </h3>
                  <p className="text-sm">
                    We never compromise on quality, from the enhancement
                    algorithms to the printing process and final delivery.
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Customer Satisfaction
                  </h3>
                  <p className="text-sm">
                    Your happiness is our priority. We work tirelessly to ensure
                    you love every photo you receive.
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Innovation
                  </h3>
                  <p className="text-sm">
                    We continuously invest in the latest AI and imaging
                    technologies to bring you the best results possible.
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Sustainability
                  </h3>
                  <p className="text-sm">
                    We are committed to environmentally responsible practices,
                    from eco-friendly inks to sustainable packaging materials.
                  </p>
                </div>
              </div>
            </section>

            <Separator />

            {/* Contact Information */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">Get in Touch</h2>
              </div>
              <div className="text-gray-700">
                <p className="mb-4">
                  Have questions or want to learn more? We'd love to hear from
                  you!
                </p>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p>
                    <span className="font-semibold text-gray-900">Email:</span>{" "}
                    <a
                      href="mailto:info@tuusimago.com"
                      className="text-blue-600 hover:underline"
                    >
                      info@tuusimago.com
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
