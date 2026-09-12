# Database Architecture

## Current status

The application schema is implemented through version-controlled migrations in
`supabase/migrations/`. The initial migration creates the catalog and ranking
tables; later migrations add transactional ranking imports and explicit admin
authorization. `supabase/seed.sql` contains fictional development fixtures; it
is not production content or an official ranking publication.

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
| `admin_users` | Explicit administrator allowlist tied to `auth.users` | Only an authenticated user can read its own membership row |

## Relationships

```text
brands 1 ──── * shoes
                  ├──── * shoe_retailer_links * ──── 1 retailers
                  ├──── * shoe_metrics
                  └──── * ranking_results * ──── 1 ranking_categories
                                      └───────── 1 ranking_runs

auth.users 1 ──── 0..1 admin_users
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

The unique `(ranking_run_id, ranking_category_id, shoe_id)` constraint prevents a shoe from appearing twice in the same category/run. The import and publication functions additionally require one contiguous rank sequence (`1..N`) with no duplicate ranks per category. Rank is not a table-level unique key, so any future tie policy must be introduced deliberately in the importer, publication checks, tests, and documentation.

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

### Ranking import transactions

The Phase 12 migration adds an optional unique `ranking_runs.import_hash` and two service-role-only database functions:

- `import_ranking_snapshot(...)` validates and inserts one draft run plus all of its results in a single transaction. Its SHA-256 content fingerprint makes semantic repeat imports idempotent.
- `publish_ranking_run(uuid)` locks and revalidates a draft before atomically setting `status = 'published'` and `published_at`.

Neither function is executable by `anon` or `authenticated`. The local TypeScript commands call them with the server-only secret key. Import failure rolls back the run and its results together; publication failure leaves the draft unchanged. See `RANKING_IMPORTS.md` for the operational workflow.

## Affiliate-link model

A shoe can have multiple `shoe_retailer_links`, but only one current relationship per retailer. The `(shoe_id, retailer_id)` identity lets spreadsheet reimports update a retailer's URL or price without creating duplicates. The link table stores the affiliate URL, optional regular URL and displayed price, currency, active and primary state, and verification time. A partial unique index permits only one active primary offer per shoe while allowing multiple alternate retailers.

The service-role-only `import_retailer_links(jsonb, jsonb)` function explicitly creates approved missing retailers and upserts their shoe relationships in one transaction. Anonymous and authenticated roles cannot execute it. The local TypeScript importer performs CSV, reference, name/slug, and final primary-state validation before calling the function.

Affiliate URLs never belong on shoes, ranking results, React components, or MDX articles. Ranking output references the shoe; presentation resolves currently active offers separately.

## Security and Row Level Security

RLS is enabled on all eight tables in the exposed `public` schema. Grants and policies are both explicit:

- `anon` and `authenticated` receive only `SELECT` table privileges.
- They receive no insert, update, delete, truncate, reference, or trigger privileges.
- Row policies further restrict reads to public/published records and public relationship chains.
- No public write policies exist.
- `service_role` receives explicit table access for future trusted server operations and still bypasses RLS, so its secret key must remain server-only.

### Administrator authorization

`public.admin_users.user_id` is both its primary key and a cascading foreign key
to `auth.users.id`. A row's presence is the explicit administrator grant;
signing in does not create a row and does not grant administration.

`admin_users` has RLS enabled. `authenticated` receives only `SELECT` and can
read only the row where `auth.uid() = user_id`. It receives no insert, update,
or delete grant, so an authenticated user cannot promote itself or another
account through the Data API.

`private.is_admin()` is a stable `SECURITY DEFINER` function outside the exposed
schema. It checks the current `auth.uid()` against the allowlist without causing
recursive RLS. Each application table has one anonymous public-read policy and
one consolidated authenticated-read policy. The authenticated policy combines
the same public predicate with the admin check, revealing draft/non-public
operational data only to allowlisted users while avoiding duplicate permissive
policies. Neither ordinary authenticated users nor anonymous visitors gain
additional visibility.

The web admin data layer uses the cookie-backed publishable-key client, so these
grants and policies remain authoritative. The service/secret key is reserved for
trusted CLI workflows and is never imported into admin pages or Client
Components. Future admin writes must add narrowly reviewed grants/policies or
server-only database functions and must reauthorize each request.

### Make your Supabase account an administrator

1. Create your account through Supabase Auth or the Supabase Dashboard's Auth
   Users page and confirm the email if confirmation is enabled.
2. Apply the admin migration with `npx supabase db push`.
3. In the hosted project's Supabase SQL Editor, replace the email below and run:

```sql
insert into public.admin_users (user_id, notes)
select id, 'Initial Running Shoe Match administrator'
from auth.users
where lower(email) = lower('YOUR_EMAIL@example.com')
on conflict (user_id) do nothing;
```

4. Verify the grant:

```sql
select auth_user.email, admin_user.created_at, admin_user.notes
from public.admin_users as admin_user
join auth.users as auth_user on auth_user.id = admin_user.user_id;
```

If the insert reports zero affected rows, the Auth account does not yet exist or
the email does not match. Do not put a hosted user UUID or email into a migration,
because Auth identities differ between local, preview, and production projects.
To revoke access, delete that exact `admin_users` row in the SQL Editor.

## Timestamp and integrity handling

Mutable tables have `created_at` and `updated_at`. A shared trigger maintains `updated_at` in PostgreSQL so every write path behaves consistently. Historical metric observations use `created_at` and immutable published rows instead of an `updated_at` workflow.

Constraints validate slug and metric-key formats, allowed lifecycle states, ISO-style currency codes, nonnegative prices, score and confidence ranges, JSON object shapes, publication state consistency, and relationship uniqueness.

## Connection configuration

The application keeps the starter's current `@supabase/ssr` browser, server, and proxy clients. Public access uses `NEXT_PUBLIC_SUPABASE_URL` with `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

Future trusted admin/import processes may use `SUPABASE_URL` with `SUPABASE_SECRET_KEY` through `lib/supabase/config.ts`. The secret key must never be imported into Client Components, sent to a browser, logged, committed, or prefixed with `NEXT_PUBLIC_`.

The development-only `/dev/database` route validates the configured project endpoint without showing credentials.

## Local CSV imports

Trusted catalog imports run through TypeScript scripts under `scripts/import*` and use only `SUPABASE_URL` plus the server-only `SUPABASE_SECRET_KEY` from `.env.local`. Import code is not referenced by the application bundle.

Shoe rows are validated completely before writes, matched idempotently by unique shoe slug, and associated with brands by case-insensitive name. Flexible numeric observations use a separate metric CSV and the database's existing version identity. Every run requires an explicit `--dry-run` or `--apply` mode and writes a local human-readable report.

See `IMPORTING.md` for the exact CSV contracts and operating procedure.

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

The pgTAP suites under `supabase/tests/database/` cover schema objects, read-only grants, RLS visibility, explicit admin membership, non-admin isolation, prevention of browser-side self-promotion and writes, duplicate prevention, and published-history immutability.

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

Ranking formulas, quiz/match weights, source weighting, official ranking-category taxonomy, tie policy, correction/revision workflow, and analytics retention remain future decisions. Add them through reviewed migrations when requirements are known.
## Real shoe attribute model

Phase A separates three data classes without changing ranking or future matching semantics:

- Common objective specifications are typed, queryable columns on `shoes`: surface and canonical support classifications, the manufacturer's support label, unit-aware listed weight with its exact sample reference, drop, general/heel/forefoot stack, and available widths. MSRP and release date were already relational. `spec_source_*` and `spec_verification_*` fields record provenance and review state for this specification set.
- `weight_value` and `weight_unit` preserve the manufacturer's original `g` or `oz` measurement. `weight_reference_size` and `weight_reference_category` preserve its context. The legacy `weight_oz` and `weight_reference` columns remain in place for historical compatibility, but the current importer never populates or converts into them.
- `manufacturer_support_label` preserves wording such as `Balanced` or `Structured`. It has no trigger, mapping, or importer rule that assigns `support_category`; a human reviewer owns the canonical classification.
- `general_stack_height_mm` stores a single published stack value only when the source does not identify heel and forefoot separately. It never fills either specific stack column.
- `shoes.specs` remains a JSONB object only for uncommon supplemental manufacturer facts. The CSV importer does not accept arbitrary JSON, and it preserves existing supplemental JSON during catalog updates.
- Evaluative and use-case observations remain versioned rows in `shoe_metrics`. `metric_kind` distinguishes `evaluative` from `use_case`; `source_type` and `verification_status` make provenance workflow queryable. Objective specifications do not belong in this table.

The database constraint `shoe_metrics_public_requires_verification` permits unverified internal/draft observations but rejects `is_public = true` while `verification_status = unverified`. Demo observations use the explicit `development_demo` source and verification states; missing verification is never inferred.

The approved Metric Vocabulary Version 1, score anchors, objective source rules, and missing-value policy are documented in `docs/METRICS.md`. Database constraints enforce the v1 key/kind pairs, universal 0-100 range, surface/support classifications, unit-aware weight completeness, explicit weight reference fields, and real-shoe publication state. Ranking scores remain in `ranking_results.score`; future personalized match scores remain matching-engine outputs. Neither is a shoe metric.
