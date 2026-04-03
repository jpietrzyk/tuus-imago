import { ContentPageShell } from "@/components/content-page-shell"
import { getPageBySlug } from "@/lib/content-loader"

export function ReturnsPage() {
  return <ContentPageShell page={getPageBySlug("returns")} />
}
