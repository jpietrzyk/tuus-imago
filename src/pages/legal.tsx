import { LegalPageLayout } from "@/components/legal-page-layout"
import { getPageBySlug } from "@/lib/content-loader"

export function LegalPage() {
  const page = getPageBySlug("legal")
  if (!page) return null
  return (
    <LegalPageLayout
      title={page.title}
      subtitle={page.subtitle}
      lastUpdated={page.lastUpdated}
      markdownContent={page.body}
    />
  )
}
