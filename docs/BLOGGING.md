# Blogging Guide

Running Shoe Match uses repository-managed MDX. There is no WordPress installation, headless CMS, or blog table in Supabase. Article files live in `content/blog/`, the index is rendered at `/blog`, and one reusable route renders every article at `/blog/[slug]`.

## Create a post

1. Create `content/blog/<slug>.mdx`.
2. Use a lowercase, hyphenated file name. The file name and frontmatter `slug` must match exactly.
3. Start the file with all required YAML frontmatter:

```yaml
---
title: "How to Choose a Daily Trainer"
slug: "how-to-choose-a-daily-trainer"
description: "A concise search and social description for the article."
publishedDate: "2026-10-01"
updatedDate: "2026-10-15"
author: "Running Shoe Match Editorial"
image: "/blog/daily-trainer-guide.jpg"
imageAlt: "Two running shoes beside a training log"
tags:
  - "daily trainers"
  - "shoe basics"
categories:
  - "Shoe guides"
draft: true
---
```

`updatedDate`, `image`, and `imageAlt` are optional. When `image` is set, `imageAlt` is required. Article-owned images should be stored under `public/blog/` and referenced with a root-relative path such as `/blog/daily-trainer-guide.jpg`.

4. Write the article below the closing frontmatter delimiter. The article layout already supplies the page-level heading, so begin sections with `##` and use `###` for subsections.
5. Keep `draft: true` while editing. Drafts are excluded from the public index, static route list, and article pages.
6. Run `npm run lint` and `npm run build`. The build fails with a clear error if required frontmatter is invalid, a date is not `YYYY-MM-DD`, a slug does not match its file name, or a duplicate slug exists.
7. Set `draft: false`, confirm the dates and visible copy, rebuild, and commit the article to publish it with the next deployment.

Published posts are ordered newest first using `publishedDate`. `updatedDate` should only change for meaningful editorial revisions.

## Article formatting

Standard Markdown headings, paragraphs, lists, links, blockquotes, code, images, and tables use the shared article styles. Links beginning with `/` are internal Next.js links. External links open in a new tab with safe relationship attributes.

The table of contents is generated automatically from `##` and `###` headings. Keep heading text unique, descriptive, and stable so bookmarked section links continue to work.

Use the reusable callout when a qualification needs extra visibility:

```mdx
<Callout title="Data note" tone="info">
  Explain the limitation or context here.
</Callout>
```

`tone` may be `info` or `warning`.

## Embed current shoe data

Reference a stable database slug instead of copying specifications, prices, or affiliate URLs into prose:

```mdx
<ShoeCardBySlug slug="shoe-slug" />
```

The server component loads the current public shoe record, current specifications, and active retailer links through the existing data-access layer. If the shoe is unavailable or Supabase is not configured, the article shows a safe empty state.

## Embed a current ranking

Reference the ranking category slug and optionally limit the preview length:

```mdx
<RankingPreview category="daily-trainer" limit={3} />
```

The preview resolves the newest published snapshot for that category. It does not copy or freeze current ranks in the article. Historical claims should be written as explicitly dated editorial prose instead of using a live component.

## Editorial and commercial rules

- Never paste affiliate URLs into MDX. Manage them through `shoe_retailer_links`.
- Never copy a mutable current score or price into an article when a live component is appropriate.
- Do not imply hands-on testing, performance evidence, or medical guidance that does not exist.
- Clearly label demo data and sample content.
- Link evaluation claims to `/methodology` where helpful.
- Use descriptive internal link text to connect articles with `/shoes`, `/rankings`, and related guides.
- Keep the component allowlist small. Add a shared component to `mdx-components.tsx` only when multiple articles need it.

## Implementation map

- `content/blog/`: article source files
- `lib/content/blog.ts`: file discovery, frontmatter validation, ordering, headings, and related-post selection
- `mdx-components.tsx`: allowed global MDX elements and live content components
- `components/content/`: article layout, cards, table of contents, and database-backed embeds
- `app/(site)/blog/page.tsx`: published article index
- `app/(site)/blog/[slug]/page.tsx`: reusable article route and metadata
- `next.config.ts`: official Next.js MDX integration and heading IDs

The sample route is `/blog/demo-how-running-shoe-match-uses-live-data`.
