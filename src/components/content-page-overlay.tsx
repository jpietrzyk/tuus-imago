import { useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { t } from "@/locales/i18n";
import type { LegalPageData } from "@/lib/content-loader";

interface ContentPageOverlayProps {
  page: LegalPageData | undefined;
  onClose: () => void;
}

export function ContentPageOverlay({ page, onClose }: ContentPageOverlayProps) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!page) {
    return (
      <div
        className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-start justify-center overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="w-full max-w-4xl mx-4 my-8 min-h-0">
          <div className="bg-gray-50 rounded-xl shadow-xl p-8">
            <div className="flex justify-end mb-2">
              <button
                type="button"
                onClick={onClose}
                aria-label={t("common.backToHome")}
                className="inline-flex items-center justify-center w-8 h-8 rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-center py-16">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {t("common.contentNotFound")}
              </h1>
              <p className="text-gray-600">
                {t("common.contentNotFoundHint")}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-start justify-center overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-4xl mx-4 my-8 min-h-0">
        <div className="bg-gray-50 rounded-xl shadow-xl p-8">
          <div className="flex justify-end mb-2">
            <button
              type="button"
              onClick={onClose}
              aria-label={t("common.backToHome")}
              className="inline-flex items-center justify-center w-8 h-8 rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {page.title}
            </h1>
            <p className="text-lg text-gray-600">{page.subtitle}</p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="prose prose-gray max-w-none legal-markdown">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {page.body}
                </ReactMarkdown>
              </div>

              <Separator className="my-8" />
              <div className="text-xs text-gray-500 text-center pt-2">
                Ostatnia aktualizacja: {page.lastUpdated}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
