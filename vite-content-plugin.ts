import type { Plugin } from "vite";
import { loadEnv } from "vite";

export interface ContentPageRow {
  slug: string;
  title: string;
  subtitle: string;
  icon: string;
  menu_section: "legal" | "payments" | "company";
  menu_order: number;
  last_updated: string | null;
  body: string;
  lang: string;
}

const VIRTUAL_ID = "virtual:tuus-content";
const RESOLVED_VIRTUAL_ID = "\0virtual:tuus-content";

/**
 * Build/dev plugin that fetches published content pages from Supabase at startup
 * and exposes them through the `virtual:tuus-content` module. The content is baked
 * into the bundle (zero runtime DB calls for visitors). The service key is used
 * only here in Node and is never emitted to the client — only the fetched content
 * reaches the browser.
 *
 * - `pnpm dev`: fetches once at server start; degrades gracefully to empty content
 *   if Supabase is unreachable (so the storefront still runs offline).
 * - `pnpm build`: a fetch failure throws and fails the build (never silently ship
 *   empty legal pages).
 */
export function tuusContentPlugin(mode: string): Plugin {
  let cached: ContentPageRow[] | null = null;
  let command: "build" | "serve" = "serve";

  async function fetchContent(isBuild: boolean): Promise<ContentPageRow[]> {
    if (cached) return cached;

    // Use the publishable (anon) key + the VITE_-prefixed URL: these are present in
    // every deploy context (incl. CI and deploy previews), whereas SUPABASE_SECRET_KEY
    // is often scoped to the production context only. content_pages has a public-read
    // RLS policy for published rows, so the anon key is sufficient to bake exactly the
    // content the storefront should show.
    const fileEnv = loadEnv(mode, process.cwd(), "");
    const supabaseUrl = process.env.VITE_SUPABASE_URL ?? fileEnv.VITE_SUPABASE_URL;
    const apiKey =
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? fileEnv.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !apiKey) {
      const msg =
        "[tuus-content] Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY for build-time content fetch.";
      if (isBuild) {
        throw new Error(msg);
      }
      console.warn(msg);
      cached = [];
      return cached;
    }

    const url =
      `${supabaseUrl}/rest/v1/content_pages` +
      `?select=slug,title,subtitle,icon,menu_section,menu_order,last_updated,body,lang` +
      `&is_published=eq.true&order=menu_section.asc,menu_order.asc`;

    try {
      const response = await fetch(url, {
        headers: {
          apikey: apiKey,
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        throw new Error(
          `[tuus-content] Supabase content fetch failed: ${response.status} ${detail.slice(0, 200)}`,
        );
      }

      cached = (await response.json()) as ContentPageRow[];
      return cached;
    } catch (err) {
      if (isBuild) {
        throw err;
      }
      console.warn("[tuus-content] Content fetch failed, serving empty content:", String(err));
      cached = [];
      return cached;
    }
  }

  return {
    name: "tuus-content",
    enforce: "pre",
    config(_, { command: cmd }) {
      command = cmd;
    },
    resolveId(id) {
      if (id === VIRTUAL_ID) {
        return RESOLVED_VIRTUAL_ID;
      }
    },
    async load(id) {
      if (id !== RESOLVED_VIRTUAL_ID) {
        return;
      }
      const rows = await fetchContent(command === "build");
      return `export default ${JSON.stringify(rows)};`;
    },
  };
}
