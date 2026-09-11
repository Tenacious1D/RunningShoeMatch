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
  brand: {
    name: string;
  };
};

type ShoeMetricRow = {
  metric_key: string;
  value: number;
  normalized_value: number | null;
  unit: string | null;
  data_source: string;
  effective_date: string;
  metric_version: string;
  confidence: number | null;
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
  brand:brands!inner(name)
`;

function toShoeSummary(row: ShoeRow): ShoeSummary {
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
    specs: row.specs,
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
      value,
      normalized_value,
      unit,
      data_source,
      effective_date,
      metric_version,
      confidence,
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
      value: row.value,
      normalizedValue: row.normalized_value,
      unit: row.unit,
      dataSource: row.data_source,
      effectiveDate: row.effective_date,
      version: row.metric_version,
      confidence: row.confidence,
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
    metrics,
    rankings,
    retailerOffers,
  };
}

