import { ContentPageShell } from "@/components/content-page-shell"
import { getPageBySlug } from "@/lib/content-loader"

export function PrivacyPage() {
  return <ContentPageShell page={getPageBySlug("privacy")} />
}
