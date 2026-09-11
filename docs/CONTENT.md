# Content Architecture

## Content ownership

Blog content will initially be file-based MDX stored in the repository, not in WordPress or Supabase. Structured shoe, ranking, retailer, and affiliate data belongs in Supabase/PostgreSQL.

No MDX pipeline or article is created during the documentation phase.

## Intended routes and files

```text
content/blog/<article-slug>.mdx
app/blog/page.tsx
app/blog/[slug]/page.tsx
```

`/blog` will list published articles. `/blog/[slug]` will use one reusable article template that reads repository content and generates route-specific metadata.

## Suggested frontmatter

The initial content model should include only fields the product actually uses. A likely starting point is:

```yaml
title: "Article title"
description: "Search and social summary"
slug: "article-slug"
publishedAt: "YYYY-MM-DD"
updatedAt: "YYYY-MM-DD"
author: "Author name"
status: "draft | published"
tags:
  - "daily trainers"
```

The final schema should be validated at build time. Optional fields should not be added speculatively.

## Publishing rules

- Use stable, lowercase, hyphenated slugs.
- Do not publish drafts in production indexes, feeds, or sitemaps.
- Treat published dates as editorial facts, not filesystem timestamps.
- Update `updatedAt` only for meaningful editorial changes.
- Validate required frontmatter and duplicate slugs during the build.
- Keep MDX components on a small allowlist.

## Structured-data integration

MDX may reference a shoe or ranking by stable slug or another durable identifier. Reusable server-side components can resolve current structured data when rendering.

Do not paste affiliate URLs, mutable prices, current rank numbers, or duplicated shoe specifications into article source when they should come from application data. This prevents articles from becoming stale and keeps commercial links centrally managed.

If an article makes a historical claim that must not change, store it as editorial prose with a date/source rather than resolving it as live data.

## SEO requirements

Each article should support:

- A unique title and description
- A canonical URL under `https://runningshoematch.com/blog/<slug>`
- Open Graph and social metadata
- Inclusion in the sitemap only when published
- Semantic headings with a single page-level heading
- Descriptive image alternative text
- Internal links to relevant shoes, rankings, methodology, and related articles
- Visible publication and meaningful update dates

Article metadata and visible headings must derive from the same validated content record.

## Content quality and disclosures

- Write for runners first; avoid search-engine-only filler.
- Explain testing, scoring, or data limitations accurately.
- Add affiliate disclosures where required and keep disclosure presentation reusable.
- Do not imply personal testing or evidence that did not occur.
- Link methodology claims to `/methodology` where appropriate.
- Preserve accessible tables, lists, headings, and link text.

## Images and assets

Store article-owned assets in a predictable repository location or an approved future asset service. Optimize images, provide dimensions where appropriate, and avoid hotlinking third-party product images without permission.

Product imagery used across multiple pages should be associated with structured shoe data rather than copied into individual articles.

## Build and rendering

Blog pages should be statically generated where practical. The build must fail clearly for invalid frontmatter, missing required fields, duplicate slugs, or unsupported MDX components.

The content loader should remain separate from page presentation so storage can change later without rewriting article UI.

## Future migration

Moving content to a CMS is a future decision. Preserve a clean content model and reusable rendering boundary so a later source can implement the same article interface. Do not introduce a CMS until requested.