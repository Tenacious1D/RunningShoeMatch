# Automated rankings: Overall Score v1

**Status:** implemented. The generator creates a draft only. It never publishes automatically.

This workflow reproduces the score system from the original Rankings 2026 workbook while moving calculation, validation, history, and publication into the backend. The methodology identifier is `overall-score-v1`.

## Formula

Every eligible shoe receives three 0-100 component scores with equal weight:

```text
Final score = (Retailer Feedback Score + Popularity Score + Specification Feature Score) / 3
```

### Retailer Feedback Score (RFS)

Approved rating sources are:

- Running Warehouse
- Fleet Feet
- Zappos
- Marathon Sports
- Road Runner Sports

For a shoe with total current review count `N` and review-count-weighted rating `R`:

```text
Weighted rating = sum(source rating * source review count) / N
Bayesian rating = (N * R + 100 * 4.0) / (N + 100)
RFS = 25 * (Bayesian rating - 1)
```

The prior is 100 reviews at 4.0 stars, matching the workbook method. At least one approved source with a positive review count is required.

### Popularity Score (PS)

```text
Review volume = 70 * ln(1 + shoe review count) / ln(1 + maximum review count)
Availability = 30 * recognized active retailer count / 7
PS = Review volume + Availability
```

The maximum review count is recalculated across the eligible scoring population on each run. The seven availability channels are Running Warehouse, Road Runner Sports, Fleet Feet, REI, Dick's Sporting Goods, Zappos, and Amazon. Marathon Sports contributes ratings but is not an availability channel. A brand website is not counted.

### Specification Feature Score (SFS)

Each dimension awards 0, 1, or 2 points; the point total is multiplied by 10.

| Dimension | 2 points | 1 point | 0 points |
| --- | --- | --- | --- |
| Weight | below 9.5 oz | 9.5 to below 10.4 oz | 10.4 oz or more |
| Fit | great | ok | bad |
| Cushion | plush | balanced | firm |
| Recency | effective year or prior year | two years before effective year | older |
| MSRP | below $130 | $130 to below $160 | $160 or more |

Manufacturer weight is not altered in the database. The generator derives ounces in memory when the source unit is grams, solely to apply these established thresholds. MSRP must be USD for v1.

### Ranking and ties

Shoes are ordered by:

1. final score, descending
2. total current review count, descending
3. shoe slug, ascending as a deterministic final fallback

The same overall score is used in every category for which a human reviewer explicitly marked the shoe eligible. Category membership is not inferred.

## Data freshness

- Target: observations no more than 30 days old
- Warning: older than 45 days
- Exclusion: older than 90 days

For each shoe/source, the newest qualifying observation on or before the ranking effective date is used. Future observations are ignored. Historical observations remain stored.

## Required data and exclusions

A shoe is excluded from generation when it lacks any of:

- at least one current approved rating observation with reviews
- unit-aware weight or compatible legacy ounce weight
- reviewed fit classification
- reviewed cushion classification
- model year or release date
- USD MSRP
- at least one reviewed category eligibility relationship

Exclusion is safer than inventing or defaulting missing data.

## Spreadsheet workflow

Apply migrations first:

```powershell
npx supabase db push
```

Import dated retailer rating observations:

```powershell
npm run import:ranking-reviews -- data/imports/my-ranking-reviews.csv --dry-run
npm run import:ranking-reviews -- data/imports/my-ranking-reviews.csv --apply
```

Import human-reviewed fit, cushion, and category eligibility:

```powershell
npm run import:ranking-inputs -- data/imports/my-ranking-inputs.csv --dry-run
npm run import:ranking-inputs -- data/imports/my-ranking-inputs.csv --apply
```

Generate and inspect a draft:

```powershell
npm run rankings:generate -- --effective-date 2026-10-01 --dry-run
npm run rankings:generate -- --effective-date 2026-10-01 --apply
```

An optional run name may be supplied:

```powershell
npm run rankings:generate -- --effective-date 2026-10-01 --name "October 2026 automated rankings" --apply
```

Generation calls the existing transactional snapshot importer. Identical generated content resolves to the existing snapshot instead of creating a duplicate. The result remains `draft`.

After reviewing the run, publish explicitly:

```powershell
npm run rankings:publish -- <ranking-run-id>
```

Publishing keeps all older runs. Public pages select the newest published run and derive movement from the previous published snapshot.

## Approved categories

The additive migration registers these slugs:

`neutral-road`, `stability-road`, `race-road`, `light-trail-hybrid`, `technical-trail`, `cross-country-spikes`, `distance-spikes`, `daily-trainers`, `long-distance-road`, `lightweight-trainers`, `speed-trainers`, `motion-control-road`, `wide-fit-road`, `budget-road`, `premium-road`, `distance-trail`, `racing-trail`, `cushion-trail`, `waterproof-trail`, `racing-flats-road`, `mid-distance-spikes`, and `sprint-spikes`.

## Versioning

Never silently change thresholds, priors, sources, weights, freshness, or tie rules under `overall-score-v1`. A semantic change requires a new methodology version, new tests, updated documentation, and new versioned input rows. Existing snapshots remain unchanged.
