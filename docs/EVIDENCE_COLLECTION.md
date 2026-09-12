# Pilot Evidence Collection

This workflow collects source-backed evidence for the 12-shoe pilot before any evaluative or use-case score is proposed. Evidence collection does not publish shoes, create rankings, determine quiz weights, or authorize a metric score.

## Files and row grain

| File | Purpose | Row meaning |
| --- | --- | --- |
| `data/templates/pilot-evidence-template.csv` | Reusable evidence collection contract | One source about one exact shoe model/version |
| `data/pilot/pilot-evidence.csv` | Working evidence log for the 12 pilot shoes | One verified source about one pilot shoe |
| `data/pilot/pilot-evidence-coverage.csv` | Source coverage and gap report | One pilot shoe |
| `data/templates/metric-review-template.csv` | Later scoring review worksheet | One shoe/metric review |

Do not add an evidence row merely because a source is expected to exist. Verify the source, exact model/version, and URL or stable reference first.

## Evidence log columns

| Column | Rule |
| --- | --- |
| `shoe_slug` | Must match the canonical imported shoe slug. |
| `evidence_source_name` | Use the publisher or official source name. |
| `source_tier` | Use one approved tier value defined below. |
| `source_url_or_reference` | Record the direct page URL or another stable reference. Do not use a search-results URL. |
| `evidence_date` | Publication or test date when explicitly available. Leave blank when unknown. |
| `evidence_type` | Classify what the evidence actually is. |
| `objective_facts_observed` | Concisely list relevant facts. Preserve units and test conditions. |
| `reviewer_observations` | Paraphrase relevant wear-test observations and their context. |
| `metrics_informed` | Pipe-separated approved metric keys the evidence may inform. Blank means the row is objective context only. |
| `evidence_summary` | Concise paraphrase of why the evidence matters. |
| `conflicts_or_disagreements` | Describe material disagreement with another source. Blank means none has been identified, not that consensus has been proven. |
| `reviewer_notes` | Record applicability limits, model ambiguity, or collection caveats. |
| `collected_by` | Name or stable reviewer identifier. |
| `collection_date` | Date the evidence was checked in `YYYY-MM-DD` format. |

Use `|` between multiple metric keys. Do not create metric scores in the evidence log.

## Controlled values

### Source tiers

- `tier_0_manufacturer`: official manufacturer identity, specifications, construction, and intended-use information
- `tier_1_independent_lab`: RunRepeat standardized laboratory evidence when available
- `tier_2_structured_expert_wear_test`: Doctors of Running structured expert wear testing
- `tier_3_independent_wear_test_consensus`: Believe in the Run or comparable approved independent wear-test evidence
- `other_reviewed`: a source accepted through an explicit documented review outside the frozen hierarchy

`other_reviewed` is not a shortcut around source approval. Explain its role in `reviewer_notes`.

### Evidence types

- `objective_specification`
- `construction_information`
- `independent_lab_measurement`
- `structured_expert_wear_test`
- `independent_wear_test`
- `long_term_durability_observation`

Choose the type that matches the evidence used. A source may require separate rows if it contains materially different evidence collected or reviewed at different times.

## Source hierarchy and roles

### Tier 0 — Manufacturer

Use official manufacturer material primarily for objective facts, exact model identity, construction, and published intended use. Manufacturer marketing claims must not determine subjective metrics.

### Tier 1 — RunRepeat

Use verified RunRepeat pages for standardized independent lab measurements when available. Preserve the reported measurement, unit, method context, and exact model. A lab value may strongly inform a relevant metric but does not automatically become its score.

Examples:

- measured energy return may inform `energy_return`, not automatically `responsiveness`
- measured stack may inform cushioning context, not automatically `cushioning`
- measured stiffness may inform `flexibility` or ride context, not automatically workout or racing suitability

### Tier 2 — Doctors of Running

Use verified Doctors of Running coverage as the primary structured expert wear-test source. Capture the relevant context for ride, stability, transition, comfort, versatility, longer runs, workouts, racing, and intended use.

### Tier 3 — Believe in the Run

Use verified Believe in the Run coverage as additional independent wear-test evidence. It may strengthen or challenge consensus but should not single-handedly determine a subjective score when reasonable corroboration exists.

## Consistent collection procedure

For each pilot shoe:

1. Confirm the exact model/version and canonical slug in `pilot-shoes.csv`.
2. Check the coverage report before researching so existing work is not duplicated.
3. Open the direct source page and verify that it covers the exact model/version.
4. Add one evidence-log row only after verification.
5. Paraphrase the relevant evidence. Do not copy review prose except for a very short phrase needed to preserve a technical distinction.
6. Record objective values with their original units and conditions. Do not silently convert or reconcile them with manufacturer values.
7. List only metrics the evidence can reasonably inform. Source role does not establish a score.
8. Record conflicts explicitly, including context that may explain them.
9. Update the coverage row and its review date.
10. Leave unknown fields blank or marked `not_checked` as appropriate. Never use zero to represent unknown coverage.

## Copyright and paraphrasing

Evidence summaries must be concise paraphrases. Record the direct source URL so a reviewer can inspect the original context. Do not paste paragraphs, reproduce review tables, or assemble multiple short quotations that substitute for the source. Use a very short quotation only when exact wording is necessary and keep it clearly attributed.

## Coverage report

The coverage report has one row per pilot shoe and tracks:

- verified manufacturer source presence
- RunRepeat status
- Doctors of Running status
- Believe in the Run status
- verified independent wear-test source count
- major evidence gaps

Allowed source status values are:

- `not_checked`: availability has not been investigated
- `available`: an exact-model source was verified and logged
- `not_found`: a reasonable check was completed but no exact-model source was found
- `model_mismatch`: a source exists but covers a different version or ambiguous model

Do not treat `not_checked` as `not_found`. Leave `independent_wear_test_source_count` blank until source availability has been checked. Once checked, count distinct verified Tier 2 and Tier 3 wear-test sources for the exact model. Tier 0 manufacturer material and Tier 1 lab evidence do not count as independent wear-test sources.

The 12 manufacturer entries currently marked `yes` were copied from the already reviewed Stage 1 pilot records. All three independent-source statuses begin as `not_checked`; no availability claim has been fabricated.

## Conflict handling

- Preserve each source's value, unit, method, and context.
- Do not overwrite manufacturer specifications with laboratory measurements.
- Do not average conflicting observations blindly.
- Note whether size, surface, pace, distance, temperature, runner mechanics, or test duration may explain disagreement.
- Carry unresolved conflicts into the metric review worksheet.
- A major unresolved conflict normally lowers confidence and triggers second review.

## Handoff to metric review

Evidence collection and scoring are separate stages. After a shoe has useful coverage:

1. Create a row in `metric-review-template.csv` for each metric being considered.
2. Link or summarize the relevant evidence rows.
3. Decide whether evidence is sufficient under `docs/SCORING_METHODOLOGY.md`.
4. Leave `proposed_score` blank when evidence is insufficient.
5. If a score is proposed, use a five-point increment and categorical confidence.
6. Apply the conditional second-review rule.

No evidence-log or coverage value is itself a metric score.

## Completion criteria for collection

Evidence collection for a shoe is ready for scoring review when:

- every coverage status has been deliberately checked
- every claimed available source has a corresponding evidence row
- summaries are concise paraphrases with direct references
- applicable metrics are identified without assigning scores
- material conflicts and major gaps are recorded
- independent wear-test source count matches the verified evidence rows

Readiness for scoring review does not mean every metric must be scoreable. Unknown metrics remain unknown.
