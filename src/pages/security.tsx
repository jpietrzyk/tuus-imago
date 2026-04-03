import { ContentPageShell } from "@/components/content-page-shell"
import { getPageBySlug } from "@/lib/content-loader"

export function SecurityPage() {
  return <ContentPageShell page={getPageBySlug("security")} />
}
