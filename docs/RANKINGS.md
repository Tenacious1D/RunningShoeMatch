# Rankings Architecture

## Goal

Running Shoe Match will publish frequently updated, category-specific shoe rankings based on structured data and a deterministic methodology. Ranking calculations must live outside React components and must not use an LLM.

No ranking algorithm is implemented yet. The database now provides versioned `ranking_runs` and `ranking_results` storage for future deterministic output.

## Ranking concepts

- Ranking definition: the stable category identity, slug, eligibility rules, and methodology reference.
- Ranking calculation: a deterministic evaluation of eligible shoes using a versioned ruleset and a known data state.
- Ranking snapshot: an immutable published result for a definition and publication period.
- Ranking snapshot item: the position, shoe, score, and supporting explanation captured in that publication.


## Implemented persistence model

`ranking_categories` holds stable category identities. `ranking_runs` is the version/snapshot boundary for an effective date and methodology version, and one run may contain multiple categories. `ranking_results` joins a run, category, and shoe and stores total score, rank, version-specific component scores, and supporting metadata.

A shoe is unique within each run/category. Rank values are intentionally not unique until the tie policy is decided. Published runs and their results are protected by database triggers from insertion, update, or deletion; a new month is always a new run. Public RLS policies expose only published runs and results whose category and shoe are also public.

## Publication flow

```text
Structured shoe and feedback data
        ↓
Eligibility rules
        ↓
Versioned ranking engine
        ↓
Draft result and validation
        ↓
Immutable published snapshot
        ↓
Public ranking page
```

Draft calculation and public publication should be separate actions. Admins must be able to review data quality before a snapshot becomes visible.

## Historical integrity

Never overwrite a prior published ranking to represent the latest month. Add a new snapshot and retain older snapshots.

Historical records should allow the application to determine:

- Current and previous position
- Position change over a chosen comparison period
- New entries and shoes that left the ranking
- The methodology/ruleset version used
- The effective or publication date

This enables labels such as “#4 this month” and “#7 last month” without relying on fragile cached page content.

Corrections to published history require an explicit policy. Prefer a traceable replacement or revision record over silent mutation.

## Engine boundary

The future ranking engine should be a framework-independent TypeScript module. It should consume typed shoe/category inputs and a ruleset, then return ordered results and score explanations. It must not import React or issue database queries.

Data-access and publication services should orchestrate loading candidates, invoking the engine, validating results, and writing a snapshot transactionally.

## Category pages

`/rankings/[slug]` will be one reusable page template backed by a ranking definition and selected published snapshot. Do not create a separate React page per category.

Examples:

- `/rankings/best-daily-trainers`
- `/rankings/best-cushioned-running-shoes`
- `/rankings/best-stability-running-shoes`

The page model should support category copy, methodology links, current ranked items, prior-position comparisons, relevant shoe links, publication date, and appropriate disclosures.

## Scoring transparency

Published items should preserve enough structured output to explain a placement. The UI should display useful factors without exposing irrelevant implementation complexity or inventing prose not supported by the calculation.

Methodology changes require a version change and documentation update. A new methodology should not retroactively rewrite older snapshot scores.

## Affiliate independence

Affiliate relationships must not silently determine ranking order. Ranking output references shoes; the presentation layer separately resolves currently active retailer offers.

Do not store affiliate URLs inside ranking snapshots, React components, or MDX. This avoids corrupting historical rank data when retailer links change.

## Admin workflow

Future admin capabilities may include:

1. Select a ranking definition and target publication period.
2. Refresh or verify input data.
3. Run a draft calculation.
4. Review exclusions, warnings, ties, and missing fields.
5. Publish the snapshot in one transaction.
6. Trigger page revalidation as needed.

Publication must require server-side authorization and should record who published it and when.

## Validation and tests

Before publication, validate:

- Exactly one position per included shoe
- No duplicate shoes or positions
- Positions are contiguous unless the methodology explicitly supports ties
- All items belong to the snapshot and reference valid shoes
- Input and ruleset versions are recorded
- Required page and explanation fields are present

Unit tests should cover eligibility, scoring boundaries, tie-breaking, missing data, and deterministic ordering. Integration tests should cover snapshot publication and previous-position comparison.

## SEO and caching

Ranking pages should expose stable canonical URLs and route-specific metadata derived from the same ranking definition shown on the page. Use server rendering or static generation with explicit revalidation after publication.

Include visible publication/update dates. Structured data may be added later when the page model and claims are finalized.

## Deferred decisions

The actual score formula, source weighting, category rules, publication cadence, tie policy, correction policy, and minimum data-quality thresholds remain future implementation decisions.