# Importing Shoe Data

The import workflow is a local, server-side tool. It is not bundled into the website and never sends a privileged Supabase credential to browser code.

Operational catalog data uses three spreadsheet-friendly CSV files:

- `data/templates/shoes-import-template.csv`: one row per shoe for catalog facts and typed objective specifications.
- `data/templates/shoe-metrics-import-template.csv`: one row per versioned evaluative or use-case observation.
- `data/templates/retailer-links-import-template.csv`: one row per current shoe/retailer relationship.

This split keeps common facts queryable without adding a column for every future evaluation. `docs/METRICS.md` defines the frozen Metric Vocabulary Version 1 contract.

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
brand,model_name,slug,model_version,model_year,status,gender,is_public,msrp,currency,release_date,short_description,full_description,primary_image_url,spec_primary_surface,spec_support_category,spec_manufacturer_support_label,spec_weight_value,spec_weight_unit,spec_weight_reference_size,spec_weight_reference_category,spec_heel_to_toe_drop_mm,spec_general_stack_height_mm,spec_heel_stack_height_mm,spec_forefoot_stack_height_mm,spec_available_widths,spec_source_name,spec_source_url,spec_verified_at,spec_verification_status,spec_notes
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
| `spec_primary_surface` | No | `road`, `trail`, `track`, or `hybrid` → `shoes.primary_surface` |
| `spec_support_category` | No | `neutral`, `stability`, or `motion_control`; never infer this automatically from marketing copy |
| `spec_manufacturer_support_label` | No | Manufacturer wording preserved as written, such as `Balanced` or `Structured`; it never populates canonical support |
| `spec_weight_value` | Required with unit | Positive manufacturer-listed numeric value; no unit conversion |
| `spec_weight_unit` | Required with value | `g` or `oz`, matching the manufacturer's original measurement |
| `spec_weight_reference_size` | Required with weight | Preserve the stated size, e.g. `US 9`; do not convert |
| `spec_weight_reference_category` | Required with weight | `men`, `women`, `unisex`, or `not_stated` |
| `spec_heel_to_toe_drop_mm` | No | -10–40 millimetres |
| `spec_general_stack_height_mm` | No | 1–100 millimetres when the source publishes one stack value without identifying heel and forefoot |
| `spec_heel_stack_height_mm` | No | 1–100 millimetres |
| `spec_forefoot_stack_height_mm` | No | 1–100 millimetres |
| `spec_available_widths` | No | Pipe-separated manufacturer codes/labels, e.g. `B|D|2E|4E` |
| `spec_source_name` | Required when any objective spec is present | Source name, usually the manufacturer/product specification page |
| `spec_source_url` | No | Complete source URL when one exists |
| `spec_verified_at` | Required unless status is `unverified` | Date checked, `YYYY-MM-DD` |
| `spec_verification_status` | Yes | `unverified`, `source_checked`, `cross_checked`, or `development_demo` |
| `spec_notes` | No | Source differences, sample-size caveats, or verification notes |

Objective fields are typed columns because they are common filters and comparison facts. Manufacturer-published weight, drop, stack, MSRP, release date, and widths take precedence in v1. Independent measurements must later be imported separately rather than replacing these fields. `shoes.specs` remains available for less-common supplemental facts but is not populated from arbitrary CSV JSON. The importer preserves existing supplemental JSON when updating a shoe.

Prefer manufacturer-listed men's US size 9 weight when available. For women-only, unisex, or differently referenced listings, preserve the actual stated value, unit, size, and category. Do not mathematically convert weight. A future comparison service may derive normalized grams or ounces at read/calculation time, but it must leave the stored source measurement unchanged. The legacy `weight_oz` and `weight_reference` database columns remain readable and are preserved during updates; the current CSV contract does not populate them.

`spec_manufacturer_support_label` and `spec_support_category` are independent. Entering a manufacturer label does not assign canonical support. A human reviewer must enter `neutral`, `stability`, or `motion_control` explicitly when evidence and project policy support it.

A general stack value belongs only in `spec_general_stack_height_mm`. Do not copy it into heel or forefoot fields. Leave those cells blank unless the source explicitly identifies them. One provenance record for the objective specification set is sufficient for v1.

A public shoe row is rejected by the importer when specifications are `unverified` or `development_demo`. Publication remains separate from status: `active` does not automatically mean public.

## Metric CSV: one row per observation

Keep this exact header order:

```text
shoe_slug,metric_key,metric_kind,value,unit,source_type,data_source,source_reference,effective_date,metric_version,confidence,verification_status,notes,is_public
```

| Column | Required | Format / behavior |
| --- | --- | --- |
| `shoe_slug` | Yes | Existing shoe slug |
| `metric_key` | Yes | Exact approved Metric Vocabulary Version 1 key from `docs/METRICS.md` |
| `metric_kind` | Yes | `evaluative` or `use_case`; never an objective spec |
| `value` | Yes | Canonical numeric score from 0–100 for both metric kinds |
| `unit` | Yes | Must be `score_0_100` |
| `source_type` | Yes | `manufacturer`, `review`, `lab_test`, `editorial_assessment`, `derived_methodology`, or `development_demo` |
| `data_source` | Yes | Human-readable source or methodology name |
| `source_reference` | Required for any reviewed status | Durable URL, report ID, or methodology document reference |
| `effective_date` | Yes | Valid `YYYY-MM-DD` |
| `metric_version` | Yes | Must begin `metric-v1:`, e.g. `metric-v1:editorial-v1` |
| `confidence` | No | 0–1; leave empty during the pilot unless a rubric is approved later |
| `verification_status` | Yes | `unverified`, `source_checked`, `cross_checked`, `methodology_reviewed`, or `development_demo` |
| `notes` | No | Interpretation/test-context notes |
| `is_public` | Yes | Boolean; use `false` during pilot review |

Use-case metrics accept only editorial, derived-methodology, or development source types. Public metrics must be source checked, cross checked, or methodology reviewed. The importer rejects public unverified/demo metrics.

The importer never generates metric rows for empty spreadsheet cells. Omit an unassessed metric entirely. An explicit `0` remains a real assessed zero.

Metric idempotency uses `(shoe_slug, metric_key, effective_date, metric_version, data_source)`, matching the database uniqueness rule. Public observations are immutable. Correct or supersede them with a new date or method version; do not rewrite history.

## Retailer-link CSV: one row per shoe/retailer

Keep this exact header order:

```text
shoe_slug,retailer,retailer_slug,retailer_homepage_url,create_retailer,retailer_active,affiliate_url,regular_url,displayed_price,currency,is_primary,active,last_verified_at
```

| Column | Required | Format / behavior |
| --- | --- | --- |
| `shoe_slug` | Yes | Existing shoe slug |
| `retailer` | Yes | Exact display name for the existing or requested retailer |
| `retailer_slug` | Yes | Stable retailer identifier; normalized to lowercase hyphens |
| `retailer_homepage_url` | For creation | Complete `http://` or `https://` homepage |
| `create_retailer` | Yes | `false` normally; `true` explicitly authorizes creation when missing |
| `retailer_active` | For creation | Required boolean only when creating the retailer |
| `affiliate_url` | Yes | Current complete affiliate destination |
| `regular_url` | No | Non-affiliate destination when available |
| `displayed_price` | No | Nonnegative price; currency symbols and commas accepted |
| `currency` | Yes | Three-letter uppercase code such as `USD` |
| `is_primary` | Yes | Whether this is the preferred current offer |
| `active` | Yes | Whether the link is eligible to appear publicly |
| `last_verified_at` | No | Date the destination/price was checked, `YYYY-MM-DD` |

```powershell
npm run import:retailer-links -- data/imports/retailer-links.csv --dry-run
npm run import:retailer-links -- data/imports/retailer-links.csv --apply
```

The identity is `(shoe_slug, retailer_slug)`, so URL and price changes update the existing relationship. Complete-file validation failure prevents all writes, and apply commits missing-retailer creation plus link changes in one transaction. Missing retailers are never created implicitly: set `create_retailer=true` and provide the homepage and active state. Only one active primary link is allowed per shoe; when changing it, include both the old relationship with `is_primary=false` and the new one with `is_primary=true`.

## Spreadsheet and CSV rules

- Save UTF-8 comma-separated CSV; do not rename an `.xlsx` file to `.csv`.
- Do not rename, delete, add, or reorder headers.
- Quote cells containing commas, quotation marks, or line breaks; spreadsheet export normally does this.
- Format all dates as `YYYY-MM-DD` to avoid locale ambiguity.
- Use decimal points for numeric values.
- Separate manufacturer width codes/labels with `|`, not commas. Compact codes such as `b`, `d`, `2e`, and `4e` normalize to uppercase.
- Empty optional shoe cells intentionally clear current typed fields on update. Legacy `weight_oz` and `weight_reference` values are carried forward because they are absent from the new CSV contract.
- A missing metric is represented by no metric row, never a zero placeholder.
- Do not include formulas; export their calculated values.
- Do not include retailer or affiliate URLs in shoe or metric CSV files. Use the retailer-link CSV.

Whitespace is trimmed, repeated whitespace is collapsed, slugs are normalized, and numeric text is parsed. Duplicate normalized shoe slugs and duplicate metric identities in one file are rejected before writes.

## Reports and failure behavior

Every import attempt writes a Markdown report under `data/imports/reports/` with added, updated, skipped, invalid, and error counts. Reports are ignored by Git. Complete-file CSV and row validation occurs before database mutations. Row-level database errors retain their source line numbers.

## Importer tests and fictional fixture

`data/imports/demo-shoes-import.csv` contains three fictional, non-public shoes solely for importer testing. `data/imports/demo-shoe-metrics-import.csv` contains two fictional, non-public Metric Vocabulary Version 1 observations for a shoe created by the development seed. `data/imports/demo-retailer-links-import.csv` contains fictional `.example` destinations for local importer and idempotency testing.

```powershell
npm run test:import
npm run import:shoes -- data/imports/demo-shoes-import.csv --dry-run
npm run import:metrics -- data/imports/demo-shoe-metrics-import.csv --dry-run
npm run import:retailer-links -- data/imports/demo-retailer-links-import.csv --dry-run
```

See `docs/DATA_WORKFLOW.md` for publication states, corrections, and the complete recurring operating sequence.

The repository includes a non-public 12-shoe objective pilot under `data/pilot/`. It has not been imported or published. No evaluative scores, use-case scores, ranking weights, or real ranking results are included.
