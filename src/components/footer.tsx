import { FileText, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContentDrawer } from "@/components/content-drawer";
import { LegalContent } from "@/components/content/legal-content";
import { AboutContent } from "@/components/content/about-content";

interface FooterProps {
  isLegalDrawerOpen: boolean;
  onLegalDrawerOpenChange: (open: boolean) => void;
  isAboutDrawerOpen: boolean;
  onAboutDrawerOpenChange: (open: boolean) => void;
}

export function Footer({
  isLegalDrawerOpen,
  onLegalDrawerOpenChange,
  isAboutDrawerOpen,
  onAboutDrawerOpenChange,
}: FooterProps) {
  return (
    <footer className="w-full bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Copyright */}
          <div className="text-sm text-gray-600">
            © {new Date().getFullYear()} Tuus Imago. All rights reserved.
          </div>

          {/* Legal Links */}
          <div className="flex items-center gap-4">
            <ContentDrawer
              open={isAboutDrawerOpen}
              onOpenChange={onAboutDrawerOpenChange}
              title="About Us"
              trigger={
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <Info className="h-4 w-4 mr-2" />
                  About Us
                </Button>
              }
            >
              <AboutContent />
            </ContentDrawer>
            <ContentDrawer
              open={isLegalDrawerOpen}
              onOpenChange={onLegalDrawerOpenChange}
              title="Legal Information"
              trigger={
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Legal & Privacy
                </Button>
              }
            >
              <LegalContent />
            </ContentDrawer>
          </div>
        </div>
      </div>
    </footer>
  );
}
