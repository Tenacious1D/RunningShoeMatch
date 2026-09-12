# Metric Vocabulary Version 1

**Status: approved and frozen for the pilot import.** This document defines the v1 shoe attribute and metric vocabulary. It does not define ranking weights, quiz questions, personalized match weights, or a recommendation formula.

## Data classes

| Class | Meaning | Storage |
| --- | --- | --- |
| Objective specification | Manufacturer-published product fact | Typed columns on `shoes`; uncommon supplemental facts may remain in `shoes.specs` |
| Evaluative metric | Versioned evaluation of a shoe characteristic | `shoe_metrics` with `metric_kind = evaluative` |
| Use-case metric | Versioned editorial suitability score for a named use | `shoe_metrics` with `metric_kind = use_case` |

`ranking_results.score` is a general category ranking score. A future `ShoeMatchResult.matchScore` will be personalized to a runner. Neither is a shoe metric.

## Universal score interpretation

All v1 evaluative and use-case metrics use a numeric 0–100 scale:

| Score | Interpretation |
| --- | --- |
| 0 | Extremely low or essentially absent |
| 25 | Below average |
| 50 | Average |
| 75 | Clearly above average |
| 100 | Exceptional or extreme relative to the running-shoe comparison universe |

These anchors describe position in the running-shoe comparison universe. They do not mean every higher value is preferable for every runner. Missing values mean unknown or not assessed and are represented by no metric row. Never store zero to stand in for missing data.

## Approved evaluative metrics

| `metric_key` | Plain-English meaning | Type and range | Is higher always better? | Missing value |
| --- | --- | --- | --- | --- |
| `cushioning` | Perceived amount of impact-softening and protection | Numeric 0–100 | No; needs and preferences differ | No row |
| `stability` | Perceived guidance and resistance to unwanted motion | Numeric 0–100 | No; more support is not right for everyone | No row |
| `responsiveness` | How quickly and directly the ride reacts to force | Numeric 0–100 | Contextual | No row |
| `flexibility` | How readily the shoe bends through the stride | Numeric 0–100 | No | No row |
| `durability` | Expected resistance to wear under intended use | Numeric 0–100 | Generally | No row |
| `comfort` | Overall underfoot and upper comfort in the stated evaluation context | Numeric 0–100 | Generally, but subjective | No row |
| `ground_feel` | Degree to which the runner can feel the surface | Numeric 0–100 | No | No row |
| `energy_return` | Perceived or measured rebound and returned energy | Numeric 0–100 | Contextual | No row |
| `value` | Editorial value relative to price, performance, and expected useful life | Numeric 0–100 | Generally | No row |

## Approved use-case metrics

| `metric_key` | Plain-English meaning | Type and range | Is higher always better? | Missing value |
| --- | --- | --- | --- | --- |
| `daily_training` | Suitability for routine everyday running | Numeric 0–100 | Yes, for this use only | No row |
| `long_run` | Suitability for sustained mileage while maintaining comfort, protection, stability, and ride quality. High cushioning alone does not guarantee a high score. | Numeric 0–100 | Yes, for this use only | No row |
| `speed_workout` | Suitability for intervals, tempo runs, and faster workouts | Numeric 0–100 | Yes, for this use only | No row |
| `racing` | Suitability for performance-oriented race efforts. V1 does not split this by race distance. | Numeric 0–100 | Yes, for this use only | No row |
| `walking` | Suitability for walking use | Numeric 0–100 | Yes, for this use only | No row |
| `beginner` | How forgiving and broadly usable the shoe is for a relatively inexperienced runner. Consider ease of use, stability, comfort, durability, versatility, and whether specialized running mechanics are required. | Numeric 0–100 | Yes, for this use only | No row |
| `heavier_runner` | How well the shoe is expected to maintain cushioning, structure, stability, ride quality, and durability under increased loading. V1 does not use a hard bodyweight threshold. | Numeric 0–100 | Yes, for this use only | No row |

Use-case scores are editorial suitability assessments, not personalized match scores and not ranking weights.

## Objective vocabulary

### Controlled classifications

- `primary_surface`: `road`, `trail`, `track`, or `hybrid`.
- `support_category`: `neutral`, `stability`, or `motion_control`.

`manufacturer_support_label` separately preserves manufacturer wording such as `Balanced` or `Structured`. Do not infer canonical support automatically from that label or other marketing copy. A human reviewer must assign `support_category` explicitly; the manufacturer label may be present while canonical support remains unknown.

### Manufacturer specifications

Manufacturer-published values take precedence in v1 for:

- `weight_value` with `weight_unit`
- `heel_to_toe_drop_mm`
- `general_stack_height_mm`
- `heel_stack_height_mm`
- `forefoot_stack_height_mm`
- `msrp` and `currency`
- `release_date`
- `available_widths`

Independent or laboratory measurements added later must be separate versioned observations. They must not silently replace manufacturer values.

### Weight reference

Prefer manufacturer-listed men's US size 9 weight when available. Preserve the original manufacturer measurement in:

- `weight_value`, the positive numeric value as published.
- `weight_unit`: `g` or `oz`.
- `weight_reference_size`, preserving text such as `US 9` exactly.
- `weight_reference_category`: `men`, `women`, `unisex`, or `not_stated`.

For women-only shoes, unisex shoes, or products without men's US size 9 data, preserve the published value, unit, and reference. Do not mathematically convert weight between units, sizes, or categories during import. A weight cannot be imported without its unit and both reference fields.

A future normalized comparison layer may derive a common unit for calculations. That derived value must not overwrite `weight_value`, `weight_unit`, or the source reference. Any persisted normalized measurement requires a separate documented field or versioned observation.

The legacy `weight_oz` and `weight_reference` columns remain only for historical compatibility. The current importer preserves existing values during unrelated updates but does not populate them for new imports.

### Stack height

Use `general_stack_height_mm` only when the manufacturer publishes one stack value without identifying heel and forefoot. Never copy a general value into `heel_stack_height_mm` or `forefoot_stack_height_mm`. Those fields remain absent unless the source explicitly names the respective measurement.

### Widths

Store actual manufacturer width codes or labels. CSV values use `|` as the delimiter, for example `B|D|2E|4E`. Recognized compact codes are normalized to uppercase. Descriptive manufacturer labels are preserved after whitespace cleanup. Do not reduce stored widths to narrow, standard, wide, or extra-wide categories.

An empty width list means widths were not recorded. It does not imply standard width only.

## Provenance and confidence

One provenance record per objective specification set is sufficient for v1:

- `spec_source_name`
- `spec_source_url`
- `spec_verified_at`
- `spec_verification_status`
- `spec_notes`

Per-field specification provenance is intentionally deferred. Use `spec_notes` to document a material source caveat during the pilot.

Metric provenance remains versioned per observation through `source_type`, `data_source`, `source_reference`, `effective_date`, and `metric_version`. Confidence remains optional. Do not fabricate a confidence score when no approved rubric exists.

## Publication requirements

A real shoe may become public only after its core identity and objective specification set pass the verification workflow. The allowed public specification states are `source_checked` and `cross_checked`. Explicit development fixtures remain separately identifiable through demo metadata.

Metrics may remain partially unknown. A public metric row must have an allowed reviewed verification state; an unverified metric may remain internal. Missing metrics must never be generated merely to make a shoe publishable.

## Metric import contract

- Use only the approved key for the selected `metric_kind`.
- Store the canonical score in `value` and use `unit = score_0_100`.
- The v1 CSV does not include `normalized_value`; the database column remains for historical compatibility.
- For real v1 rows, `metric_version` must start with `metric-v1:`, followed by a method version such as `metric-v1:editorial-v1`.
- `confidence` is optional.
- No CSV row means unknown/not assessed. A row with `value = 0` is an explicit, assessed zero.

## Future vocabulary versions

Never redefine a v1 key in place. To change meaning, range, or key membership:

1. Create `docs/METRICS_V2.md` or a clearly versioned successor document.
2. Use a new prefix such as `metric-v2:` in `metric_version`.
3. Add a new migration that replaces the vocabulary constraint with a rule accepting both historical v1 rows and approved v2 rows.
4. Update importer constants and templates in the same change.
5. Add new metric rows; do not update or delete public v1 observations.

This preserves historical ranking inputs and lets old and new methodologies coexist without silently changing what a stored score means.
