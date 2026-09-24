# Ranking snapshot imports

Ranking updates use a local, server-side CSV workflow. One CSV represents one complete ranking snapshot (`ranking_run`) and may contain several ranking categories. Imports always create a **draft**. Publication is a separate, explicit command.

There are now two supported ways to create the snapshot:

- calculate it from versioned source inputs with `rankings:generate` using `overall-score-v1`
- import a fully prepared snapshot CSV with `import:rankings`

The automated path is documented in `AUTOMATED_RANKINGS.md`. The manual snapshot importer remains available for reviewed corrections, other methodology versions, and migrations from an external ranking workbook.

The scripts load `.env.local` locally and require:

```dotenv
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SECRET_KEY=REPLACE_ME_WITH_SERVER_ONLY_SECRET_KEY
```

Never use the publishable key as `SUPABASE_SECRET_KEY`, never prefix the secret with `NEXT_PUBLIC_`, and never commit `.env.local`.

## CSV contract

Start with `data/templates/rankings-import-template.csv`. Keep the header names unchanged.

| Column | Required | Rules |
| --- | --- | --- |
| `run_name` | Yes | Human-readable snapshot name; repeat the exact value on every row. |
| `effective_date` | Yes | Valid `YYYY-MM-DD`; repeat it on every row. |
| `methodology_version` | Yes | Deterministic methodology identifier; repeat it on every row. |
| `run_notes` | No | Snapshot-wide notes; repeat the exact value, including blank, on every row. |
| `category_slug` | Yes | Existing, active `ranking_categories.slug`. Categories are never created implicitly. |
| `shoe_slug` | Yes | Existing `shoes.slug`. |
| `rank` | Yes | Positive integer. Each category must contain unique, contiguous ranks `1..N`. |
| `score` | Yes | Number from `0` through `100`, inclusive. |
| `component_scores_json` | No | JSON object whose snake-case keys map to numeric scores from `0` through `100`. |
| `result_notes` | No | Editorial/import note stored in the result metadata. |

Spreadsheet programs escape JSON quotes by doubling them. For example, the visible JSON `{"fit":91,"ride":90}` is represented in CSV as:

```csv
"{""fit"":91,""ride"":90}"
```

All run-level fields must match across every row. The importer rejects duplicate shoes, duplicate ranks, gaps in rank sequences, invalid scores, malformed component scores, missing shoes, and missing/inactive categories before it writes anything.

If a category is intentionally new, create it first through a reviewed migration or future admin workflow. The importer deliberately does not invent categories from spelling mistakes.

## First-time database setup

Apply the Phase 12 migration before using the commands:

```powershell
npx supabase db push
```

For a local Supabase stack, `npx supabase db reset` applies all migrations and the development seed.

## Monthly or weekly workflow

1. Copy the template into `data/imports/` and fill in the full ranking snapshot.
2. Run a dry run. It validates the entire file and checks every database reference without writing.

   ```powershell
   npm run import:rankings -- data/imports/2026-10-rankings.csv --dry-run
   ```

3. Fix every reported problem and repeat the dry run until it succeeds.
4. Create the draft in one transaction:

   ```powershell
   npm run import:rankings -- data/imports/2026-10-rankings.csv --apply
   ```

5. Record the returned ranking run UUID and review the draft in Supabase. Confirm its categories, counts, ranks, scores, effective date, methodology version, and notes.
6. Publish only after approval:

   ```powershell
   npm run rankings:publish -- <ranking-run-id>
   ```

The public ranking pages automatically select the newest published run containing each category. A draft never appears publicly. Publication is irreversible through this workflow because published runs and results are protected by database immutability triggers.

## Safety and repeat behavior

- The normalized snapshot receives a SHA-256 `import_hash`.
- Reimporting the same semantic content returns the existing run and skips all rows, even if CSV row order changed.
- Reusing the same run name and effective date for different content is rejected instead of overwriting history.
- The import database function creates the run and every result in one PostgreSQL transaction. Any failure rolls back the whole operation.
- The publish database function locks, validates, and publishes one run in one transaction.
- Old published runs are never overwritten, preserving movement calculations and historical rankings.
- Human-readable reports are written to ignored `data/imports/reports/` files.

## Demo file

`data/imports/demo-rankings-import.csv` contains six fictional results across the two Phase 7 demo categories. It is clearly labeled DEVELOPMENT/DEMO data and contains no real claims.

With the development seed loaded:

```powershell
npm run import:rankings -- data/imports/demo-rankings-import.csv --dry-run
```

Do not publish demo data to production.

## Tests

```powershell
npm run test:import
npx supabase test db --local supabase/tests/database
```

The TypeScript tests cover normalization, invalid scores, duplicate shoes, duplicate ranks, sequencing, missing references, and stable repeat-import hashes. The pgTAP suite exercises transactional draft creation, repeat imports, failed-import rollback, permissions, publication, repeat publication, and post-publication immutability.
