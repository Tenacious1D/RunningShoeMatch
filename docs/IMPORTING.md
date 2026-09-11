# Importing Shoe Data

The import workflow is a local, server-side tool. It is not bundled into the website and never sends a privileged Supabase credential to browser code.

Real shoe data uses two spreadsheet-friendly CSV files:

- `data/templates/shoes-import-template.csv`: one row per shoe for catalog facts and typed objective specifications.
- `data/templates/shoe-metrics-import-template.csv`: one row per versioned evaluative or use-case observation.

This split keeps common facts queryable without adding a column for every future evaluation. Read `docs/METRICS.md` before preparing pilot data; its starter vocabulary is still a proposal.

## Configure secure credentials

Add these server-only values to `.env.local`:

```dotenv
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SECRET_KEY=sb_secret_REPLACE_ME
```

Use the project URL and secret key from Supabase project settings. Never prefix the secret key with `NEXT_PUBLIC_`. Never paste it into a CSV, report, source file, issue, or commit. `.env.local` remains ignored by Git.

Both dry runs and real imports connect to Supabase so the report can distinguish new, changed, and unchanged rows. Dry run performs reads only.

## Safe pilot workflow

1. Apply the latest database migration locally and to the intended Supabase project.
2. Copy both templates into `data/imports/` with descriptive filenames.
3. Enter catalog/specification rows with `is_public = false`.
4. Dry-run the shoe file:

```powershell
npm run import:shoes -- data/imports/pilot-shoes.csv --dry-run
```

5. Resolve every reported error, then apply the exact reviewed file:

```powershell
npm run import:shoes -- data/imports/pilot-shoes.csv --apply
```

6. Prepare metrics only after the shoe slugs exist. Dry-run and apply separately:

```powershell
npm run import:metrics -- data/imports/pilot-shoe-metrics.csv --dry-run
npm run import:metrics -- data/imports/pilot-shoe-metrics.csv --apply
```

7. Repeat each dry run. An idempotent repeat reports every unchanged row as `skipped`, with zero additions or updates.
8. Run `npm run db:validate` for local Supabase, or `npm run db:validate:linked` for the linked project.

Both import commands require exactly one of `--dry-run` or `--apply`. Omitting both prevents accidental writes.

## Shoe CSV: one row per shoe

Keep this exact header order:

```text
brand,model_name,slug,model_version,model_year,status,gender,is_public,msrp,currency,release_date,short_description,full_description,primary_image_url,spec_primary_surface,spec_support_category,spec_weight_oz,spec_weight_reference,spec_heel_to_toe_drop_mm,spec_heel_stack_height_mm,spec_forefoot_stack_height_mm,spec_available_widths,spec_source_name,spec_source_url,spec_verified_at,spec_verification_status,spec_notes
```

### Catalog columns

| Column | Required | Format / behavior |
| --- | --- | --- |
| `brand` | Yes | Manufacturer name; created automatically if missing |
| `model_name` | Yes | Display name |
| `slug` | Yes | Stable upsert identifier; normalized to lowercase hyphens |
| `model_version` | No | Manufacturer generation/version text |
| `model_year` | No | Whole year 1900–2200 |
| `status` | Yes | `active`, `discontinued`, or `upcoming` |
| `gender` | Yes | `men`, `women`, or `unisex` |
| `is_public` | Yes | Boolean; use `false` during pilot review |
| `msrp` | No | Nonnegative number; `$` and commas accepted |
| `currency` | Yes | Three-letter uppercase code such as `USD` |
| `release_date` | No | Valid `YYYY-MM-DD` |
| `short_description` | No | Brief plain text |
| `full_description` | No | Longer plain text |
| `primary_image_url` | No | Complete `http://` or `https://` URL |

### Objective specification columns

| Column | Required | Format / database destination |
| --- | --- | --- |
| `spec_primary_surface` | No | Normalized catalog key → `shoes.primary_surface` |
| `spec_support_category` | No | Normalized catalog key → `shoes.support_category` |
| `spec_weight_oz` | No | 0.1–40 → `shoes.weight_oz` |
| `spec_weight_reference` | No | Exact sample context, e.g. `Men's US 9` |
| `spec_heel_to_toe_drop_mm` | No | -10–40 millimetres |
| `spec_heel_stack_height_mm` | No | 1–100 millimetres |
| `spec_forefoot_stack_height_mm` | No | 1–100 millimetres |
| `spec_available_widths` | No | Pipe-separated normalized keys, e.g. `standard|wide|extra_wide` |
| `spec_source_name` | Required when any objective spec is present | Source name, usually the manufacturer/product specification page |
| `spec_source_url` | No | Complete source URL when one exists |
| `spec_verified_at` | Required unless status is `unverified` | Date checked, `YYYY-MM-DD` |
| `spec_verification_status` | Yes | `unverified`, `source_checked`, `cross_checked`, or `development_demo` |
| `spec_notes` | No | Source differences, sample-size caveats, or verification notes |

Objective fields are typed columns because they are common filters and comparison facts. `shoes.specs` remains available for less-common supplemental facts but is not populated from arbitrary CSV JSON. The importer preserves existing supplemental JSON when updating a shoe.

A public shoe row is rejected by the importer when specifications are `unverified` or `development_demo`. Publication remains separate from status: `active` does not automatically mean public.

## Metric CSV: one row per observation

Keep this exact header order:

```text
shoe_slug,metric_key,metric_kind,value,normalized_value,unit,source_type,data_source,source_reference,effective_date,metric_version,confidence,verification_status,notes,is_public
```

| Column | Required | Format / behavior |
| --- | --- | --- |
| `shoe_slug` | Yes | Existing shoe slug |
| `metric_key` | Yes | Stable lowercase underscore key; see the proposed vocabulary |
| `metric_kind` | Yes | `evaluative` or `use_case`; never an objective spec |
| `value` | Yes | Numeric source/methodology value; use-case values must be 0–100 |
| `normalized_value` | No | 0–100 conversion when retaining a different raw source scale |
| `unit` | No | Scale/unit such as `score_0_100` |
| `source_type` | Yes | `manufacturer`, `review`, `lab_test`, `editorial_assessment`, `derived_methodology`, or `development_demo` |
| `data_source` | Yes | Human-readable source or methodology name |
| `source_reference` | Required for any reviewed status | Durable URL, report ID, or methodology document reference |
| `effective_date` | Yes | Valid `YYYY-MM-DD` |
| `metric_version` | Yes | Definition/method version, such as `proposal-v1` |
| `confidence` | No | 0–1; leave empty until a confidence rubric is approved |
| `verification_status` | Yes | `unverified`, `source_checked`, `cross_checked`, `methodology_reviewed`, or `development_demo` |
| `notes` | No | Interpretation/test-context notes |
| `is_public` | Yes | Boolean; use `false` during pilot review |

Use-case metrics accept only editorial, derived-methodology, or development source types. Public metrics must be source checked, cross checked, or methodology reviewed. The importer rejects public unverified/demo metrics.

Metric idempotency uses `(shoe_slug, metric_key, effective_date, metric_version, data_source)`, matching the database uniqueness rule. Public observations are immutable. Correct or supersede them with a new date or method version; do not rewrite history.

## Spreadsheet and CSV rules

- Save UTF-8 comma-separated CSV; do not rename an `.xlsx` file to `.csv`.
- Do not rename, delete, add, or reorder headers.
- Quote cells containing commas, quotation marks, or line breaks; spreadsheet export normally does this.
- Format all dates as `YYYY-MM-DD` to avoid locale ambiguity.
- Use decimal points for numeric values.
- Separate widths with `|`, not commas.
- Empty optional shoe cells intentionally clear that typed field on update. Review update counts carefully.
- A missing metric is represented by no metric row, never a zero placeholder.
- Do not include formulas; export their calculated values.
- Do not include retailer or affiliate URLs. Those belong in `shoe_retailer_links`.

Whitespace is trimmed, repeated whitespace is collapsed, slugs are normalized, and numeric text is parsed. Duplicate normalized shoe slugs and duplicate metric identities in one file are rejected before writes.

## Reports and failure behavior

Every attempt writes a Markdown report under `data/imports/reports/` with added, updated, skipped, invalid, and error counts. Reports are ignored by Git. Complete-file CSV and row validation occurs before database mutations. Row-level database errors retain their source line numbers.

## Importer tests and fictional fixture

`data/imports/demo-shoes-import.csv` contains three fictional, non-public shoes solely for importer testing.

```powershell
npm run test:import
npm run import:shoes -- data/imports/demo-shoes-import.csv --dry-run
```

No real shoe specifications or arbitrary scores are included in the repository.

