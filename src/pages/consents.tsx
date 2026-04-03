import { ContentPageShell } from "@/components/content-page-shell"
import { getPageBySlug } from "@/lib/content-loader"

export function ConsentsPage() {
  return <ContentPageShell page={getPageBySlug("consents")} />
}
