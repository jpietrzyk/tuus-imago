import { ContentPageShell } from "@/components/content-page-shell"
import { getPageBySlug } from "@/lib/content-loader"

export function CookiesPage() {
  return <ContentPageShell page={getPageBySlug("cookies")} />
}
