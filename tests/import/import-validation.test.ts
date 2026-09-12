import assert from "node:assert/strict";
import test from "node:test";

import { parseCsvText, normalizeSlug, normalizeWhitespace, validateHeaders } from "../../scripts/import/csv";
import { METRIC_IMPORT_COLUMNS, metricIdentity, normalizeMetricRow } from "../../scripts/import/metric-schema";
import { normalizeShoeRow, SHOE_IMPORT_COLUMNS } from "../../scripts/import/shoe-schema";

function shoeValues(overrides: Record<string, string> = {}) {
  return Object.fromEntries(SHOE_IMPORT_COLUMNS.map((column) => [column, ""])) as Record<string, string> & typeof overrides;
}

function metricValues(overrides: Record<string, string> = {}) {
  return Object.fromEntries(METRIC_IMPORT_COLUMNS.map((column) => [column, ""])) as Record<string, string> & typeof overrides;
}

test("normalizes whitespace and slugs consistently", () => {
  assert.equal(normalizeWhitespace("  Velocity   Works\n Running  "), "Velocity Works Running");
  assert.equal(normalizeSlug("  Démo Runner’s Shoe 2  "), "demo-runners-shoe-2");
});

test("parses quoted commas and preserves source line numbers", () => {
  const parsed = parseCsvText("brand,description\nDemo,\"Stable, light, and quick\"\n");
  assert.deepEqual(parsed.headers, ["brand", "description"]);
  assert.equal(parsed.rows[0].line, 2);
  assert.equal(parsed.rows[0].values.description, "Stable, light, and quick");
});

test("reports missing and unexpected headers", () => {
  assert.deepEqual(validateHeaders(["brand", "extra"], ["brand", "slug"]), [
    "Missing columns: slug",
    "Unexpected columns: extra",
  ]);
});

test("normalizes a valid shoe row and converts empty values to null", () => {
  const result = normalizeShoeRow({
    line: 2,
    values: {
      ...shoeValues(),
      brand: "  Demo   Running ",
      model_name: " Cloud   One ",
      slug: " Demo Cloud ONE ",
      model_version: " ",
      model_year: "2,026",
      status: " ACTIVE ",
      gender: " Unisex ",
      is_public: "no",
      msrp: "$149.995",
      currency: "usd",
      release_date: "2026-10-01",
      short_description: " A   demo shoe. ",
      spec_primary_surface: " road ",
      spec_manufacturer_support_label: " Balanced ",
      spec_weight_value: "238",
      spec_weight_unit: "G",
      spec_weight_reference_size: "UK 8.5",
      spec_weight_reference_category: "MEN",
      spec_heel_to_toe_drop_mm: "0",
      spec_general_stack_height_mm: "30",
      spec_heel_stack_height_mm: "35",
      spec_forefoot_stack_height_mm: "35",
      spec_available_widths: " b | d | 2e | 4E ",
      spec_source_name: "Manufacturer specification page",
      spec_verified_at: "2026-09-01",
      spec_verification_status: "source_checked",
    },
  });

  assert.equal(result.success, true);
  if (!result.success) return;
  assert.equal(result.data.brand, "Demo Running");
  assert.equal(result.data.slug, "demo-cloud-one");
  assert.equal(result.data.modelVersion, null);
  assert.equal(result.data.modelYear, 2026);
  assert.equal(result.data.isPublic, false);
  assert.equal(result.data.msrp, 150);
  assert.equal(result.data.primarySurface, "road");
  assert.equal(result.data.manufacturerSupportLabel, "Balanced");
  assert.equal(result.data.weightValue, 238);
  assert.equal(result.data.weightUnit, "g");
  assert.equal(result.data.heelToToeDropMm, 0);
  assert.equal(result.data.generalStackHeightMm, 30);
  assert.deepEqual(result.data.availableWidths, ["B", "D", "2E", "4E"]);
  assert.equal(result.data.weightReferenceSize, "UK 8.5");
  assert.equal(result.data.weightReferenceCategory, "men");
  assert.equal(result.data.specVerificationStatus, "source_checked");
});

test("preserves manufacturer grams and ounces without conversion", () => {
  const makeWeightRow = (value: string, unit: string, referenceSize: string) => normalizeShoeRow({
    line: 3,
    values: {
      ...shoeValues(),
      brand: "Demo",
      model_name: unit === "g" ? "Gram Shoe" : "Ounce Shoe",
      slug: unit === "g" ? "gram-shoe" : "ounce-shoe",
      status: "active",
      gender: "men",
      is_public: "false",
      currency: "USD",
      spec_weight_value: value,
      spec_weight_unit: unit,
      spec_weight_reference_size: referenceSize,
      spec_weight_reference_category: "men",
      spec_source_name: "Manufacturer specification page",
      spec_verification_status: "unverified",
    },
  });

  const grams = makeWeightRow("238", "g", "UK 8.5");
  const ounces = makeWeightRow("6.7", "oz", "US 10");

  assert.equal(grams.success, true);
  assert.equal(ounces.success, true);
  if (!grams.success || !ounces.success) return;
  assert.equal(grams.data.weightValue, 238);
  assert.equal(grams.data.weightUnit, "g");
  assert.equal(grams.data.weightReferenceSize, "UK 8.5");
  assert.equal(ounces.data.weightValue, 6.7);
  assert.equal(ounces.data.weightUnit, "oz");
  assert.equal(ounces.data.weightReferenceSize, "US 10");
});

test("rejects invalid or incomplete weight units", () => {
  const baseValues = {
    ...shoeValues(),
    brand: "Demo",
    model_name: "Bad Weight",
    slug: "bad-weight",
    status: "active",
    gender: "men",
    is_public: "false",
    currency: "USD",
    spec_weight_value: "238",
    spec_weight_reference_size: "UK 8.5",
    spec_weight_reference_category: "men",
    spec_source_name: "Manufacturer specification page",
    spec_verification_status: "unverified",
  };

  const invalidUnit = normalizeShoeRow({
    line: 4,
    values: { ...baseValues, spec_weight_unit: "kg" },
  });
  const missingUnit = normalizeShoeRow({
    line: 5,
    values: baseValues,
  });

  assert.equal(invalidUnit.success, false);
  if (!invalidUnit.success) assert.match(invalidUnit.message, /spec_weight_unit/);
  assert.equal(missingUnit.success, false);
  if (!missingUnit.success) assert.match(missingUnit.message, /spec_weight_value and spec_weight_unit/);
});

test("keeps manufacturer support and general stack independent from canonical fields", () => {
  const result = normalizeShoeRow({
    line: 6,
    values: {
      ...shoeValues(),
      brand: "Demo",
      model_name: "Independent Fields",
      slug: "independent-fields",
      status: "active",
      gender: "unisex",
      is_public: "false",
      currency: "USD",
      spec_manufacturer_support_label: "Structured",
      spec_general_stack_height_mm: "30",
      spec_source_name: "Manufacturer specification page",
      spec_verification_status: "unverified",
    },
  });

  assert.equal(result.success, true);
  if (!result.success) return;
  assert.equal(result.data.manufacturerSupportLabel, "Structured");
  assert.equal(result.data.supportCategory, null);
  assert.equal(result.data.generalStackHeightMm, 30);
  assert.equal(result.data.heelStackHeightMm, null);
  assert.equal(result.data.forefootStackHeightMm, null);
});

test("allows a shoe with no listed weight", () => {
  const result = normalizeShoeRow({
    line: 7,
    values: {
      ...shoeValues(),
      brand: "Demo",
      model_name: "Unknown Weight",
      slug: "unknown-weight",
      status: "active",
      gender: "unisex",
      is_public: "false",
      currency: "USD",
      spec_verification_status: "unverified",
    },
  });

  assert.equal(result.success, true);
  if (!result.success) return;
  assert.equal(result.data.weightValue, null);
  assert.equal(result.data.weightUnit, null);
});

test("rejects invalid controlled values before database access", () => {
  const result = normalizeShoeRow({
    line: 7,
    values: {
      ...shoeValues(),
      brand: "Demo",
      model_name: "Bad Row",
      slug: "bad-row",
      status: "for-sale",
      gender: "all",
      is_public: "maybe",
      currency: "US",
    },
  });

  assert.equal(result.success, false);
  if (result.success) return;
  assert.equal(result.line, 7);
  assert.match(result.message, /status/);
  assert.match(result.message, /is_public/);
});

test("normalizes versioned metric identities and numeric values", () => {
  const result = normalizeMetricRow({
    line: 3,
    values: {
      ...metricValues(),
      shoe_slug: " Demo Cloud One ",
      metric_key: "Responsiveness",
      value: "72.5",
      unit: "score_0_100",
      metric_kind: "evaluative",
      source_type: "review",
      data_source: " Editorial Review ",
      source_reference: "https://example.test/review",
      effective_date: "2026-09-01",
      metric_version: "metric-v1:editorial-v1",
      confidence: "0.8",
      verification_status: "source_checked",
      is_public: "true",
    },
  });

  assert.equal(result.success, true);
  if (!result.success) return;
  assert.equal(result.data.metricKey, "responsiveness");
  assert.equal(result.data.metricKind, "evaluative");
  assert.equal(result.data.value, 72.5);
  assert.equal(result.data.confidence, 0.8);
  assert.equal(result.data.normalizedValue, null);
  assert.equal(metricIdentity(result.data), "demo-cloud-one|responsiveness|2026-09-01|metric-v1:editorial-v1|Editorial Review");
});

test("rejects impossible calendar dates", () => {
  const result = normalizeMetricRow({
    line: 4,
    values: {
      ...metricValues(),
      shoe_slug: "demo-cloud-one",
      metric_key: "durability",
      metric_kind: "evaluative",
      value: "80",
      unit: "score_0_100",
      source_type: "review",
      data_source: "Editorial Review",
      effective_date: "2026-02-31",
      metric_version: "metric-v1:editorial-v1",
      verification_status: "unverified",
      is_public: "false",
    },
  });

  assert.equal(result.success, false);
});

test("rejects objective specifications without provenance", () => {
  const result = normalizeShoeRow({
    line: 8,
    values: {
      ...shoeValues(),
      brand: "Demo",
      model_name: "Unsourced Shoe",
      slug: "unsourced-shoe",
      status: "active",
      gender: "unisex",
      is_public: "false",
      currency: "USD",
      spec_weight_value: "9.2",
      spec_weight_unit: "oz",
      spec_weight_reference_size: "US 9",
      spec_weight_reference_category: "men",
      spec_verification_status: "unverified",
    },
  });

  assert.equal(result.success, false);
  if (result.success) return;
  assert.match(result.message, /spec_source_name/);
});

test("rejects public unverified metrics", () => {
  const result = normalizeMetricRow({
    line: 9,
    values: {
      ...metricValues(),
      shoe_slug: "demo-shoe",
      metric_key: "comfort",
      metric_kind: "evaluative",
      value: "82",
      unit: "score_0_100",
      source_type: "editorial_assessment",
      data_source: "Pilot review",
      effective_date: "2026-09-01",
      metric_version: "metric-v1:pilot-v1",
      verification_status: "unverified",
      is_public: "true",
    },
  });

  assert.equal(result.success, false);
  if (result.success) return;
  assert.match(result.message, /public metrics/);
});

test("rejects evaluative and use-case scores outside the 0-100 range", () => {
  const evaluative = normalizeMetricRow({
    line: 10,
    values: {
      ...metricValues(),
      shoe_slug: "demo-shoe",
      metric_key: "comfort",
      metric_kind: "evaluative",
      value: "-1",
      unit: "score_0_100",
      source_type: "editorial_assessment",
      data_source: "Pilot methodology",
      effective_date: "2026-09-01",
      metric_version: "metric-v1:pilot-v1",
      verification_status: "unverified",
      is_public: "false",
    },
  });
  const result = normalizeMetricRow({
    line: 11,
    values: {
      ...metricValues(),
      shoe_slug: "demo-shoe",
      metric_key: "daily_training",
      metric_kind: "use_case",
      value: "101",
      unit: "score_0_100",
      source_type: "derived_methodology",
      data_source: "Pilot methodology",
      effective_date: "2026-09-01",
      metric_version: "metric-v1:pilot-v1",
      verification_status: "unverified",
      is_public: "false",
    },
  });

  assert.equal(evaluative.success, false);
  assert.equal(result.success, false);
});

test("rejects invalid surface and support categories", () => {
  const baseValues = {
    ...shoeValues(),
    brand: "Demo",
    model_name: "Controlled Vocabulary Shoe",
    slug: "controlled-vocabulary-shoe",
    status: "active",
    gender: "unisex",
    is_public: "false",
    currency: "USD",
    spec_verification_status: "unverified",
  };

  const invalidSurface = normalizeShoeRow({
    line: 12,
    values: { ...baseValues, spec_primary_surface: "treadmill" },
  });
  const invalidSupport = normalizeShoeRow({
    line: 13,
    values: { ...baseValues, spec_support_category: "guided" },
  });

  assert.equal(invalidSurface.success, false);
  if (!invalidSurface.success) assert.match(invalidSurface.message, /spec_primary_surface/);
  assert.equal(invalidSupport.success, false);
  if (!invalidSupport.success) assert.match(invalidSupport.message, /spec_support_category/);
});

test("missing metric values are rejected while an explicit zero remains zero", () => {
  const baseValues = {
    ...metricValues(),
    shoe_slug: "demo-shoe",
    metric_key: "cushioning",
    metric_kind: "evaluative",
    unit: "score_0_100",
    source_type: "editorial_assessment",
    data_source: "Pilot methodology",
    effective_date: "2026-09-01",
    metric_version: "metric-v1:pilot-v1",
    verification_status: "unverified",
    is_public: "false",
  };

  const missing = normalizeMetricRow({ line: 14, values: baseValues });
  const explicitZero = normalizeMetricRow({ line: 15, values: { ...baseValues, value: "0" } });

  assert.equal(missing.success, false);
  assert.equal(explicitZero.success, true);
  if (explicitZero.success) assert.equal(explicitZero.data.value, 0);
});

test("rejects metric keys outside the approved kind-specific vocabulary", () => {
  const result = normalizeMetricRow({
    line: 16,
    values: {
      ...metricValues(),
      shoe_slug: "demo-shoe",
      metric_key: "daily_training",
      metric_kind: "evaluative",
      value: "70",
      unit: "score_0_100",
      source_type: "editorial_assessment",
      data_source: "Pilot methodology",
      effective_date: "2026-09-01",
      metric_version: "metric-v1:pilot-v1",
      verification_status: "unverified",
      is_public: "false",
    },
  });

  assert.equal(result.success, false);
  if (!result.success) assert.match(result.message, /not approved/);
});
