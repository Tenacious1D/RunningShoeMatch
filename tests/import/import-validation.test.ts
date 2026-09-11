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
      spec_weight_oz: "8.75",
      spec_weight_reference: "Men's US 9",
      spec_heel_to_toe_drop_mm: "0",
      spec_heel_stack_height_mm: "35",
      spec_forefoot_stack_height_mm: "35",
      spec_available_widths: " Standard | Wide ",
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
  assert.equal(result.data.weightOz, 8.75);
  assert.equal(result.data.heelToToeDropMm, 0);
  assert.deepEqual(result.data.availableWidths, ["standard", "wide"]);
  assert.equal(result.data.specVerificationStatus, "source_checked");
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
      metric_key: "Weight Perception",
      value: "72.5",
      normalized_value: "73",
      unit: "score",
      metric_kind: "evaluative",
      source_type: "review",
      data_source: " Editorial Review ",
      source_reference: "https://example.test/review",
      effective_date: "2026-09-01",
      metric_version: "v1",
      confidence: "0.8",
      verification_status: "source_checked",
      is_public: "true",
    },
  });

  assert.equal(result.success, true);
  if (!result.success) return;
  assert.equal(result.data.metricKey, "weight_perception");
  assert.equal(result.data.metricKind, "evaluative");
  assert.equal(result.data.value, 72.5);
  assert.equal(result.data.confidence, 0.8);
  assert.equal(metricIdentity(result.data), "demo-cloud-one|weight_perception|2026-09-01|v1|Editorial Review");
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
      source_type: "review",
      data_source: "Editorial Review",
      effective_date: "2026-02-31",
      metric_version: "v1",
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
      spec_weight_oz: "9.2",
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
      metric_version: "proposal-v1",
      verification_status: "unverified",
      is_public: "true",
    },
  });

  assert.equal(result.success, false);
  if (result.success) return;
  assert.match(result.message, /public metrics/);
});

test("requires use-case scores to use the 0-100 range", () => {
  const result = normalizeMetricRow({
    line: 10,
    values: {
      ...metricValues(),
      shoe_slug: "demo-shoe",
      metric_key: "daily_training_suitability",
      metric_kind: "use_case",
      value: "101",
      unit: "score_0_100",
      source_type: "derived_methodology",
      data_source: "Pilot methodology",
      effective_date: "2026-09-01",
      metric_version: "proposal-v1",
      verification_status: "unverified",
      is_public: "false",
    },
  });

  assert.equal(result.success, false);
  if (result.success) return;
  assert.match(result.message, /between 0 and 100/);
});
