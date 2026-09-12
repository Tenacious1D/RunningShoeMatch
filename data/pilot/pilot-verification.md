# Real Pilot Data Verification

Status: **Stage 1 imported into the linked Supabase project and remains non-public; Stage 2 scores are not assigned**
Verification date: **2026-09-11**

This pilot deliberately tests different uses, support systems, surfaces, price points, units, and manufacturer terminology. `pilot-shoes.csv` contains only identity and objective manufacturer data. The 12 rows have been imported into the linked project with `is_public=false`. `pilot-shoe-metrics.csv` contains its header only; evaluative and use-case scoring remains a separate Stage 2 activity.

Every pilot row has `is_public=false`. `source_checked` means the cited official page was reviewed and its supported values were transcribed. It does not mean every possible specification is present, and it does not authorize publication.

## 1. Pilot shoes selected

| Pilot role | Shoe | Why it exercises the model |
| --- | --- | --- |
| Neutral daily trainer 1 of 3 | Brooks Ghost 18 | Brooks support terminology and coded widths |
| Neutral daily trainer 2 of 3 | Saucony Ride 19 | Complete manufacturer stack pair |
| Neutral daily trainer 3 of 3 | Altra Torin 8 | Zero drop and a general stack value that cannot safely be split |
| Max-cushion trainer 1 of 2 | ASICS GEL-NIMBUS 28 | Maximum-cushion road model with incomplete typed specs |
| Max-cushion trainer 2 of 2 | New Balance Fresh Foam X Hierro v9 | Trail surface and multiple coded widths |
| Stability shoe 1 of 2 | Brooks Adrenaline GTS 25 | Manufacturer says `Structured`, exposing a taxonomy mapping decision |
| Stability shoe 2 of 2 | ASICS GEL-KAYANO 32 | Explicit manufacturer stability classification |
| Tempo/speed shoe 1 of 2 | Saucony Endorphin Speed 5 | Complete drop and stack pair |
| Tempo/speed shoe 2 of 2 | New Balance FuelCell Rebel v5 | Neutral classification with surface not explicit on the cited page |
| Racing shoe 1 of 2 | Nike Vaporfly 4 | Weight with an explicit Men's US 10 reference |
| Racing shoe 2 of 2 | adidas Adizero Adios Pro 4 | Manufacturer weight is in grams at UK 8.5 and is intentionally not converted |
| Budget-oriented trainer 1 of 1 | Saucony Cohesion 19 | Low MSRP and sparse official specifications |

These are pilot coverage labels, not rankings, recommendations, or evaluative scores.

## 2. Per-shoe verification checklist

Legend: `Yes` = explicitly verified from the cited official page; `Unknown` = not published or not safely mappable; `Review` = source terminology conflicts with or does not map exactly to the v1 vocabulary.

| Shoe | Exact model/version | Official page | MSRP | Surface | Support | Weight/reference | Drop | Heel/forefoot stack | Widths | Release date | Provenance | No inference | Non-public |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Brooks Ghost 18 | Yes | Yes | Yes | Yes | Review | Unknown | Yes | Unknown | Yes | Unknown | Yes | Yes | Yes |
| Saucony Ride 19 | Yes | Yes | Yes | Yes | Yes | Unknown | Yes | Yes | Yes | Unknown | Yes | Yes | Yes |
| Altra Torin 8 | Yes | Yes | Yes | Yes | Yes | Unknown | Yes | Unknown | Yes | Unknown | Yes | Yes | Yes |
| ASICS GEL-NIMBUS 28 | Yes | Yes | Yes | Unknown | Yes | Unknown | Yes | Unknown | Unknown | Unknown | Yes | Yes | Yes |
| New Balance Fresh Foam X Hierro v9 | Yes | Yes | Yes | Yes | Yes | Unknown | Yes | Unknown | Yes | Unknown | Yes | Yes | Yes |
| Brooks Adrenaline GTS 25 | Yes | Yes | Yes | Yes | Review | Unknown | Yes | Unknown | Yes | Unknown | Yes | Yes | Yes |
| ASICS GEL-KAYANO 32 | Yes | Yes | Yes | Yes | Yes | Unknown | Yes | Unknown | Yes | Unknown | Yes | Yes | Yes |
| Saucony Endorphin Speed 5 | Yes | Yes | Yes | Yes | Yes | Unknown | Yes | Yes | Yes | Unknown | Yes | Yes | Yes |
| New Balance FuelCell Rebel v5 | Yes | Yes | Yes | Unknown | Yes | Unknown | Yes | Unknown | Yes | Unknown | Yes | Yes | Yes |
| Nike Vaporfly 4 | Yes | Yes | Yes | Yes | Unknown | Yes | Yes | Unknown | Unknown | Unknown | Yes | Yes | Yes |
| adidas Adizero Adios Pro 4 | Yes | Yes | Yes | Yes | Unknown | Yes | Yes | Unknown | Unknown | Unknown | Yes | Yes | Yes |
| Saucony Cohesion 19 | Yes | Yes | Yes | Yes | Yes | Unknown | Unknown | Unknown | Yes | Unknown | Yes | Yes | Yes |

## 3. Objective data completeness

| Field | Completed rows | Notes |
| --- | ---: | --- |
| Identity, version, status, gender | 12 / 12 | All are exact model records and remain non-public. |
| MSRP and currency | 12 / 12 | Manufacturer-listed regular/original price, not a sale price. |
| Official specification source | 12 / 12 | One official manufacturer product page per row. |
| Primary surface | 10 / 12 | Nimbus 28 and Rebel v5 remain unknown from their cited pages. |
| Support category | 8 / 12 | Ghost 18 and Adrenaline GTS 25 need taxonomy review; both racing shoes are unknown. |
| Weight with valid reference | 2 / 12 | Vaporfly 4 remains in ounces at US 10; Adios Pro 4 remains in grams at UK 8.5. |
| Heel-to-toe drop | 11 / 12 | Cohesion 19 is unknown; no value was inferred. |
| General stack height | 1 / 12 | Torin 8's single published value is preserved without filling heel or forefoot. |
| Heel and forefoot stack pair | 2 / 12 | Ride 19 and Endorphin Speed 5 publish unambiguous pairs. |
| Available widths | 9 / 12 | Manufacturer labels/codes are preserved. |
| Release date | 0 / 12 | Product pages did not provide a sufficiently explicit release date. |

## 4. Fields frequently missing

- Weight is commonly published without a reference size. Under the frozen policy it stays absent rather than being treated as a men's US 9 measurement.
- Heel and forefoot stack heights are often absent, expressed as one general stack figure, or presented ambiguously.
- Release dates are rarely present on current product pages.
- Width availability can be color/SKU-specific or absent from the canonical product copy.
- Some manufacturers describe support with brand terminology instead of `neutral`, `stability`, or `motion_control`.
- Some pages do not explicitly state the v1 surface value even when the product's intended use may seem obvious.

## 5. Source conflicts and discrepancies

- Nike currently displays different original prices on different Vaporfly 4 color/style pages. The pilot uses the cited standard product page's displayed original price of USD 280 and flags the page-specific nature of that value for review.
- The adidas page gives an approximate weight in grams at UK 8.5. The pilot preserves `200`, `g`, and `UK 8.5` separately without conversion.
- Brooks uses `Balanced` and `Structured` support labels. The pilot preserves those manufacturer labels while leaving canonical support blank for human review.
- Altra's US page gives a general 30 mm stack height but not explicit heel and forefoot fields. The pilot stores only the general value and does not infer a 30/30 pair.

## 6. Approved schema resolutions

1. **Unit-aware manufacturer weight.** `weight_value` and `weight_unit` preserve either grams or ounces with the exact reference size/category. The importer performs no conversion.
2. **Separate support terminology.** `manufacturer_support_label` preserves source wording while `support_category` remains a separate human-reviewed Running Shoe Match classification.
3. **Typed general stack height.** `general_stack_height_mm` preserves a single published value without populating heel or forefoot fields.
4. **MSRP can be page/style specific.** The row-level provenance model is sufficient for the pilot, but the verification checklist must call out a regular/original price that varies by style.
5. **One source URL is adequate but imperfect.** Widths or technical specs sometimes appear on another official regional or variant page. Per-field provenance is not recommended yet; discrepancies remain in `spec_notes`.

## 7. Recommended changes before metric scoring

- Do not block Stage 2 metric scoring on the sparse objective fields. Unknown must continue to mean absent.
- Complete the human review of the two Brooks canonical support classifications; manufacturer labels alone must not decide them.
- Keep any future unit normalization in a derived comparison layer rather than changing the stored manufacturer value.
- Keep the pilot non-public through import and review. Public visibility should require the existing core identity/objective verification workflow.

## 8. Import and evidence state

The linked project contains the 12 objective pilot records and all remain non-public. The repeatable dry run remains useful for validating the source file without modifying the database:

```powershell
npm run import:shoes -- data/pilot/pilot-shoes.csv --dry-run
```

Evidence collection now uses `pilot-evidence.csv` and `pilot-evidence-coverage.csv`. Only the 12 official manufacturer sources already verified here are initialized. Independent laboratory and wear-test availability remains `not_checked` until directly verified.

The Stage 2 metric file remains empty except for its schema header. No evaluative score, use-case score, ranking result, match score, ranking weight, or quiz weight has been created.
