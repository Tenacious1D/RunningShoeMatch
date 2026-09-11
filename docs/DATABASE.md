# Database Architecture

## Current status

The first application schema is implemented as the version-controlled migration in `supabase/migrations/20260911014309_initial_running_shoe_schema.sql`. It creates eight application tables, their constraints and indexes, timestamp and immutability triggers, explicit Data API grants, and Row Level Security policies. `supabase/seed.sql` contains fictional development fixtures; it is not production content or an official ranking publication.

Supabase/PostgreSQL owns structured application data. Database access should remain isolated behind server-side data-access modules rather than scattered across routes or UI components.

## Application data-access layer

Public shoe reads are isolated in:

- `lib/data/shoes.ts` for catalog summaries, public slugs, complete shoe profiles, and latest public metrics
- `lib/data/rankings.ts` for the newest published placement per category for a shoe
- `lib/data/retailers.ts` for active shoe-specific retailer offers
- `lib/data/types.ts` for serializable application-facing models shared by server-rendered pages and the client-side recommendation modal

The data modules use `lib/supabase/public.ts`, an anonymous server-only client
configured with the public URL and publishable key. It does not use privileged
credentials or bypass RLS. Supabase response shapes are overridden explicitly
at query boundaries and then mapped from database column names to stable
application models.

The `/shoes` catalog requests only active public shoes. The reusable
`/shoes/[slug]` route can display any public lifecycle state so discontinued or
upcoming shoes degrade gracefully instead of disappearing unexpectedly. Shoe
detail queries compose current metrics, ranking placements, and retailer offers
through the data layer. The same returned model is passed to the development
recommendation-modal example, preserving one source of truth for shoe data.

## Schema overview

| Table | Purpose | Public visibility |
| --- | --- | --- |
| `brands` | Normalized shoe manufacturers | Brands that have at least one public shoe |
| `shoes` | Canonical shoe models or audience-specific variants | Rows where `is_public = true` |
| `retailers` | Retail partner identity | Active retailers |
| `shoe_retailer_links` | Multiple shoe-specific retailer and affiliate destinations | Active links whose shoe is public and retailer is active |
| `ranking_categories` | Stable category identities | Active categories |
| `ranking_runs` | Versioned ranking publication/snapshot boundary | Published runs whose `published_at` has arrived |
| `ranking_results` | A shoe's score and position in one run/category | Results with a fully public run, category, and shoe chain |
| `shoe_metrics` | Versioned numeric inputs for matching and rankings | Reviewed public metric rows for public shoes |

## Relationships

```text
brands 1 ──── * shoes
                  ├──── * shoe_retailer_links * ──── 1 retailers
                  ├──── * shoe_metrics
                  └──── * ranking_results * ──── 1 ranking_categories
                                      └───────── 1 ranking_runs
```

Foreign-key delete behavior is intentional:

- Deleting a shoe cascades to its retailer links and metrics because those rows cannot exist independently.
- Shoes referenced by ranking results cannot be deleted, preserving historical rankings.
- Draft ranking runs may be deleted and cascade to their results; published runs are protected by an immutability trigger.
- Brands, retailers, categories, and ranked shoes use restrictive references where history or normalized identity must be preserved.

## Relational and flexible data boundary

Obvious universal fields remain typed and queryable: slugs, lifecycle/publication state, prices, dates, rank, total score, foreign keys, and timestamps.

The schema uses JSONB only for bounded areas expected to evolve:

- `shoes.specs`: descriptive manufacturer specifications that are not yet universal enough to deserve columns
- `shoes.metadata`: miscellaneous non-ranking data
- `ranking_results.component_scores`: methodology-version-specific score breakdowns
- `ranking_results.metadata`: supporting calculation provenance or display data

Every JSONB field is constrained to a JSON object. Metrics do not use an opaque JSON blob because ranking and quiz code will need to filter and compare them efficiently.

## Shoe metrics

`shoe_metrics` is an append-oriented, versionable observation table. Each row stores:

- A stable `metric_key`, such as a future cushioning or responsiveness key
- A source-scale numeric `value`
- An optional normalized 0–100 value for cross-shoe comparisons
- An optional unit
- A required data source and optional source reference
- An effective date and metric-definition version
- Optional confidence from 0–1 and notes
- An explicit public-review flag

The unique key `(shoe_id, metric_key, effective_date, metric_version, data_source)` prevents accidental duplicate observations while allowing the same shoe and metric to evolve across dates, definitions, and sources. New metric types require new rows rather than destructive column migrations. Public metric rows are immutable; corrections create a new dated/versioned row.

## Ranking snapshots and monthly history

A `ranking_run` is a publication snapshot that can contain multiple categories. Its `effective_date` identifies the ranking period and `methodology_version` identifies the deterministic ruleset. Each `ranking_result` connects one run, one category, and one shoe with a total score, rank, component breakdown, and provenance metadata.

The unique `(ranking_run_id, ranking_category_id, shoe_id)` constraint prevents a shoe from appearing twice in the same category/run. Rank itself is not unique yet because the tie policy remains a future methodology decision.

Monthly history is stored by inserting a new run and results instead of editing the prior month:

```text
September 2026 ranking run
  ├── Daily Trainer results
  └── Stability results

October 2026 ranking run
  ├── Daily Trainer results
  └── Stability results
```

Once a run transitions from draft to published, database triggers prevent its update or deletion and prevent inserting, updating, moving, or deleting its results. This makes comparisons such as “#4 this month” and “#7 last month” reproducible from stored snapshots.

## Affiliate-link model

A shoe can have multiple `shoe_retailer_links`. The link table stores the affiliate URL, optional regular URL and displayed price, currency, active and primary state, and verification time. A partial unique index permits only one active primary offer per shoe while allowing multiple alternate retailer links.

Affiliate URLs never belong on shoes, ranking results, React components, or MDX articles. Ranking output references the shoe; presentation resolves currently active offers separately.

## Security and Row Level Security

RLS is enabled on all eight tables in the exposed `public` schema. Grants and policies are both explicit:

- `anon` and `authenticated` receive only `SELECT` table privileges.
- They receive no insert, update, delete, truncate, reference, or trigger privileges.
- Row policies further restrict reads to public/published records and public relationship chains.
- No public write policies exist.
- `service_role` receives explicit table access for future trusted server operations and still bypasses RLS, so its secret key must remain server-only.

Future admin writes must add server-side authentication and authorization. They must not add broad browser write grants or expose `SUPABASE_SECRET_KEY`.

## Timestamp and integrity handling

Mutable tables have `created_at` and `updated_at`. A shared trigger maintains `updated_at` in PostgreSQL so every write path behaves consistently. Historical metric observations use `created_at` and immutable published rows instead of an `updated_at` workflow.

Constraints validate slug and metric-key formats, allowed lifecycle states, ISO-style currency codes, nonnegative prices, score and confidence ranges, JSON object shapes, publication state consistency, and relationship uniqueness.

## Connection configuration

The application keeps the starter's current `@supabase/ssr` browser, server, and proxy clients. Public access uses `NEXT_PUBLIC_SUPABASE_URL` with `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

Future trusted admin/import processes may use `SUPABASE_URL` with `SUPABASE_SECRET_KEY` through `lib/supabase/config.ts`. The secret key must never be imported into Client Components, sent to a browser, logged, committed, or prefixed with `NEXT_PUBLIC_`.

The development-only `/dev/database` route validates the configured project endpoint without showing credentials.

## Migration and validation workflow

The repository uses imperative, timestamped migrations under `supabase/migrations/`. Never make an unrecorded dashboard-only schema change.

The Supabase CLI is pinned as a development dependency. With a Docker-compatible container runtime running:

```bash
npx supabase start
npx supabase db reset --local
npm run db:validate
npx supabase test db --local supabase/tests/database
npx supabase db advisors --local
```

The pgTAP suites under `supabase/tests/database/` cover schema objects, read-only grants, RLS visibility, duplicate prevention, and published-history immutability.

## Development/demo seed data

`supabase/seed.sql` is the repeatable fixture source. Supabase runs it after
migrations during `db reset` because `[db.seed]` is enabled in
`supabase/config.toml`. It contains:

- 3 fictional brands
- 6 fictional running shoes
- 3 fictional retailers and 12 placeholder retailer links
- 24 fictional metric observations
- 2 demo ranking categories
- 2 dated demo ranking snapshots and 12 results

Every user-facing name or description is marked `DEVELOPMENT/DEMO`, shoe and
ranking metadata include a demo flag, and retailer destinations use reserved
`.example` domains with no tracking identifiers. Fixed UUIDs and conflict-safe
inserts make repeated execution idempotent. The file uses one transaction and
never deletes existing data. A collision guard aborts before writing if its
reserved IDs already belong to non-demo records.

Local workflows are intentionally the default:

```bash
npm run db:seed
npm run db:validate
```

`npm run db:seed` and `npm run db:validate` always use `--local`. The linked
development seed is separated because accidentally adding immutable demo ranking
snapshots to production would be difficult to undo. To seed a linked development
project from PowerShell:

```powershell
$env:RSM_ALLOW_LINKED_DEMO_SEED = "YES"
npm run db:seed:linked
Remove-Item Env:RSM_ALLOW_LINKED_DEMO_SEED
npm run db:validate:linked
```

The linked seed wrapper refuses to run without the confirmation variable and
also requires the linked project reference to match the project URL in
`.env.local`. The confirmation is authorization for one shell session, not a
credential, and should be removed immediately afterward.

`supabase/validation/validate_database.sql` is read-only and raises an error if
shoe-brand references, slug uniqueness, ranking references, ranking-result
uniqueness, or active retailer-link references are invalid. A successful run
prints one `PASS` row for each invariant.

Before applying to the hosted project, authenticate and link the CLI, review the pending migration, then push it deliberately. Do not paste database passwords or access tokens into source files or chat.

## Deferred decisions

The actual metric catalog, score formula, source weighting, official ranking-category taxonomy, tie policy, correction/revision workflow, and analytics retention remain future decisions. Add them through reviewed migrations when requirements are known.
