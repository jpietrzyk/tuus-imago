import type { ReactNode } from "react"
import { X } from "lucide-react"
import { LegalPageLayout } from "@/components/legal-page-layout"
import { t } from "@/locales/i18n"
import type { LegalPageData } from "@/lib/content-loader"

interface ContentPageShellProps {
  page: LegalPageData | undefined
  children?: ReactNode
}

export function ContentPageShell({ page, children }: ContentPageShellProps) {

  if (!page) {
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
