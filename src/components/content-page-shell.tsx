import type { ReactNode } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { LegalPageLayout } from "@/components/legal-page-layout"
import { t } from "@/locales/i18n"
import type { LegalPageData } from "@/lib/content-loader"

interface ContentPageShellProps {
  page: LegalPageData | undefined
  children?: ReactNode
}

export function ContentPageShell({ page, children }: ContentPageShellProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as { from?: string } | null)?.from ?? "/";

  if (!page) {
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
    )
  }

  return (
    <LegalPageLayout
      title={page.title}
      subtitle={page.subtitle}
      lastUpdated={page.lastUpdated}
      markdownContent={page.body}
    >
      {children}
    </LegalPageLayout>
  )
}
