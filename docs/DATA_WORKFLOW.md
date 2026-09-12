# Spreadsheet data workflow

Running Shoe Match is maintained from master spreadsheets exported as UTF-8 CSV files. Imports run locally with a server-only Supabase secret. The website reads the database rows, so no React page is created per shoe, retailer offer, or ranking.

## Before every import

Keep these values only in `.env.local`:

```dotenv
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SECRET_KEY=sb_secret_REPLACE_ME
```

Apply reviewed migrations before using a new importer:

```powershell
npx supabase db push
```

Copy the relevant file from `data/templates/` into `data/imports/`. Preserve the headers and export calculated spreadsheet values, not formulas. Always dry-run the exact file you intend to apply.

## Current importer audit

| Workflow | Dry run | Apply/publish | Validation and safe updates | Repeat behavior | Report |
| --- | --- | --- | --- | --- | --- |
| Shoes | `npm run import:shoes -- file.csv --dry-run` | `npm run import:shoes -- file.csv --apply` | Full CSV, row, duplicate slug, brand, publication, and database checks; slug is the update identity | Same slug and values are skipped | Markdown |
| Shoe metrics | `npm run import:metrics -- file.csv --dry-run` | `npm run import:metrics -- file.csv --apply` | Full CSV, v1 vocabulary, score, source, verification, duplicate identity, and shoe checks; non-public observations can update | Same version identity and values are skipped | Markdown |
| Retailer links | `npm run import:retailer-links -- file.csv --dry-run` | `npm run import:retailer-links -- file.csv --apply` | Full CSV, URL, price, shoe, retailer, duplicate relationship, and primary-link checks; creation/updates are transactional | Same shoe/retailer and values are skipped | Markdown |
| Ranking snapshots | `npm run import:rankings -- file.csv --dry-run` | `npm run import:rankings -- file.csv --apply` | Full CSV, shoe/category, score, duplicate, and rank-sequence checks; draft creation is transactional | Same semantic snapshot returns the existing run | Markdown |
| Ranking publication | Not applicable | `npm run rankings:publish -- <ranking-run-id>` | Database locks and revalidates the draft in one transaction | Repeating publication is a no-op | Terminal |

Reports are written to ignored `data/imports/reports/`. A dry run reads the database but never writes. Shoe and metric importers validate the complete file before writes; if a later database operation fails, successful row operations remain listed and the corrected file can be re-run safely. Retailer-link and ranking applies are all-or-nothing database transactions.

## A. Adding new shoes

1. Copy `data/templates/shoes-import-template.csv`.
2. Add one row per shoe with a stable unique slug.
3. Keep `is_public=false` during import and review.
4. Run:

```powershell
npm run import:shoes -- data/imports/new-shoes.csv --dry-run
npm run import:shoes -- data/imports/new-shoes.csv --apply
```

The importer creates a missing brand only when its normalized name and slug do not conflict with an existing brand.

## B. Updating existing shoes

Export a complete shoe row with the same stable slug and desired values, then run the same dry-run/apply pair. Empty optional typed cells clear those current fields, except documented legacy weight fields that the current CSV does not own. A slug change creates a different shoe and requires deliberate migration planning.

## C. Adding or updating metric scores

Use one row per observation in `data/templates/shoe-metrics-import-template.csv`:

```powershell
npm run import:metrics -- data/imports/shoe-metrics.csv --dry-run
npm run import:metrics -- data/imports/shoe-metrics.csv --apply
```

The identity is `(shoe_slug, metric_key, effective_date, metric_version, data_source)`. Reusing it updates a non-public observation. A public observation is immutable; correct it with a new effective date or metric version. Missing metrics remain absent rows, never zeroes.

## D. Adding or updating affiliate links

Use one row per shoe/retailer relationship in `data/templates/retailer-links-import-template.csv`:

```powershell
npm run import:retailer-links -- data/imports/retailer-links.csv --dry-run
npm run import:retailer-links -- data/imports/retailer-links.csv --apply
```

The identity is `(shoe_slug, retailer_slug)`. Reimporting that pair updates its URLs, price, currency, primary flag, active flag, and verification date rather than creating a duplicate.

For an existing retailer, use its exact current name and slug, set `create_retailer=false`, and leave retailer creation fields blank. To create a missing retailer deliberately, set `create_retailer=true` and provide `retailer_homepage_url` and `retailer_active`. Retailer creation and links commit together.

Only one active primary retailer link is permitted per shoe. To change it, include both relationships: set the old one to `is_primary=false` and the new one to `is_primary=true`.

Never put affiliate URLs in React components, MDX, or client-side configuration.

## E. Importing ranking snapshots

Use the complete snapshot format in `data/templates/rankings-import-template.csv`:

```powershell
npm run import:rankings -- data/imports/2026-10-rankings.csv --dry-run
npm run import:rankings -- data/imports/2026-10-rankings.csv --apply
```

Apply creates one draft run and all results atomically. It never changes an earlier run. Record the returned UUID.

## F. Publishing rankings

Review the draft in `/admin/rankings` or Supabase, then publish explicitly:

```powershell
npm run rankings:publish -- <ranking-run-id>
```

Public category pages select the newest published run containing that category. Drafts never appear publicly, and published history is immutable.

## G. Making a shoe public

| Workflow state | Database representation | Public site |
| --- | --- | --- |
| Imported | `is_public=false`; specs may be `unverified` or `development_demo` | Hidden |
| Reviewed | `is_public=false`; specs are `source_checked` or `cross_checked` with `spec_verified_at` | Hidden |
| Public | `is_public=true` and reviewed-spec requirements still pass | Visible |

Use two deliberate shoe-file updates:

1. Set the verification status/date while retaining `is_public=false`; dry-run and apply.
2. After final review, change only `is_public` to `true`; dry-run and apply again.

The importer and database both reject a real public shoe with unverified or demo specifications. `status=active` never publishes a shoe. A public retailer offer also requires an active link and active retailer. Metrics have independent public and verification fields.

## H. Correcting bad data

- Catalog fact: reimport the shoe with the same slug.
- Non-public metric: reimport the same metric identity.
- Public metric: add a new dated/versioned observation.
- Retailer link: reimport the same shoe/retailer pair. Use `active=false` to withdraw it without deleting the relationship.
- Published ranking: create and publish a corrected snapshot. Never edit published history.

## I. Reimporting the same CSV

Run the dry run again after each apply. Clean repeats report unchanged shoe, metric, and retailer-link rows as `skipped`. Ranking repeats return the existing run by content hash. If a repeat reports updates, compare it with the last applied export before applying.

## Routine validation

```powershell
npm run db:validate:linked
npm test
npm run lint
npm run build
```

Use `npm run db:validate` for local Supabase. The read-only admin pages show catalog visibility, specification review, metric counts, retailer-link counts, and ranking status.
