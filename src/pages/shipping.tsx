import { ContentPageShell } from "@/components/content-page-shell"
import { getPageBySlug } from "@/lib/content-loader"

export function ShippingPage() {
  return <ContentPageShell page={getPageBySlug("shipping")} />
}
