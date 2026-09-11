# Rankings Architecture

## Goal

Running Shoe Match will publish frequently updated, category-specific shoe rankings based on structured data and a deterministic methodology. Ranking calculations must live outside React components and must not use an LLM.

No ranking algorithm is implemented yet. The database provides versioned
`ranking_runs` and `ranking_results` storage, and the public ranking pages now
render published snapshots and derive movement from their stored history.

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

`/rankings` loads every active category from Supabase. `/rankings/[slug]` is one
reusable page template backed by a category and its selected published snapshot;
there is no separate React page per category.

Examples:

- `/rankings/best-daily-trainers`
- `/rankings/best-cushioned-running-shoes`
- `/rankings/best-stability-running-shoes`

The page model should support category copy, methodology links, current ranked items, prior-position comparisons, relevant shoe links, publication date, and appropriate disclosures.

## Implemented public query model

`lib/data/rankings.ts` owns public ranking queries and history derivation. Page
components do not contain raw Supabase queries or movement calculations.

For a category page, the data layer:

1. Resolves the active category by slug.
2. Selects the newest two published ranking runs that contain a result for that category.
3. Loads the newest run's results in rank order with public shoe, brand, and active retailer-link data.
4. Loads the prior run's shoe/rank pairs when that run exists.
5. Joins prior ranks by `shoe_id` and derives upward, downward, unchanged, or new-entry movement.

Movement is never stored as a separate field. A positive improvement is
`previous rank - current rank`; a shoe missing from the previous snapshot is
shown as `NEW`. When no previous snapshot exists, the UI identifies the current
run as the first published snapshot rather than labeling every shoe new.

The page model exposes numeric component scores already preserved in
`ranking_results.component_scores`; the UI does not generate unsupported prose
or claims from those values. Affiliate calls to action are resolved from current
retailer-link rows and remain independent of the immutable ranking snapshot.

Seeded development data is detected from its explicit demo markers. In
development mode, ranking pages show a prominent notice that the fixtures are
not official rankings.

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

The current data-access functions use one-hour Next.js cache profiles and
ranking-specific cache tags. Active category slugs are prerendered at build
time, while the reusable dynamic route can render newly introduced slugs on
demand. A future authorized publication action should invalidate `rankings`,
`ranking-categories` when category state changes, and the affected
`ranking-{slug}` tag so the newest published run becomes visible immediately.

Publishing requires no page redesign: insert a new `ranking_run`, insert its
category results, validate the draft, and transition the run to `published`.
The next data refresh selects it as current and compares it with what was
previously current.

## Deferred decisions

The actual score formula, source weighting, category rules, publication cadence, tie policy, correction policy, and minimum data-quality thresholds remain future implementation decisions.
