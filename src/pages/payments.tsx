import { ContentPageShell } from "@/components/content-page-shell"
import { getPageBySlug } from "@/lib/content-loader"

export function PaymentsPage() {
  return <ContentPageShell page={getPageBySlug("payments")} />
}
