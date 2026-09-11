import assert from "node:assert/strict";
import test from "node:test";

import type { CsvRow } from "../../scripts/import/csv";
import { buildRankingSnapshot, normalizeRankingRow, RANKING_IMPORT_COLUMNS, validateRankingReferences, type NormalizedRankingRow } from "../../scripts/import/ranking-schema";

function values(overrides: Record<string, string> = {}) {
  return { ...Object.fromEntries(RANKING_IMPORT_COLUMNS.map((column) => [column, ""])), ...overrides };
}

function normalized(line: number, overrides: Record<string, string> = {}): NormalizedRankingRow {
  const result = normalizeRankingRow({
    line,
    values: values({
      run_name: "October Snapshot",
      effective_date: "2026-10-01",
      methodology_version: "v2",
      category_slug: "daily-trainer",
      shoe_slug: `shoe-${line}`,
      rank: String(line - 1),
      score: "88.25",
      component_scores_json: '{"ride":90,"value":80}',
      ...overrides,
    }),
  } as CsvRow);
  if (!result.success) assert.fail(result.errors.join("; "));
  return result.data;
}

test("normalizes a valid ranking row and component scores", () => {
  const row = normalized(2, { category_slug: " Daily Trainers ", shoe_slug: " Demo Shoe ", result_notes: " Reviewed result " });
  assert.equal(row.categorySlug, "daily-trainers");
  assert.equal(row.shoeSlug, "demo-shoe");
  assert.equal(row.score, 88.25);
  assert.deepEqual(row.componentScores, { ride: 90, value: 80 });
  assert.equal(row.resultNotes, "Reviewed result");
});

test("rejects scores outside zero to one hundred", () => {
  const result = normalizeRankingRow({ line: 9, values: values({ run_name: "Run", effective_date: "2026-10-01", methodology_version: "v1", category_slug: "daily", shoe_slug: "shoe", rank: "1", score: "101" }) });
  assert.equal(result.success, false);
  if (!result.success) assert.match(result.errors.join(" "), /score/i);
});

test("detects duplicate shoes in the same category", () => {
  const result = buildRankingSnapshot([normalized(2, { shoe_slug: "same", rank: "1" }), normalized(3, { shoe_slug: "same", rank: "2" })]);
  assert.equal(result.success, false);
  if (!result.success) assert.match(result.errors.join(" "), /duplicate shoe/i);
});

test("detects duplicate ranks in the same category", () => {
  const result = buildRankingSnapshot([normalized(2, { shoe_slug: "one", rank: "1" }), normalized(3, { shoe_slug: "two", rank: "1" })]);
  assert.equal(result.success, false);
  if (!result.success) assert.match(result.errors.join(" "), /duplicate rank/i);
});

test("requires contiguous ranks starting at one", () => {
  const result = buildRankingSnapshot([normalized(2, { rank: "1" }), normalized(3, { rank: "3" })]);
  assert.equal(result.success, false);
  if (!result.success) assert.match(result.errors.join(" "), /contiguous/i);
});

test("reports missing shoe and category references", () => {
  const built = buildRankingSnapshot([normalized(2, { category_slug: "missing-category", shoe_slug: "missing-shoe", rank: "1" })]);
  assert.equal(built.success, true);
  if (!built.success) return;
  const errors = validateRankingReferences(built.data, new Set(), new Set());
  assert.equal(errors.length, 2);
  assert.match(errors.join(" "), /shoe .* does not exist/i);
  assert.match(errors.join(" "), /category .* does not exist/i);
});

test("semantic import hashes are stable across row order and source lines", () => {
  const first = buildRankingSnapshot([normalized(2, { shoe_slug: "one", rank: "1" }), normalized(3, { shoe_slug: "two", rank: "2" })]);
  const repeated = buildRankingSnapshot([normalized(20, { shoe_slug: "two", rank: "2" }), normalized(10, { shoe_slug: "one", rank: "1" })]);
  assert.equal(first.success, true);
  assert.equal(repeated.success, true);
  if (first.success && repeated.success) assert.equal(first.data.importHash, repeated.data.importHash);
});
