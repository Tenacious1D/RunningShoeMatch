import { z } from "zod";

import { normalizeSlug, normalizeWhitespace, type CsvRow } from "./csv";
import type { RowValidationResult } from "./shoe-schema";

export const METRIC_IMPORT_COLUMNS = [
  "shoe_slug",
  "metric_key",
  "metric_kind",
  "value",
  "normalized_value",
  "unit",
  "source_type",
  "data_source",
  "source_reference",
  "effective_date",
  "metric_version",
  "confidence",
  "verification_status",
  "notes",
  "is_public",
] as const;

function cleaned(value: unknown) {
  return typeof value === "string" ? normalizeWhitespace(value) : value;
}

function emptyToUndefined(value: unknown) {
  const normalized = cleaned(value);
  return normalized === "" ? undefined : normalized;
}

function numericValue({ min, max, optional = false }: { min?: number; max?: number; optional?: boolean }) {
  let schema = z.number();
  if (min !== undefined) schema = schema.min(min);
  if (max !== undefined) schema = schema.max(max);

  return z.preprocess((value) => {
    const normalized = emptyToUndefined(value);
    if (optional && normalized === undefined) return undefined;
    if (typeof normalized !== "string") return normalized;
    const parsed = Number(normalized.replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : normalized;
  }, optional ? schema.optional() : schema);
}

const booleanValue = z.preprocess((value) => {
  const normalized = String(cleaned(value)).toLowerCase();
  if (["true", "yes", "1"].includes(normalized)) return true;
  if (["false", "no", "0"].includes(normalized)) return false;
  return value;
}, z.boolean());

const optionalText = z.preprocess(emptyToUndefined, z.string().min(1).optional());
const isoDate = z.string().refine((value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}, "must be a valid YYYY-MM-DD date");
const metricSchema = z.object({
  shoe_slug: z.preprocess(cleaned, z.string().min(1)),
  metric_key: z.preprocess((value) => String(cleaned(value)).toLowerCase().replace(/[\s-]+/g, "_"), z.string().regex(/^[a-z][a-z0-9_]*$/)),
  metric_kind: z.preprocess((value) => String(cleaned(value)).toLowerCase().replace(/[-\s]+/g, "_"), z.enum(["evaluative", "use_case"])),
  value: numericValue({}),
  normalized_value: numericValue({ min: 0, max: 100, optional: true }),
  unit: optionalText,
  source_type: z.preprocess(
    (value) => String(cleaned(value)).toLowerCase().replace(/[-\s]+/g, "_"),
    z.enum(["manufacturer", "review", "lab_test", "editorial_assessment", "derived_methodology", "development_demo"]),
  ),
  data_source: z.preprocess(cleaned, z.string().min(1)),
  source_reference: optionalText,
  effective_date: z.preprocess(cleaned, isoDate),
  metric_version: z.preprocess(cleaned, z.string().min(1)),
  confidence: numericValue({ min: 0, max: 1, optional: true }),
  verification_status: z.preprocess(
    (value) => String(cleaned(value)).toLowerCase().replace(/[-\s]+/g, "_"),
    z.enum(["unverified", "source_checked", "cross_checked", "methodology_reviewed", "development_demo"]),
  ),
  notes: optionalText,
  is_public: booleanValue,
}).strict();

export type NormalizedMetricImport = {
  sourceLine: number;
  shoeSlug: string;
  metricKey: string;
  metricKind: "evaluative" | "use_case";
  value: number;
  normalizedValue: number | null;
  unit: string | null;
  sourceType: "manufacturer" | "review" | "lab_test" | "editorial_assessment" | "derived_methodology" | "development_demo";
  dataSource: string;
  sourceReference: string | null;
  effectiveDate: string;
  metricVersion: string;
  confidence: number | null;
  verificationStatus: "unverified" | "source_checked" | "cross_checked" | "methodology_reviewed" | "development_demo";
  notes: string | null;
  isPublic: boolean;
};

function issueMessage(error: z.ZodError) {
  return error.issues.map((issue) => `${issue.path.join(".") || "row"}: ${issue.message}`).join("; ");
}

export function metricIdentity(metric: Pick<NormalizedMetricImport, "shoeSlug" | "metricKey" | "effectiveDate" | "metricVersion" | "dataSource">) {
  return [metric.shoeSlug, metric.metricKey, metric.effectiveDate, metric.metricVersion, metric.dataSource].join("|");
}

export function normalizeMetricRow(row: CsvRow): RowValidationResult<NormalizedMetricImport> {
  const result = metricSchema.safeParse(row.values);

  if (!result.success) {
    return { success: false, line: row.line, message: issueMessage(result.error) };
  }

  const shoeSlug = normalizeSlug(result.data.shoe_slug);

  if (!shoeSlug) {
    return { success: false, line: row.line, message: "shoe_slug must contain letters or numbers" };
  }

  if (result.data.value === undefined) {
    return { success: false, line: row.line, message: "value is required" };
  }

  if (result.data.metric_kind === "use_case" && (result.data.value < 0 || result.data.value > 100)) {
    return { success: false, line: row.line, message: "use_case metric values must be between 0 and 100" };
  }

  if (result.data.metric_kind === "use_case" && !["editorial_assessment", "derived_methodology", "development_demo"].includes(result.data.source_type)) {
    return { success: false, line: row.line, message: "use_case metrics require an editorial, methodology, or development source_type" };
  }

  if (result.data.verification_status !== "unverified" && !result.data.source_reference) {
    return { success: false, line: row.line, message: "source_reference is required when verification_status is not unverified" };
  }

  if (result.data.is_public && ["unverified", "development_demo"].includes(result.data.verification_status)) {
    return { success: false, line: row.line, message: "public metrics require source_checked, cross_checked, or methodology_reviewed verification" };
  }

  return {
    success: true,
    data: {
      sourceLine: row.line,
      shoeSlug,
      metricKey: result.data.metric_key,
      metricKind: result.data.metric_kind,
      value: result.data.value,
      normalizedValue: result.data.normalized_value ?? null,
      unit: result.data.unit ?? null,
      sourceType: result.data.source_type,
      dataSource: result.data.data_source,
      sourceReference: result.data.source_reference ?? null,
      effectiveDate: result.data.effective_date,
      metricVersion: result.data.metric_version,
      confidence: result.data.confidence ?? null,
      verificationStatus: result.data.verification_status,
      notes: result.data.notes ?? null,
      isPublic: result.data.is_public,
    },
  };
}
