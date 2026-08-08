/// <reference types="vite/client" />

declare module "*.svg?react" {
  import type { SVGProps } from "react";
  const SVGComponent: (props: SVGProps<SVGSVGElement>) => JSX.Element;
  export default SVGComponent;
}

declare module "virtual:tuus-content" {
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
  const rows: ContentPageRow[];
  export default rows;
}
