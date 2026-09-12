import { z } from "zod";

import { normalizeSlug, normalizeWhitespace, type CsvRow } from "./csv";

export const SHOE_IMPORT_COLUMNS = [
  "brand",
  "model_name",
  "slug",
  "model_version",
  "model_year",
  "status",
  "gender",
  "is_public",
  "msrp",
  "currency",
  "release_date",
  "short_description",
  "full_description",
  "primary_image_url",
  "spec_primary_surface",
  "spec_support_category",
  "spec_manufacturer_support_label",
  "spec_weight_value",
  "spec_weight_unit",
  "spec_weight_reference_size",
  "spec_weight_reference_category",
  "spec_heel_to_toe_drop_mm",
  "spec_general_stack_height_mm",
  "spec_heel_stack_height_mm",
  "spec_forefoot_stack_height_mm",
  "spec_available_widths",
  "spec_source_name",
  "spec_source_url",
  "spec_verified_at",
  "spec_verification_status",
  "spec_notes",
] as const;

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

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

function optionalNumber(options: { min?: number; max?: number; integer?: boolean; positive?: boolean } = {}) {
  let schema = z.number();

  if (options.integer) schema = schema.int();
  if (options.positive) schema = schema.positive();
  if (options.min !== undefined) schema = schema.min(options.min);
  if (options.max !== undefined) schema = schema.max(options.max);

  return z.preprocess((value) => {
    const normalized = emptyToUndefined(value);

    if (normalized === undefined) return undefined;
    if (typeof normalized !== "string") return normalized;

    const parsed = Number(normalized.replace(/[$,]/g, ""));
    return Number.isFinite(parsed) ? parsed : normalized;
  }, schema.optional());
}

const requiredText = z.preprocess(cleaned, z.string().min(1));
const optionalText = z.preprocess(emptyToUndefined, z.string().min(1).optional());
const optionalHttpUrl = z.preprocess(
  emptyToUndefined,
  z.string().url().refine((value) => value.startsWith("http://") || value.startsWith("https://"), "must use http:// or https://").optional(),
);
const booleanValue = z.preprocess((value) => {
  const normalized = String(cleaned(value)).toLowerCase();
  if (["true", "yes", "1"].includes(normalized)) return true;
  if (["false", "no", "0"].includes(normalized)) return false;
  return value;
}, z.boolean());
const controlledKey = <T extends readonly [string, ...string[]]>(values: T) => z.preprocess(
  (value) => {
    const normalized = emptyToUndefined(value);
    return typeof normalized === "string" ? normalized.toLowerCase().replace(/[\s-]+/g, "_") : normalized;
  },
  z.enum(values).optional(),
);

const rawShoeSchema = z.object({
  brand: requiredText,
  model_name: requiredText,
  slug: requiredText,
  model_version: optionalText,
  model_year: optionalNumber({ min: 1900, max: 2200, integer: true }),
  status: z.preprocess((value) => String(cleaned(value)).toLowerCase(), z.enum(["active", "discontinued", "upcoming"])),
  gender: z.preprocess((value) => String(cleaned(value)).toLowerCase(), z.enum(["men", "women", "unisex"])),
  is_public: booleanValue,
  msrp: optionalNumber({ min: 0 }),
  currency: z.preprocess((value) => String(cleaned(value)).toUpperCase(), z.string().regex(/^[A-Z]{3}$/)),
  release_date: z.preprocess(emptyToUndefined, z.string().refine(isIsoDate, "must be a valid YYYY-MM-DD date").optional()),
  short_description: optionalText,
  full_description: optionalText,
  primary_image_url: optionalHttpUrl,
  spec_primary_surface: controlledKey(["road", "trail", "track", "hybrid"]),
  spec_support_category: controlledKey(["neutral", "stability", "motion_control"]),
  spec_manufacturer_support_label: optionalText,
  spec_weight_value: optionalNumber({ positive: true }),
  spec_weight_unit: controlledKey(["g", "oz"]),
  spec_weight_reference_size: optionalText,
  spec_weight_reference_category: z.preprocess(
    (value) => {
      const normalized = emptyToUndefined(value);
      return typeof normalized === "string" ? normalized.toLowerCase().replace(/[\s-]+/g, "_") : normalized;
    },
    z.enum(["men", "women", "unisex", "not_stated"]).optional(),
  ),
  spec_heel_to_toe_drop_mm: optionalNumber({ min: -10, max: 40 }),
  spec_general_stack_height_mm: optionalNumber({ min: 1, max: 100 }),
  spec_heel_stack_height_mm: optionalNumber({ min: 1, max: 100 }),
  spec_forefoot_stack_height_mm: optionalNumber({ min: 1, max: 100 }),
  spec_available_widths: optionalText,
  spec_source_name: optionalText,
  spec_source_url: optionalHttpUrl,
  spec_verified_at: z.preprocess(emptyToUndefined, z.string().refine(isIsoDate, "must be a valid YYYY-MM-DD date").optional()),
  spec_verification_status: z.preprocess(
    (value) => String(cleaned(value)).toLowerCase(),
    z.enum(["unverified", "source_checked", "cross_checked", "development_demo"]),
  ),
  spec_notes: optionalText,
}).strict();

export type NormalizedShoeImport = {
  sourceLine: number;
  brand: string;
  brandSlug: string;
  modelName: string;
  slug: string;
  modelVersion: string | null;
  modelYear: number | null;
  status: "active" | "discontinued" | "upcoming";
  gender: "men" | "women" | "unisex";
  isPublic: boolean;
  msrp: number | null;
  currency: string;
  releaseDate: string | null;
  shortDescription: string | null;
  fullDescription: string | null;
  primaryImageUrl: string | null;
  primarySurface: string | null;
  supportCategory: string | null;
  manufacturerSupportLabel: string | null;
  weightValue: number | null;
  weightUnit: "g" | "oz" | null;
  weightReferenceSize: string | null;
  weightReferenceCategory: "men" | "women" | "unisex" | "not_stated" | null;
  heelToToeDropMm: number | null;
  generalStackHeightMm: number | null;
  heelStackHeightMm: number | null;
  forefootStackHeightMm: number | null;
  availableWidths: string[];
  specSourceName: string | null;
  specSourceUrl: string | null;
  specVerifiedAt: string | null;
  specVerificationStatus: "unverified" | "source_checked" | "cross_checked" | "development_demo";
  specNotes: string | null;
};

export type RowValidationResult<T> =
  | { success: true; data: T }
  | { success: false; line: number; message: string };

function issueMessage(error: z.ZodError) {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "row"}: ${issue.message}`)
    .join("; ");
}

export function normalizeShoeRow(row: CsvRow): RowValidationResult<NormalizedShoeImport> {
  const result = rawShoeSchema.safeParse(row.values);

  if (!result.success) {
    return { success: false, line: row.line, message: issueMessage(result.error) };
  }

  const slug = normalizeSlug(result.data.slug);
  const brandSlug = normalizeSlug(result.data.brand);

  if (!slug || !brandSlug) {
    return { success: false, line: row.line, message: "brand and slug must contain letters or numbers" };
  }

  const availableWidths = (result.data.spec_available_widths ?? "")
    .split("|")
    .map((value) => normalizeWhitespace(value))
    .map((value) => (/^(?:\d*[a-z]{1,2})$/i.test(value) ? value.toUpperCase() : value))
    .filter(Boolean);

  if (availableWidths.some((value) => value.includes("|"))) {
    return { success: false, line: row.line, message: "spec_available_widths must use pipe-separated manufacturer codes or labels" };
  }

  if (new Set(availableWidths.map((value) => value.toLocaleLowerCase("en-US"))).size !== availableWidths.length) {
    return { success: false, line: row.line, message: "spec_available_widths contains a duplicate normalized width" };
  }

  const hasWeightReferenceSize = result.data.spec_weight_reference_size !== undefined;
  const hasWeightReferenceCategory = result.data.spec_weight_reference_category !== undefined;
  const hasWeightValue = result.data.spec_weight_value !== undefined;
  const hasWeightUnit = result.data.spec_weight_unit !== undefined;

  if (hasWeightValue !== hasWeightUnit) {
    return {
      success: false,
      line: row.line,
      message: "spec_weight_value and spec_weight_unit must be provided together",
    };
  }

  if (hasWeightValue && (!hasWeightReferenceSize || !hasWeightReferenceCategory)) {
    return {
      success: false,
      line: row.line,
      message: "unit-aware weight requires spec_weight_reference_size and spec_weight_reference_category",
    };
  }

  if (hasWeightReferenceSize !== hasWeightReferenceCategory) {
    return {
      success: false,
      line: row.line,
      message: "weight reference size and category must be provided together",
    };
  }

  const hasObjectiveSpecifications = [
    result.data.msrp,
    result.data.release_date,
    result.data.spec_primary_surface,
    result.data.spec_support_category,
    result.data.spec_manufacturer_support_label,
    result.data.spec_weight_value,
    result.data.spec_weight_unit,
    result.data.spec_weight_reference_size,
    result.data.spec_weight_reference_category,
    result.data.spec_heel_to_toe_drop_mm,
    result.data.spec_general_stack_height_mm,
    result.data.spec_heel_stack_height_mm,
    result.data.spec_forefoot_stack_height_mm,
    ...availableWidths,
  ].some((value) => value !== undefined && value !== "");

  if (hasObjectiveSpecifications && !result.data.spec_source_name) {
    return { success: false, line: row.line, message: "spec_source_name is required when objective specifications are present" };
  }

  if (result.data.spec_verification_status !== "unverified" && !result.data.spec_verified_at) {
    return { success: false, line: row.line, message: "spec_verified_at is required for a reviewed or demo specification set" };
  }

  if (result.data.is_public && ["unverified", "development_demo"].includes(result.data.spec_verification_status)) {
    return { success: false, line: row.line, message: "public shoes require source_checked or cross_checked specifications" };
  }

  return {
    success: true,
    data: {
      sourceLine: row.line,
      brand: result.data.brand,
      brandSlug,
      modelName: result.data.model_name,
      slug,
      modelVersion: result.data.model_version ?? null,
      modelYear: result.data.model_year ?? null,
      status: result.data.status,
      gender: result.data.gender,
      isPublic: result.data.is_public,
      msrp: result.data.msrp === undefined ? null : Math.round(result.data.msrp * 100) / 100,
      currency: result.data.currency,
      releaseDate: result.data.release_date ?? null,
      shortDescription: result.data.short_description ?? null,
      fullDescription: result.data.full_description ?? null,
      primaryImageUrl: result.data.primary_image_url ?? null,
      primarySurface: result.data.spec_primary_surface ?? null,
      supportCategory: result.data.spec_support_category ?? null,
      manufacturerSupportLabel: result.data.spec_manufacturer_support_label ?? null,
      weightValue: result.data.spec_weight_value ?? null,
      weightUnit: result.data.spec_weight_unit === "g" || result.data.spec_weight_unit === "oz"
        ? result.data.spec_weight_unit
        : null,
      weightReferenceSize: result.data.spec_weight_reference_size ?? null,
      weightReferenceCategory: result.data.spec_weight_reference_category ?? null,
      heelToToeDropMm: result.data.spec_heel_to_toe_drop_mm ?? null,
      generalStackHeightMm: result.data.spec_general_stack_height_mm ?? null,
      heelStackHeightMm: result.data.spec_heel_stack_height_mm ?? null,
      forefootStackHeightMm: result.data.spec_forefoot_stack_height_mm ?? null,
      availableWidths,
      specSourceName: result.data.spec_source_name ?? null,
      specSourceUrl: result.data.spec_source_url ?? null,
      specVerifiedAt: result.data.spec_verified_at ?? null,
      specVerificationStatus: result.data.spec_verification_status,
      specNotes: result.data.spec_notes ?? null,
    },
  };
}
