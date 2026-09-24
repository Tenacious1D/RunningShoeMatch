import { z } from "zod";

import {
  CUSHION_CLASSIFICATIONS,
  FIT_CLASSIFICATIONS,
  RATING_SOURCE_KEYS,
  type CushionClassification,
  type FitClassification,
  type RatingSourceKey,
} from "../../lib/rankings/overall-score-v1";
import { normalizeSlug, normalizeWhitespace, type CsvRow } from "./csv";
import type { RowValidationResult } from "./shoe-schema";

export const RANKING_REVIEW_COLUMNS = [
  "shoe_slug",
  "source_key",
  "rating",
  "review_count",
  "product_url",
  "observed_at",
  "verification_status",
  "notes",
] as const;

export const RANKING_INPUT_COLUMNS = [
  "shoe_slug",
  "methodology_version",
  "effective_date",
  "fit_classification",
  "cushion_classification",
  "eligible_category_slugs",
  "reviewed_at",
  "notes",
] as const;

const isoDate = z.string().refine((value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}, "must be a valid YYYY-MM-DD date");

function cleaned(value: unknown) {
  return typeof value === "string" ? normalizeWhitespace(value) : value;
}

function emptyToUndefined(value: unknown) {
  const normalized = cleaned(value);
  return normalized === "" ? undefined : normalized;
}

const optionalUrl = z.preprocess(emptyToUndefined, z.string().url().refine(
  (value) => value.startsWith("http://") || value.startsWith("https://"),
  "must use http:// or https://",
).optional());

const reviewSchema = z.object({
  shoe_slug: z.preprocess(cleaned, z.string().min(1)),
  source_key: z.preprocess((value) => String(cleaned(value)).toLowerCase(), z.enum(RATING_SOURCE_KEYS)),
  rating: z.preprocess((value) => Number(cleaned(value)), z.number().min(1).max(5)),
  review_count: z.preprocess((value) => Number(String(cleaned(value)).replace(/,/g, "")), z.number().int().min(0)),
  product_url: optionalUrl,
  observed_at: z.preprocess(cleaned, isoDate),
  verification_status: z.preprocess(cleaned, z.enum(["source_checked", "cross_checked"])),
  notes: z.preprocess(emptyToUndefined, z.string().optional()),
}).strict();

const inputSchema = z.object({
  shoe_slug: z.preprocess(cleaned, z.string().min(1)),
  methodology_version: z.preprocess(cleaned, z.string().min(1)),
  effective_date: z.preprocess(cleaned, isoDate),
  fit_classification: z.preprocess((value) => String(cleaned(value)).toLowerCase(), z.enum(FIT_CLASSIFICATIONS)),
  cushion_classification: z.preprocess((value) => String(cleaned(value)).toLowerCase(), z.enum(CUSHION_CLASSIFICATIONS)),
  eligible_category_slugs: z.preprocess(cleaned, z.string().min(1)),
  reviewed_at: z.preprocess(cleaned, isoDate),
  notes: z.preprocess(emptyToUndefined, z.string().optional()),
}).strict();

export type NormalizedRankingReview = {
  sourceLine: number;
  shoeSlug: string;
  sourceKey: RatingSourceKey;
  rating: number;
  reviewCount: number;
  productUrl: string | null;
  observedAt: string;
  verificationStatus: "source_checked" | "cross_checked";
  notes: string | null;
};

export type NormalizedRankingInput = {
  sourceLine: number;
  shoeSlug: string;
  methodologyVersion: string;
  effectiveDate: string;
  fitClassification: FitClassification;
  cushionClassification: CushionClassification;
  categorySlugs: string[];
  reviewedAt: string;
  notes: string | null;
};

function issueMessage(error: z.ZodError) {
  return error.issues.map((issue) => `${issue.path.join(".") || "row"}: ${issue.message}`).join("; ");
}

export function normalizeRankingReview(row: CsvRow): RowValidationResult<NormalizedRankingReview> {
  const result = reviewSchema.safeParse(row.values);
  if (!result.success) return { success: false, line: row.line, message: issueMessage(result.error) };
  const shoeSlug = normalizeSlug(result.data.shoe_slug);
  if (!shoeSlug) return { success: false, line: row.line, message: "shoe_slug must contain letters or numbers" };
  return {
    success: true,
    data: {
      sourceLine: row.line,
      shoeSlug,
      sourceKey: result.data.source_key,
      rating: result.data.rating,
      reviewCount: result.data.review_count,
      productUrl: result.data.product_url ?? null,
      observedAt: result.data.observed_at,
      verificationStatus: result.data.verification_status,
      notes: result.data.notes ?? null,
    },
  };
}

export function normalizeRankingInput(row: CsvRow): RowValidationResult<NormalizedRankingInput> {
  const result = inputSchema.safeParse(row.values);
  if (!result.success) return { success: false, line: row.line, message: issueMessage(result.error) };
  const shoeSlug = normalizeSlug(result.data.shoe_slug);
  const categorySlugs = [...new Set(result.data.eligible_category_slugs.split("|").map(normalizeSlug).filter(Boolean))];
  if (!shoeSlug || !categorySlugs.length) {
    return { success: false, line: row.line, message: "shoe_slug and at least one eligible category slug are required" };
  }
  return {
    success: true,
    data: {
      sourceLine: row.line,
      shoeSlug,
      methodologyVersion: result.data.methodology_version,
      effectiveDate: result.data.effective_date,
      fitClassification: result.data.fit_classification,
      cushionClassification: result.data.cushion_classification,
      categorySlugs,
      reviewedAt: result.data.reviewed_at,
      notes: result.data.notes ?? null,
    },
  };
}

export function rankingReviewIdentity(row: NormalizedRankingReview) {
  return `${row.shoeSlug}|${row.sourceKey}|${row.observedAt}`;
}

export function rankingInputIdentity(row: NormalizedRankingInput) {
  return `${row.shoeSlug}|${row.methodologyVersion}|${row.effectiveDate}`;
}
