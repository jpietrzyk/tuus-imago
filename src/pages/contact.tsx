import { ContentPageShell } from "@/components/content-page-shell"
import { getPageBySlug } from "@/lib/content-loader"

export function ContactPage() {
  return <ContentPageShell page={getPageBySlug("contact")} />
}
