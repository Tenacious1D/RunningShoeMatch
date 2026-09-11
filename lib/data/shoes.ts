import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { getCurrentRankingsForShoe } from "@/lib/data/rankings";
import { getActiveRetailerOffersForShoe } from "@/lib/data/retailers";
import type {
  ShoeDetail,
  ShoeGender,
  ShoeMetric,
  ShoeSpecifications,
  ShoeStatus,
  ShoeSummary,
} from "@/lib/data/types";
import { getSupabasePublicCredentials } from "@/lib/supabase/config";
import { createPublicClient } from "@/lib/supabase/public";

type ShoeRow = {
  id: string;
  slug: string;
  model_name: string;
  model_version: string | null;
  model_year: number | null;
  status: ShoeStatus;
  gender: ShoeGender;
  msrp: number | null;
  currency: string;
  short_description: string | null;
  full_description: string | null;
  primary_image_url: string | null;
  release_date: string | null;
  specs: ShoeSpecifications;
  primary_surface: string | null;
  support_category: string | null;
  weight_oz: number | null;
  weight_reference: string | null;
  heel_to_toe_drop_mm: number | null;
  heel_stack_height_mm: number | null;
  forefoot_stack_height_mm: number | null;
  available_widths: string[];
  spec_source_name: string | null;
  spec_source_url: string | null;
  spec_verified_at: string | null;
  spec_verification_status: "unverified" | "source_checked" | "cross_checked" | "development_demo";
  spec_notes: string | null;
  brand: {
    name: string;
  };
};

type ShoeMetricRow = {
  metric_key: string;
  metric_kind: "evaluative" | "use_case";
  value: number;
  normalized_value: number | null;
  unit: string | null;
  source_type: "manufacturer" | "review" | "lab_test" | "editorial_assessment" | "derived_methodology" | "development_demo";
  data_source: string;
  source_reference: string | null;
  effective_date: string;
  metric_version: string;
  confidence: number | null;
  verification_status: "unverified" | "source_checked" | "cross_checked" | "methodology_reviewed" | "development_demo";
  notes: string | null;
};

const shoeSelection = `
  id,
  slug,
  model_name,
  model_version,
  model_year,
  status,
  gender,
  msrp,
  currency,
  short_description,
  full_description,
  primary_image_url,
  release_date,
  specs,
  primary_surface,
  support_category,
  weight_oz,
  weight_reference,
  heel_to_toe_drop_mm,
  heel_stack_height_mm,
  forefoot_stack_height_mm,
  available_widths,
  spec_source_name,
  spec_source_url,
  spec_verified_at,
  spec_verification_status,
  spec_notes,
  brand:brands!inner(name)
`;

function toShoeSummary(row: ShoeRow): ShoeSummary {
  const specs: ShoeSpecifications = { ...row.specs };

  if (row.primary_surface !== null) specs.primary_surface = row.primary_surface;
  if (row.support_category !== null) specs.support_category = row.support_category;
  if (row.weight_oz !== null) specs.weight_oz = row.weight_oz;
  if (row.weight_reference !== null) specs.weight_reference = row.weight_reference;
  if (row.heel_to_toe_drop_mm !== null) specs.heel_to_toe_drop_mm = row.heel_to_toe_drop_mm;
  if (row.heel_stack_height_mm !== null) specs.heel_stack_height_mm = row.heel_stack_height_mm;
  if (row.forefoot_stack_height_mm !== null) specs.forefoot_stack_height_mm = row.forefoot_stack_height_mm;
  if (row.available_widths.length > 0) specs.available_widths = row.available_widths;

  return {
    id: row.id,
    slug: row.slug,
    brandName: row.brand.name,
    modelName: row.model_name,
    status: row.status,
    gender: row.gender,
    msrp: row.msrp,
    currency: row.currency,
    shortDescription: row.short_description,
    imageUrl: row.primary_image_url,
    specs,
  };
}

async function getLatestMetricsForShoe(shoeId: string): Promise<ShoeMetric[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("shoe-metrics", `shoe-metrics-${shoeId}`);

  const supabase = createPublicClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("shoe_metrics")
    .select(`
      metric_key,
      metric_kind,
      value,
      normalized_value,
      unit,
      source_type,
      data_source,
      source_reference,
      effective_date,
      metric_version,
      confidence,
      verification_status,
      notes
    `)
    .eq("shoe_id", shoeId)
    .eq("is_public", true)
    .order("effective_date", { ascending: false })
    .order("created_at", { ascending: false })
    .overrideTypes<ShoeMetricRow[], { merge: false }>();

  if (error) {
    throw new Error("Unable to load shoe metrics from Supabase.", {
      cause: error,
    });
  }

  const latestByKey = new Map<string, ShoeMetricRow>();

  for (const row of data) {
    if (!latestByKey.has(row.metric_key)) {
      latestByKey.set(row.metric_key, row);
    }
  }

  return Array.from(latestByKey.values())
    .sort((left, right) => left.metric_key.localeCompare(right.metric_key))
    .map((row) => ({
      key: row.metric_key,
      kind: row.metric_kind,
      value: row.value,
      normalizedValue: row.normalized_value,
      unit: row.unit,
      sourceType: row.source_type,
      dataSource: row.data_source,
      sourceReference: row.source_reference,
      effectiveDate: row.effective_date,
      version: row.metric_version,
      confidence: row.confidence,
      verificationStatus: row.verification_status,
      notes: row.notes,
    }));
}

export function isShoeCatalogConfigured() {
  return getSupabasePublicCredentials() !== null;
}

export async function getActiveShoes(limit?: number): Promise<ShoeSummary[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("shoes");

  const supabase = createPublicClient();

  if (!supabase) {
    return [];
  }

  let query = supabase
    .from("shoes")
    .select(shoeSelection)
    .eq("is_public", true)
    .eq("status", "active")
    .order("model_name", { ascending: true });

  if (typeof limit === "number") {
    query = query.limit(limit);
  }

  const { data, error } = await query.overrideTypes<
    ShoeRow[],
    { merge: false }
  >();

  if (error) {
    throw new Error("Unable to load the shoe catalog from Supabase.", {
      cause: error,
    });
  }

  return data.map(toShoeSummary);
}

export async function getPublicShoeSlugs(): Promise<string[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("shoes");

  const supabase = createPublicClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("shoes")
    .select("slug")
    .eq("is_public", true)
    .order("slug")
    .overrideTypes<Array<{ slug: string }>, { merge: false }>();

  if (error) {
    throw new Error("Unable to load public shoe slugs from Supabase.", {
      cause: error,
    });
  }

  return data.map(({ slug }) => slug);
}

export async function getShoeBySlug(slug: string): Promise<ShoeDetail | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("shoes", `shoe-${slug}`);

  const supabase = createPublicClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("shoes")
    .select(shoeSelection)
    .eq("slug", slug)
    .eq("is_public", true)
    .maybeSingle()
    .overrideTypes<ShoeRow, { merge: false }>();

  if (error) {
    throw new Error("Unable to load the shoe profile from Supabase.", {
      cause: error,
    });
  }

  if (!data) {
    return null;
  }

  const [metrics, rankings, retailerOffers] = await Promise.all([
    getLatestMetricsForShoe(data.id),
    getCurrentRankingsForShoe(data.id),
    getActiveRetailerOffersForShoe(data.id),
  ]);

  return {
    ...toShoeSummary(data),
    modelVersion: data.model_version,
    modelYear: data.model_year,
    fullDescription: data.full_description,
    releaseDate: data.release_date,
    specificationProvenance: {
      sourceName: data.spec_source_name,
      sourceUrl: data.spec_source_url,
      verifiedAt: data.spec_verified_at,
      verificationStatus: data.spec_verification_status,
      notes: data.spec_notes,
    },
    metrics,
    rankings,
    retailerOffers,
  };
}
