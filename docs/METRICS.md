# Shoe Attribute and Metric Vocabulary

> **Status: proposal for review.** The keys, scales, and definitions in this document are not approved production methodology. Review the decisions at the end of this document before importing real metrics. No quiz weights are defined here.

## Three distinct data classes

| Class | Meaning | Storage | Examples |
| --- | --- | --- | --- |
| Objective specification | A manufacturer/specification-style fact about the product | Typed columns on `shoes` for common facts; `shoes.specs` only for uncommon supplemental facts | listed weight, drop, heel/forefoot stack, MSRP, release date, widths |
| Evaluative metric | A versioned observation or judgment from reviews, testing, or an RSM evaluation method | `shoe_metrics` with `metric_kind = evaluative` | cushioning, stability, responsiveness, durability |
| Use-case score | A versioned derived/editorial suitability assessment | `shoe_metrics` with `metric_kind = use_case` | daily training suitability, long-run suitability |

`ranking_results.score` is a category ranking score. A future `ShoeMatchResult.matchScore` will be personalized to one runner. Neither belongs in `shoe_metrics`, and neither should be inferred from the proposal below.

## Objective specification vocabulary

These are current typed shoe fields, not `metric_key` values.

| Field | Plain-English meaning | Type / unit | Accepted range or values | Is higher always better? | Missing-value handling |
| --- | --- | --- | --- | --- | --- |
| `msrp` | Manufacturer suggested retail price for the catalog record | Decimal money with `currency` | 0 or greater | No | `null` means unknown; never assume free |
| `release_date` | Announced or actual release date | ISO date | Valid `YYYY-MM-DD` | Not applicable | `null` means unknown |
| `primary_surface` | Main intended surface classification | Text key | Taxonomy to approve; e.g. `road`, `trail`, `track` | Not applicable | `null` means unclassified |
| `support_category` | Manufacturer/catalog support classification | Text key | Taxonomy to approve; e.g. `neutral`, `stability` | No | `null` means unclassified, not neutral |
| `weight_oz` | Listed weight of the referenced sample/variant | Decimal ounces | 0.1–40 | No; lighter is not universally better | `null` means unknown |
| `weight_reference` | Exact sample context for listed weight | Text | Example format: `Men's US 9` | Not applicable | Required in practice whenever weight is supplied |
| `heel_to_toe_drop_mm` | Listed heel-to-forefoot height difference | Decimal millimetres | -10–40 | No | `null` means unknown |
| `heel_stack_height_mm` | Listed heel stack height | Decimal millimetres | 1–100 | No | `null` means unknown |
| `forefoot_stack_height_mm` | Listed forefoot stack height | Decimal millimetres | 1–100 | No | `null` means unknown |
| `available_widths` | Width options for this catalog record | Array of normalized text keys | Pipe-separated in CSV; taxonomy to approve | No | Empty array means not recorded, not standard-only |

All typed objective specifications share a provenance block on the shoe: `spec_source_name`, optional `spec_source_url`, `spec_verified_at`, `spec_verification_status`, and `spec_notes`. If different facts require materially different sources, explain that in `spec_notes`; split-source provenance can be normalized later if the pilot demonstrates that it is common.

## Proposed evaluative metric vocabulary

The pilot proposal uses a canonical 0–100 scale for RSM evaluations. Higher describes **more of the named quality**, which is not always universally better. Do not fill a score merely because the key exists.

| Proposed `metric_key` | Plain-English meaning | Data type / allowed range | Is higher always better? | Missing-value handling |
| --- | --- | --- | --- | --- |
| `cushioning` | Perceived amount of impact-softening/protection | Numeric 0–100 | No; preference and use matter | No row = unknown/not assessed |
| `stability` | Perceived guidance and resistance to unwanted motion | Numeric 0–100 | No; more support is not right for everyone | No row = unknown/not assessed |
| `responsiveness` | How quickly and directly the ride reacts to force | Numeric 0–100 | Contextual | No row = unknown/not assessed |
| `flexibility` | How readily the shoe bends through the stride | Numeric 0–100 | No | No row = unknown/not assessed |
| `durability` | Expected resistance to wear under intended use | Numeric 0–100 | Generally yes | No row = unknown/not assessed |
| `comfort` | Overall underfoot/upper comfort under the stated test context | Numeric 0–100 | Generally yes, but subjective | No row = unknown/not assessed |
| `ground_feel` | Degree to which the runner can feel the surface | Numeric 0–100 | No | No row = unknown/not assessed |
| `energy_return` | Perceived or measured rebound/energy return | Numeric 0–100 | Generally yes for performance, still contextual | No row = unknown/not assessed |
| `value_for_money` | Editorial value relative to price and performance | Numeric 0–100 | Generally yes | No row = unknown/not assessed |

For an RSM 0–100 observation, use `value` for the canonical score and `unit = score_0_100`; leave `normalized_value` empty. `normalized_value` remains available when a legitimate external source scale must be retained in `value` and separately converted. The conversion method must be versioned and documented before use.

## Proposed use-case vocabulary

Use-case values are suitability scores on a 0–100 scale. Higher means more suitable for the named use under the documented methodology; it does not mean the shoe is objectively better overall.

| Proposed `metric_key` | Plain-English meaning | Data type / allowed range | Is higher always better? | Missing-value handling |
| --- | --- | --- | --- | --- |
| `daily_training_suitability` | Suitability for routine everyday running | Numeric 0–100 | Yes, for this use only | No row = unknown/not assessed |
| `long_run_suitability` | Suitability for longer-duration training runs | Numeric 0–100 | Yes, for this use only | No row = unknown/not assessed |
| `speed_workout_suitability` | Suitability for intervals, tempo, and faster workouts | Numeric 0–100 | Yes, for this use only | No row = unknown/not assessed |
| `racing_suitability` | Suitability for racing under the defined distance/context | Numeric 0–100 | Yes, for this use only | No row = unknown/not assessed |
| `walking_suitability` | Suitability for walking use | Numeric 0–100 | Yes, for this use only | No row = unknown/not assessed |
| `beginner_suitability` | Suitability for the methodology's defined beginner profile | Numeric 0–100 | Yes, for this use only | No row = unknown/not assessed |
| `heavier_runner_suitability` | Suitability for the methodology's defined heavier-runner context | Numeric 0–100 | Yes, for this use only | No row = unknown/not assessed |

Terms such as “beginner,” “long run,” race distance, and “heavier runner” need operational definitions before these scores can be produced. These scores are not quiz weights and should not be treated as personalized match scores.

## Metric row contract

- `metric_key`: stable lowercase underscore key whose meaning must not silently change.
- `metric_kind`: `evaluative` or `use_case`; objective facts are not accepted here.
- `value`: source- or methodology-scale numeric observation.
- `normalized_value`: optional 0–100 conversion when preserving a different raw source scale.
- `unit`: declares the scale, such as `score_0_100`.
- `source_type`: `manufacturer`, `review`, `lab_test`, `editorial_assessment`, `derived_methodology`, or `development_demo`.
- `data_source`: human-readable source or methodology name.
- `source_reference`: durable URL, report identifier, or methodology document reference.
- `effective_date`: date the observation/version applies.
- `metric_version`: definition or measurement-method version, not the shoe model version.
- `confidence`: optional 0–1 assessment of evidence quality; the rubric must be approved before real use.
- `verification_status`: `unverified`, `source_checked`, `cross_checked`, `methodology_reviewed`, or `development_demo`.
- `notes`: context that affects interpretation, not a substitute for provenance.
- `is_public`: independent publication switch.

Missing metrics are represented by **no row**, not by zero. Zero is a real score at the bottom of an approved scale. Consumers must treat absence as unknown/not assessed and must not silently impute it. A future matching method must explicitly define its own missing-data behavior.

## Versioning and corrections

Metric identity is `(shoe, metric_key, effective_date, metric_version, data_source)`. Public observations are immutable. Correct or supersede a public value with a new effective date or method version so historical ranking inputs remain reproducible.

## Decisions required before approval

1. Approve or revise the metric keys and exact scoring anchors for 0, 25, 50, 75, and 100.
2. Approve the `primary_surface`, `support_category`, and width taxonomies.
3. Decide which weight variant is canonical for cross-shoe comparison and how gender-specific records are handled.
4. Decide whether manufacturer stack/drop or independently measured stack/drop takes precedence when they differ.
5. Define the confidence rubric, or leave confidence empty for the pilot.
6. Define every use-case context before assigning any use-case scores.
7. Decide the minimum provenance and verification level required before a row can become public.

