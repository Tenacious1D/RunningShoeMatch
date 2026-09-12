import { z } from "zod";

import { normalizeSlug, normalizeWhitespace, type CsvRow } from "./csv";
import type { RowValidationResult } from "./shoe-schema";

export const RETAILER_LINK_IMPORT_COLUMNS = [
  "shoe_slug",
  "retailer",
  "retailer_slug",
  "retailer_homepage_url",
  "create_retailer",
  "retailer_active",
  "affiliate_url",
  "regular_url",
  "displayed_price",
  "currency",
  "is_primary",
  "active",
  "last_verified_at",
] as const;

function cleaned(value: unknown) {
  return typeof value === "string" ? normalizeWhitespace(value) : value;
}

function emptyToUndefined(value: unknown) {
  const normalized = cleaned(value);
  return normalized === "" ? undefined : normalized;
}

function parseBoolean(value: unknown) {
  const normalized = emptyToUndefined(value);
  const lower = String(normalized).toLowerCase();
  if (["true", "yes", "1"].includes(lower)) return true;
  if (["false", "no", "0"].includes(lower)) return false;
  return value;
}

const requiredBoolean = z.preprocess(parseBoolean, z.boolean());
const optionalBoolean = z.preprocess((value) => {
  const normalized = emptyToUndefined(value);
  if (normalized === undefined) return undefined;
  return parseBoolean(normalized);
}, z.boolean().optional());

const requiredHttpUrl = z.preprocess(emptyToUndefined, z.string().url().refine(
  (value) => value.startsWith("http://") || value.startsWith("https://"),
  "must use http:// or https://",
));
const optionalHttpUrl = z.preprocess(emptyToUndefined, z.string().url().refine(
  (value) => value.startsWith("http://") || value.startsWith("https://"),
  "must use http:// or https://",
).optional());

const isoDate = z.string().refine((value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}, "must be a valid YYYY-MM-DD date");

const rawRetailerLinkSchema = z.object({
  shoe_slug: z.preprocess(cleaned, z.string().min(1)),
  retailer: z.preprocess(cleaned, z.string().min(1)),
  retailer_slug: z.preprocess(cleaned, z.string().min(1)),
  retailer_homepage_url: optionalHttpUrl,
  create_retailer: requiredBoolean,
  retailer_active: optionalBoolean,
  affiliate_url: requiredHttpUrl,
  regular_url: optionalHttpUrl,
  displayed_price: z.preprocess((value) => {
    const normalized = emptyToUndefined(value);
    if (normalized === undefined) return undefined;
    if (typeof normalized !== "string") return normalized;
    const parsed = Number(normalized.replace(/[$,]/g, ""));
    return Number.isFinite(parsed) ? parsed : normalized;
  }, z.number().min(0).optional()),
  currency: z.preprocess((value) => String(cleaned(value)).toUpperCase(), z.string().regex(/^[A-Z]{3}$/)),
  is_primary: requiredBoolean,
  active: requiredBoolean,
  last_verified_at: z.preprocess(emptyToUndefined, isoDate.optional()),
}).strict();

export type NormalizedRetailerLinkImport = {
  sourceLine: number;
  shoeSlug: string;
  retailerName: string;
  retailerSlug: string;
  retailerHomepageUrl: string | null;
  createRetailer: boolean;
  retailerActive: boolean | null;
  affiliateUrl: string;
  regularUrl: string | null;
  displayedPrice: number | null;
  currency: string;
  isPrimary: boolean;
  active: boolean;
  lastVerifiedAt: string | null;
};

function issueMessage(error: z.ZodError) {
  return error.issues.map((issue) => `${issue.path.join(".") || "row"}: ${issue.message}`).join("; ");
}

export function retailerLinkIdentity(link: Pick<NormalizedRetailerLinkImport, "shoeSlug" | "retailerSlug">) {
  return `${link.shoeSlug}|${link.retailerSlug}`;
}

export function normalizeRetailerLinkRow(row: CsvRow): RowValidationResult<NormalizedRetailerLinkImport> {
  const result = rawRetailerLinkSchema.safeParse(row.values);

  if (!result.success) {
    return { success: false, line: row.line, message: issueMessage(result.error) };
  }

  const shoeSlug = normalizeSlug(result.data.shoe_slug);
  const retailerSlug = normalizeSlug(result.data.retailer_slug);

  if (!shoeSlug || !retailerSlug) {
    return { success: false, line: row.line, message: "shoe_slug and retailer_slug must contain letters or numbers" };
  }

  if (result.data.create_retailer && (!result.data.retailer_homepage_url || result.data.retailer_active === undefined)) {
    return {
      success: false,
      line: row.line,
      message: "retailer_homepage_url and retailer_active are required when create_retailer is true",
    };
  }

  return {
    success: true,
    data: {
      sourceLine: row.line,
      shoeSlug,
      retailerName: result.data.retailer,
      retailerSlug,
      retailerHomepageUrl: result.data.retailer_homepage_url ?? null,
      createRetailer: result.data.create_retailer,
      retailerActive: result.data.retailer_active ?? null,
      affiliateUrl: result.data.affiliate_url,
      regularUrl: result.data.regular_url ?? null,
      displayedPrice: result.data.displayed_price === undefined
        ? null
        : Math.round(result.data.displayed_price * 100) / 100,
      currency: result.data.currency,
      isPrimary: result.data.is_primary,
      active: result.data.active,
      lastVerifiedAt: result.data.last_verified_at
        ? `${result.data.last_verified_at}T00:00:00.000Z`
        : null,
    },
  };
}
