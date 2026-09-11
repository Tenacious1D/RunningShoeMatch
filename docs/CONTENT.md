# Content Architecture

## Content ownership

Blog content will initially be file-based MDX stored in the repository, not in WordPress or Supabase. Structured shoe, ranking, retailer, and affiliate data belongs in Supabase/PostgreSQL.

The current implementation uses the official Next.js MDX integration, validated YAML frontmatter, and repository-managed article files. See `BLOGGING.md` for the publishing workflow.

## Intended routes and files

```text
content/blog/<article-slug>.mdx
app/(site)/blog/page.tsx
app/(site)/blog/[slug]/page.tsx
```

`/blog` lists published articles. `/blog/[slug]` uses one reusable article template that reads repository content and generates route-specific metadata.

## Suggested frontmatter

The implemented content model is:

```yaml
title: "Article title"
description: "Search and social summary"
slug: "article-slug"
publishedDate: "YYYY-MM-DD"
updatedDate: "YYYY-MM-DD"
author: "Author name"
image: "/blog/optional-image.jpg"
imageAlt: "Required when image is set"
tags:
  - "daily trainers"
categories:
  - "Shoe guides"
draft: false
```

Frontmatter is validated while blog routes are built. The file name and slug must match, dates use `YYYY-MM-DD`, and duplicate slugs fail the build.

## Publishing rules

- Use stable, lowercase, hyphenated slugs.
- Do not publish drafts in indexes or article routes.
- Treat published dates as editorial facts, not filesystem timestamps.
- Update `updatedAt` only for meaningful editorial changes.
- Validate required frontmatter and duplicate slugs during the build.
- Keep MDX components on the allowlist in `mdx-components.tsx`.

## Structured-data integration

MDX may reference a shoe or ranking by stable slug or another durable identifier. Reusable server-side components can resolve current structured data when rendering.

Do not paste affiliate URLs, mutable prices, current rank numbers, or duplicated shoe specifications into article source when they should come from application data. This prevents articles from becoming stale and keeps commercial links centrally managed.

If an article makes a historical claim that must not change, store it as editorial prose with a date/source rather than resolving it as live data.

## SEO requirements

Each article supports:

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

Blog pages are statically discovered and generated from published repository content. Shoe and ranking embeds remain server components backed by the cached public Supabase data layer. The build fails clearly for invalid frontmatter, missing required fields, or duplicate slugs.

The content loader should remain separate from page presentation so storage can change later without rewriting article UI.

## Future migration

Moving content to a CMS is a future decision. Preserve a clean content model and reusable rendering boundary so a later source can implement the same article interface. Do not introduce a CMS until requested.
