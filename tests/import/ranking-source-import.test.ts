import assert from "node:assert/strict";
import test from "node:test";

import type { CsvRow } from "../../scripts/import/csv";
import {
  normalizeRankingInput,
  normalizeRankingReview,
  RANKING_INPUT_COLUMNS,
  RANKING_REVIEW_COLUMNS,
} from "../../scripts/import/ranking-source-schema";

function values(columns: readonly string[], overrides: Record<string, string>) {
  return { ...Object.fromEntries(columns.map((column) => [column, ""])), ...overrides };
}

test("normalizes an approved review source observation", () => {
  const result = normalizeRankingReview({
    line: 2,
    values: values(RANKING_REVIEW_COLUMNS, {
      shoe_slug: " Demo Shoe ",
      source_key: "RUNNING-WAREHOUSE",
      rating: "4.6",
      review_count: "1,234",
      product_url: "https://example.test/shoe",
      observed_at: "2026-09-23",
      verification_status: "source_checked",
    }),
  } as CsvRow);
  assert.equal(result.success, true);
  if (!result.success) return;
  assert.equal(result.data.shoeSlug, "demo-shoe");
  assert.equal(result.data.reviewCount, 1234);
});

test("rejects unknown rating sources and unreviewed observations", () => {
  const result = normalizeRankingReview({
    line: 3,
    values: values(RANKING_REVIEW_COLUMNS, {
      shoe_slug: "demo-shoe",
      source_key: "unknown-store",
      rating: "4.5",
      review_count: "12",
      observed_at: "2026-09-23",
      verification_status: "unverified",
    }),
  } as CsvRow);
  assert.equal(result.success, false);
});

test("normalizes and deduplicates pipe-delimited category eligibility", () => {
  const result = normalizeRankingInput({
    line: 4,
    values: values(RANKING_INPUT_COLUMNS, {
      shoe_slug: "Demo Shoe",
      methodology_version: "overall-score-v1",
      effective_date: "2026-09-23",
      fit_classification: "GREAT",
      cushion_classification: "Balanced",
      eligible_category_slugs: "Daily Trainers|neutral_road|daily-trainers",
      reviewed_at: "2026-09-23",
    }),
  } as CsvRow);
  assert.equal(result.success, true);
  if (!result.success) return;
  assert.deepEqual(result.data.categorySlugs, ["daily-trainers", "neutral-road"]);
});

test("rejects unsupported fit and cushion classifications", () => {
  const result = normalizeRankingInput({
    line: 5,
    values: values(RANKING_INPUT_COLUMNS, {
      shoe_slug: "demo-shoe",
      methodology_version: "overall-score-v1",
      effective_date: "2026-09-23",
      fit_classification: "excellent",
      cushion_classification: "soft",
      eligible_category_slugs: "daily-trainers",
      reviewed_at: "2026-09-23",
    }),
  } as CsvRow);
  assert.equal(result.success, false);
});
