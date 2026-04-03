import { describe, expect, it } from "vitest";

import { createLegalPageData } from "./content-loader";

describe("createLegalPageData", () => {
  it("derives slug from the file path instead of frontmatter", () => {
    const page = createLegalPageData(
      "/content/legal/terms.md",
      `---
title: "Warunki korzystania"
subtitle: "Warunki użytkowania naszych usług"
slug: "broken-route"
icon: "FileText"
menuSection: "legal"
menuOrder: 2
lastUpdated: "2025-03-01"
---

Body`,
    );

    expect(page.slug).toBe("terms");
  });
});
