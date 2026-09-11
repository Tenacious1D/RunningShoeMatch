# Application Architecture

## Purpose

Running Shoe Match helps runners discover suitable running shoes using structured shoe data and a guided recommendation quiz. Its core product will be a deterministic matching and ranking engine. Shoe recommendations must not depend on an LLM.

This document describes the intended architecture. It does not mean every route or module is implemented today.

## Current foundation

- Next.js App Router with TypeScript
- Tailwind CSS
- Supabase clients based on `@supabase/ssr`, with server-only configuration and development connectivity diagnostics
- Version-controlled initial PostgreSQL schema, RLS policies, and pgTAP database tests under `supabase/`
- File-system routing under `app/`
- npm for package management

The repository does not currently contain quiz logic, the ranking engine, seed/catalog data, or the MDX pipeline.

## Public routes

| Route | Responsibility | Intended rendering |
| --- | --- | --- |
| `/` | Product homepage and primary entry points | Static or server rendered |
| `/quiz` | Guided shoe-matching experience | Server shell with client interaction where needed |
| `/shoes` | Search and browse the shoe catalog | Server rendered with URL-based filters |
| `/shoes/[slug]` | Reusable, data-driven shoe detail page | Static generation or server rendering with revalidation |
| `/rankings` | Ranking-category landing page | Static generation or server rendering |
| `/rankings/[slug]` | Versioned ranking/category page | Static generation or server rendering with revalidation |
| `/blog` | Blog index | Static generation from repository content |
| `/blog/[slug]` | MDX article | Static generation from repository content |
| `/about` | About and high-level methodology | Static |
| `/methodology` | Detailed evaluation and ranking explanation | Static |

Example ranking slugs include `best-daily-trainers`, `best-cushioned-running-shoes`, and `best-stability-running-shoes`.

## Admin routes

`/admin` will be a private dashboard protected by server-verified authentication and authorization. Future tools may manage shoes, affiliate links, imports, ranking data, and ranking snapshot publication.

Hiding admin navigation is not authorization. Every admin page, server action, and route handler must verify the user's privileges on the server. Privileged Supabase credentials must never be included in client bundles.

## Module boundaries

Keep route components thin. Routes should compose UI and call application services; they should not contain ranking formulas, quiz scoring, or raw database queries.

The intended boundaries are:

```text
app/ and components/
        ↓
application services
        ↓
domain modules (matching and rankings)
        ↓
data-access modules
        ↓
Supabase/PostgreSQL
```

Likely future locations are:

```text
app/                    Routes, layouts, metadata, handlers
components/             Reusable presentation components
lib/matching/           Deterministic quiz matching engine
lib/rankings/           Ranking calculations and snapshot services
lib/data/               Repository/data-access functions
lib/supabase/           Supabase client construction and sessions
content/blog/           File-based MDX articles
supabase/migrations/    Version-controlled schema migrations
docs/                   Architecture and product documentation
```

These directories should be introduced only when implementation work requires them.

## Recommendation flow

```text
Quiz answers
    ↓
Runner profile
    ↓
Matching engine
    ↓
Shoe and ranking data
    ↓
Recommended shoes
```

The quiz UI owns question presentation and answer collection. A separate engine owns deterministic matching. Database access should load the candidate data before invoking the engine, allowing the UI, algorithm, and persistence layers to change independently.

## Data ownership

- Supabase/PostgreSQL owns structured application data such as shoes, attributes, retailers, affiliate links, categories, and ranking snapshots.
- Repository-managed MDX owns blog content initially.
- React components display data but are not a source of truth for shoes, rankings, or retailer URLs.
- Ranking publications are immutable snapshots rather than mutable current-rank fields.

See `DATABASE.md`, `QUIZ.md`, `RANKINGS.md`, and `CONTENT.md` for subsystem details.

## SEO architecture

The application should support:

- Server rendering or static generation according to freshness needs
- Route-specific metadata and canonical URLs
- `sitemap.xml` and `robots.txt`
- Structured data when page models are defined
- Intentional internal links among shoes, rankings, methodology, and articles
- Stable, human-readable slugs

Dynamic shoe and ranking routes must generate their visible content and metadata from the same authoritative record. Individual shoe pages must use a reusable template; do not create a separate React page for each shoe.

## Visual design system

Public pages share their site shell through the `app/(site)/` route group. Authentication and protected starter routes remain outside that group so they can evolve independently.

Reusable visual responsibilities are separated as follows:

- `app/globals.css`: semantic color variables, radius, shadows, and global typography behavior
- `tailwind.config.ts`: Tailwind mappings for those tokens
- `components/layout/`: site-wide header, footer, and width container
- `components/ui/`: generic buttons, cards, badges, and section headings
- `components/shoes/`: reusable shoe-specific presentation such as cards and scores

The `/design-system` route documents these primitives during development and returns a not-found response in production. Extend existing primitives before introducing one-off page styles or another component framework.
## Cross-cutting rules

- Validate external and user-provided data at system boundaries.
- Use server-only modules for privileged operations.
- Make accessibility and mobile layouts part of the initial implementation, not a later retrofit.
- Add tests around deterministic domain logic when those modules are introduced.
- Record schema changes in migrations and architectural changes in these documents.

## Current non-goals

The current foundation does not implement the database, quiz logic, ranking algorithm, admin tools, MDX pipeline, or analytics.