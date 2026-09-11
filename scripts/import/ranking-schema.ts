import { createHash } from "node:crypto";

import { z } from "zod";

import { normalizeSlug, normalizeWhitespace, type CsvRow } from "./csv";
import { stableJson } from "./supabase";

export const RANKING_IMPORT_COLUMNS = [
  "run_name",
  "effective_date",
  "methodology_version",
  "run_notes",
  "category_slug",
  "shoe_slug",
  "rank",
  "score",
  "component_scores_json",
  "result_notes",
] as const;

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const componentKeyPattern = /^[a-z][a-z0-9_]*$/;

function isIsoDate(value: string) {
  if (!isoDatePattern.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function cleaned(value: unknown) {
  return typeof value === "string" ? normalizeWhitespace(value) : value;
}

function emptyToUndefined(value: unknown) {
  const normalized = cleaned(value);
  return normalized === "" ? undefined : normalized;
}

function requiredNumber(options: { integer?: boolean; min: number; max: number }) {
  let schema = z.number().min(options.min).max(options.max);
  if (options.integer) schema = schema.int();

  return z.preprocess((value) => {
    const normalized = cleaned(value);
    if (typeof normalized !== "string") return normalized;
    const parsed = Number(normalized.replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : normalized;
  }, schema);
}

const rawRankingSchema = z.object({
  run_name: z.preprocess(cleaned, z.string().min(1)),
  effective_date: z.preprocess(cleaned, z.string().refine(isIsoDate, "must be a valid YYYY-MM-DD date")),
  methodology_version: z.preprocess(cleaned, z.string().min(1)),
  run_notes: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  category_slug: z.preprocess(cleaned, z.string().min(1)),
  shoe_slug: z.preprocess(cleaned, z.string().min(1)),
  rank: requiredNumber({ integer: true, min: 1, max: 10000 }),
  score: requiredNumber({ min: 0, max: 100 }),
  component_scores_json: z.preprocess(emptyToUndefined, z.string().optional()),
  result_notes: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
}).strict();

export type NormalizedRankingRow = {
  sourceLine: number;
  runName: string;
  effectiveDate: string;
  methodologyVersion: string;
  runNotes: string | null;
  categorySlug: string;
  shoeSlug: string;
  rank: number;
  score: number;
  componentScores: Record<string, number>;
  resultNotes: string | null;
};

export type RankingSnapshot = {
  runName: string;
  effectiveDate: string;
  methodologyVersion: string;
  runNotes: string | null;
  importHash: string;
  rows: NormalizedRankingRow[];
};

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: string[] };

function issueMessage(error: z.ZodError) {
  return error.issues.map((issue) => `${issue.path.join(".") || "row"}: ${issue.message}`).join("; ");
}

function parseComponentScores(value: string | undefined): ValidationResult<Record<string, number>> {
  if (!value) return { success: true, data: {} };

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return { success: false, errors: ["component_scores_json must be valid JSON"] };
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { success: false, errors: ["component_scores_json must be a JSON object"] };
  }

  const scores: Record<string, number> = {};
  const errors: string[] = [];
  for (const [rawKey, rawValue] of Object.entries(parsed)) {
    const key = normalizeWhitespace(rawKey).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    if (!componentKeyPattern.test(key)) {
      errors.push(`component score key "${rawKey}" must normalize to snake_case`);
    } else if (typeof rawValue !== "number" || !Number.isFinite(rawValue) || rawValue < 0 || rawValue > 100) {
      errors.push(`component score "${rawKey}" must be a number from 0 to 100`);
    } else if (Object.hasOwn(scores, key)) {
      errors.push(`component score keys collide after normalization at "${key}"`);
    } else {
      scores[key] = rawValue;
    }
  }

  return errors.length ? { success: false, errors } : { success: true, data: scores };
}

export function normalizeRankingRow(row: CsvRow): ValidationResult<NormalizedRankingRow> {
  const result = rawRankingSchema.safeParse(row.values);
  if (!result.success) return { success: false, errors: [`Line ${row.line}: ${issueMessage(result.error)}`] };

  const categorySlug = normalizeSlug(result.data.category_slug);
  const shoeSlug = normalizeSlug(result.data.shoe_slug);
  if (!categorySlug || !shoeSlug) {
    return { success: false, errors: [`Line ${row.line}: category_slug and shoe_slug must contain letters or numbers`] };
  }

  const componentScores = parseComponentScores(result.data.component_scores_json);
  if (!componentScores.success) {
    return { success: false, errors: componentScores.errors.map((error) => `Line ${row.line}: ${error}`) };
  }

  return {
    success: true,
    data: {
      sourceLine: row.line,
      runName: result.data.run_name,
      effectiveDate: result.data.effective_date,
      methodologyVersion: result.data.methodology_version,
      runNotes: result.data.run_notes ?? null,
      categorySlug,
      shoeSlug,
      rank: result.data.rank,
      score: Math.round(result.data.score * 10000) / 10000,
      componentScores: componentScores.data,
      resultNotes: result.data.result_notes ?? null,
    },
  };
}

function semanticHash(rows: NormalizedRankingRow[]) {
  const first = rows[0];
  const canonical = {
    runName: first.runName,
    effectiveDate: first.effectiveDate,
    methodologyVersion: first.methodologyVersion,
    runNotes: first.runNotes,
    rows: rows
      .map(({ sourceLine: _sourceLine, runName: _runName, effectiveDate: _effectiveDate, methodologyVersion: _methodologyVersion, runNotes: _runNotes, ...row }) => row)
      .sort((left, right) => left.categorySlug.localeCompare(right.categorySlug) || left.rank - right.rank || left.shoeSlug.localeCompare(right.shoeSlug)),
  };
  return createHash("sha256").update(stableJson(canonical)).digest("hex");
}

export function buildRankingSnapshot(rows: NormalizedRankingRow[]): ValidationResult<RankingSnapshot> {
  if (!rows.length) return { success: false, errors: ["CSV must contain at least one ranking result."] };

  const first = rows[0];
  const errors: string[] = [];
  const shoeKeys = new Map<string, number>();
  const rankKeys = new Map<string, number>();
  const categoryRows = new Map<string, NormalizedRankingRow[]>();

  for (const row of rows) {
    if (row.runName !== first.runName || row.effectiveDate !== first.effectiveDate || row.methodologyVersion !== first.methodologyVersion || row.runNotes !== first.runNotes) {
      errors.push(`Line ${row.sourceLine}: run_name, effective_date, methodology_version, and run_notes must match every row in the snapshot.`);
    }

    const shoeKey = `${row.categorySlug}|${row.shoeSlug}`;
    const firstShoeLine = shoeKeys.get(shoeKey);
    if (firstShoeLine) errors.push(`Line ${row.sourceLine}: duplicate shoe "${row.shoeSlug}" in category "${row.categorySlug}" (first seen on line ${firstShoeLine}).`);
    else shoeKeys.set(shoeKey, row.sourceLine);

    const rankKey = `${row.categorySlug}|${row.rank}`;
    const firstRankLine = rankKeys.get(rankKey);
    if (firstRankLine) errors.push(`Line ${row.sourceLine}: duplicate rank ${row.rank} in category "${row.categorySlug}" (first seen on line ${firstRankLine}).`);
    else rankKeys.set(rankKey, row.sourceLine);

    const grouped = categoryRows.get(row.categorySlug) ?? [];
    grouped.push(row);
    categoryRows.set(row.categorySlug, grouped);
  }

  for (const [categorySlug, grouped] of categoryRows) {
    const ranks = grouped.map((row) => row.rank).sort((left, right) => left - right);
    const expected = Array.from({ length: ranks.length }, (_value, index) => index + 1);
    if (ranks.some((rank, index) => rank !== expected[index])) {
      errors.push(`Category "${categorySlug}" ranks must be contiguous starting at 1; received ${ranks.join(", ")}.`);
    }
  }

  if (errors.length) return { success: false, errors };

  return {
    success: true,
    data: {
      runName: first.runName,
      effectiveDate: first.effectiveDate,
      methodologyVersion: first.methodologyVersion,
      runNotes: first.runNotes,
      importHash: semanticHash(rows),
      rows,
    },
  };
}

export function validateRankingReferences(snapshot: RankingSnapshot, shoeSlugs: ReadonlySet<string>, categorySlugs: ReadonlySet<string>): string[] {
  const errors: string[] = [];
  for (const row of snapshot.rows) {
    if (!shoeSlugs.has(row.shoeSlug)) errors.push(`Line ${row.sourceLine}: shoe "${row.shoeSlug}" does not exist.`);
    if (!categorySlugs.has(row.categorySlug)) errors.push(`Line ${row.sourceLine}: active ranking category "${row.categorySlug}" does not exist.`);
  }
  return errors;
}
