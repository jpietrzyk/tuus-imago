import { ContentPageShell } from "@/components/content-page-shell"
import { getPageBySlug } from "@/lib/content-loader"

export function TermsPage() {
  return <ContentPageShell page={getPageBySlug("terms")} />
}
