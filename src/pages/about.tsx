import { ContentPageShell } from "@/components/content-page-shell"
import { getPageBySlug } from "@/lib/content-loader"

export function AboutPage() {
  return <ContentPageShell page={getPageBySlug("about")} />
}
