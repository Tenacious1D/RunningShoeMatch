# Application Architecture

## Purpose

Running Shoe Match helps runners discover suitable running shoes using structured shoe data and a guided recommendation quiz. Its core product will be a deterministic matching and ranking engine. Shoe recommendations must not depend on an LLM.

This document describes the intended architecture. It does not mean every route or module is implemented today.

## Current foundation

- Next.js App Router with TypeScript
- Tailwind CSS
- Supabase clients based on `@supabase/ssr`, with server-only configuration and development connectivity diagnostics
- Version-controlled initial PostgreSQL schema, RLS policies, and pgTAP database tests under `supabase/`
- Typed public catalog models and server-only query modules under `lib/data/`
- Data-driven shoe catalog, reusable shoe detail route, and affiliate retailer presentation
- Data-driven ranking-category routes with snapshot selection and derived historical movement
- Repository-managed MDX blog with validated frontmatter and live database-backed shoe/ranking embeds
- Local TypeScript CSV import tools for shoes, metrics, retailer links, and rankings with schema validation, explicit dry-run/apply modes, readable reports, and server-only privileged credentials
- Transactional ranking-snapshot imports with content-based idempotency and a separate explicit publication operation
- Typed, framework-independent matching contracts with intentionally non-operational engine stubs
- Supabase Auth-backed private admin foundation with database-enforced administrator membership
- Route metadata, stable production canonicals, a data-driven sitemap, and crawler exclusions for private/development routes
- File-system routing under `app/`
- npm for package management

The repository does not currently contain quiz logic, the ranking engine, or official production catalog/ranking data. Fictional development fixtures and one clearly labeled demo article are available for application testing.

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
| `/affiliate-disclosure` | Affiliate relationship disclosure | Static |
| `/privacy` | Privacy-policy placeholder | Static |
| `/contact` | Contact-method placeholder | Static |

Example ranking slugs include `best-daily-trainers`, `best-cushioned-running-shoes`, and `best-stability-running-shoes`.

## Admin routes

`/admin`, `/admin/shoes`, `/admin/rankings`, and `/admin/imports` form a private,
read-only operational area. It exposes publication/review state, metric and
retailer-link counts, and draft/published ranking summaries. `/admin/login` uses the existing browser Supabase
client for password authentication. The protected route-group layout and every
admin data-access function call the centralized `lib/admin/auth.ts` authorization
boundary on the server.

Authentication and authorization are separate checks:

1. `supabase.auth.getClaims()` verifies the cookie-backed Supabase session.
2. The authenticated client selects its own row from `public.admin_users`.
3. If either check fails, protected routes redirect to `/admin/login`.
4. Admin queries still run with the user's publishable-key session and remain
   subject to grants and RLS; the web application never uses the service key.

Database policies call a private `SECURITY DEFINER` membership helper to let an
allowlisted user read operational rows, including drafts and non-public catalog
records. No browser role receives admin write privileges in this phase.

Future tools may manage shoes, affiliate links, imports, ranking data, and
ranking publication, but each mutation must re-run server authorization and add
an explicit least-privilege database policy or server-only transaction.

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

### Current public data access

Public catalog reads are implemented in `lib/data/shoes.ts`,
`lib/data/rankings.ts`, and `lib/data/retailers.ts`. These server-only modules
return application-facing models from `lib/data/types.ts`; React components do
not issue raw Supabase queries. A dedicated anonymous server client in
`lib/supabase/public.ts` uses only the publishable key, so public reads remain
subject to the same grants and RLS policies as any other anonymous request.

Public shoe and ranking data is cached for one hour with tag boundaries for
shoes, metrics, rankings, categories, and retailers. Future admin publication
workflows should invalidate the relevant tags after reviewed changes.
Cookie-backed Supabase clients remain separate for future authenticated areas.

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
- MDX stores stable editorial prose and database slugs; current product data, ranks, prices, and affiliate URLs remain in Supabase and are resolved by server components.
- React components display data but are not a source of truth for shoes, rankings, or retailer URLs.
- Ranking publications are immutable snapshots rather than mutable current-rank fields.

See `DATABASE.md`, `QUIZ.md`, `RANKINGS.md`, and `CONTENT.md` for subsystem details.

## SEO architecture

The current SEO foundation includes:

- Server rendering or static generation according to freshness needs
- Route-specific metadata and canonical URLs
- A generated `sitemap.xml` containing static pages, published MDX articles, public shoes, and active ranking categories
- A generated `robots.txt` that excludes admin, authentication, development, and design-system routes
- A stable production canonical origin of `https://runningshoematch.com`
- Structured data remains future work, after production page models and claims are approved
- Intentional internal links among shoes, rankings, methodology, and articles
- Stable, human-readable slugs

Dynamic shoe and ranking routes must generate their visible content and metadata from the same authoritative record. Individual shoe pages must use a reusable template; do not create a separate React page for each shoe.

## Visual design system

Public pages share their site shell through the `app/(site)/` route group. The private admin area and its password-recovery routes remain outside that group. Unused Supabase starter tutorial, signup, and generic protected routes have been removed.

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

The current application does not implement quiz logic, the ranking algorithm,
admin mutation tools, browser uploads, or analytics. The public shoe catalog,
ranking snapshots, MDX article embeds, and private admin summaries are
read-only and data-driven.

The recurring spreadsheet procedure is documented in `docs/DATA_WORKFLOW.md`.
Retailer-link creation and updates use a service-role-only transactional
database function; public pages read those links through anonymous
RLS-protected data access.
