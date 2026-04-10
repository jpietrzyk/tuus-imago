import type { ReactNode } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { useNavigate, useLocation } from "react-router-dom"
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
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as { from?: string } | null)?.from ?? "/";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          type="button"
          onClick={() => navigate(returnTo)}
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors mb-6"
        >
          {t("common.backToHome")}
        </button>

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
