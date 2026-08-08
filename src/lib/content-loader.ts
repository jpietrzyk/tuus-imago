import contentRows from "virtual:tuus-content";

export type MenuSection = "legal" | "payments" | "company";

export interface LegalPageData {
  title: string;
  subtitle: string;
  slug: string;
  icon: string;
  menuSection: MenuSection;
  menuOrder: number;
  lastUpdated: string;
  body: string;
}

const allPages: LegalPageData[] = contentRows
  .map((row) => ({
    title: row.title,
    subtitle: row.subtitle,
    slug: row.slug,
    icon: row.icon,
    menuSection: row.menu_section,
    menuOrder: row.menu_order,
    lastUpdated: row.last_updated ?? "",
    body: row.body,
  }))
  .sort((a, b) => a.menuOrder - b.menuOrder);

export function getPageBySlug(slug: string): LegalPageData | undefined {
  return allPages.find((page) => page.slug === slug);
}

export function getAllPages(): LegalPageData[] {
  return allPages;
}

export function getPagesBySection(section: MenuSection): LegalPageData[] {
  return allPages.filter((page) => page.menuSection === section);
}
