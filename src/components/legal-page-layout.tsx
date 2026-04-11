import type { ReactNode } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { t } from "@/locales/i18n"

interface LegalPageLayoutProps {
  title: string
  subtitle: string
  lastUpdated: string
  markdownContent: string
  children?: ReactNode
}

export function LegalPageLayout({
  title,
  subtitle,
  lastUpdated,
  markdownContent,
  children,
}: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-end mb-2">
          <button
            type="button"
            onClick={() => window.history.back()}
            aria-label={t("common.backToHome")}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{title}</h1>
          <p className="text-lg text-gray-600">{subtitle}</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="prose prose-gray max-w-none legal-markdown">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {markdownContent}
              </ReactMarkdown>
            </div>

            {children && (
              <>
                <Separator className="my-8" />
                {children}
              </>
            )}

            <Separator className="my-8" />
            <div className="text-xs text-gray-500 text-center pt-2">
              Ostatnia aktualizacja: {lastUpdated}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
