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

function parseFrontmatter(raw: string): {
  frontmatter: Record<string, unknown>;
  body: string;
} {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, body: raw };
  }

  const frontmatter: Record<string, unknown> = {};

  for (const line of match[1].split("\n")) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    let value: unknown = line.slice(colonIndex + 1).trim();

    if (typeof value === "string") {
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      } else if (/^\d+$/.test(value)) {
        value = Number.parseInt(value, 10);
      }
    }

    frontmatter[key] = value;
  }

  return { frontmatter, body: match[2].trim() };
}

function slugFromPath(path: string): string {
  const fileName = path.split("/").pop() ?? "";
  return fileName.replace(/\.md$/, "");
}

const rawModules = import.meta.glob("/content/legal/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

const allPages: LegalPageData[] = Object.entries(rawModules)
  .map(([path, raw]) => {
    const { frontmatter, body } = parseFrontmatter(raw);
    return {
      title: String(frontmatter.title ?? ""),
      subtitle: String(frontmatter.subtitle ?? ""),
      slug: String(frontmatter.slug ?? slugFromPath(path)),
      icon: String(frontmatter.icon ?? "FileText"),
      menuSection: (frontmatter.menuSection as MenuSection) ?? "legal",
      menuOrder: Number(frontmatter.menuOrder ?? 99),
      lastUpdated: String(frontmatter.lastUpdated ?? ""),
      body,
    };
  })
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
