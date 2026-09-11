import "server-only";

import { requireAdmin } from "@/lib/admin/auth";

export type AdminDashboardSummary = {
  activeShoes: number;
  brands: number;
  retailerLinks: number;
  rankingRuns: number;
  draftRankingRuns: number;
  latestPublishedRankingDate: string | null;
};

export type AdminShoeListItem = {
  id: string;
  brandName: string;
  modelName: string;
  status: string;
  msrp: number | null;
  currency: string;
};

export type AdminRankingRunListItem = {
  id: string;
  name: string;
  effectiveDate: string;
  methodologyVersion: string;
  status: "draft" | "published";
  resultCount: number;
};

type AdminShoeRow = {
  id: string;
  model_name: string;
  status: string;
  msrp: number | string | null;
  currency: string;
  brands: { name: string } | { name: string }[] | null;
};

type AdminRankingRunRow = {
  id: string;
  name: string;
  effective_date: string;
  methodology_version: string;
  status: "draft" | "published";
  ranking_results: { count: number }[] | null;
};

function assertQuery(error: { message: string } | null, label: string) {
  if (error) throw new Error(`Unable to load ${label}: ${error.message}`);
}

export async function getAdminDashboardSummary(): Promise<AdminDashboardSummary> {
  const { supabase } = await requireAdmin();
  const [activeShoes, brands, retailerLinks, rankingRuns, draftRuns, latestPublished] = await Promise.all([
    supabase.from("shoes").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("brands").select("id", { count: "exact", head: true }),
    supabase.from("shoe_retailer_links").select("id", { count: "exact", head: true }),
    supabase.from("ranking_runs").select("id", { count: "exact", head: true }),
    supabase.from("ranking_runs").select("id", { count: "exact", head: true }).eq("status", "draft"),
    supabase.from("ranking_runs").select("effective_date").eq("status", "published").order("effective_date", { ascending: false }).limit(1).maybeSingle(),
  ]);

  assertQuery(activeShoes.error, "active shoe count");
  assertQuery(brands.error, "brand count");
  assertQuery(retailerLinks.error, "retailer-link count");
  assertQuery(rankingRuns.error, "ranking-run count");
  assertQuery(draftRuns.error, "draft ranking-run count");
  assertQuery(latestPublished.error, "latest published ranking date");

  return {
    activeShoes: activeShoes.count ?? 0,
    brands: brands.count ?? 0,
    retailerLinks: retailerLinks.count ?? 0,
    rankingRuns: rankingRuns.count ?? 0,
    draftRankingRuns: draftRuns.count ?? 0,
    latestPublishedRankingDate: latestPublished.data?.effective_date ?? null,
  };
}

export async function listAdminShoes(): Promise<AdminShoeListItem[]> {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("shoes")
    .select("id, model_name, status, msrp, currency, brands(name)")
    .order("model_name", { ascending: true });

  assertQuery(error, "admin shoe list");

  return ((data ?? []) as AdminShoeRow[]).map((row) => {
    const brand = Array.isArray(row.brands) ? row.brands[0] : row.brands;
    const parsedMsrp = row.msrp === null ? null : Number(row.msrp);

    return {
      id: row.id,
      brandName: brand?.name ?? "Unknown brand",
      modelName: row.model_name,
      status: row.status,
      msrp: Number.isFinite(parsedMsrp) ? parsedMsrp : null,
      currency: row.currency,
    };
  });
}

export async function listAdminRankingRuns(): Promise<AdminRankingRunListItem[]> {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("ranking_runs")
    .select("id, name, effective_date, methodology_version, status, ranking_results(count)")
    .order("effective_date", { ascending: false })
    .order("created_at", { ascending: false });

  assertQuery(error, "admin ranking runs");

  return ((data ?? []) as AdminRankingRunRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    effectiveDate: row.effective_date,
    methodologyVersion: row.methodology_version,
    status: row.status,
    resultCount: row.ranking_results?.[0]?.count ?? 0,
  }));
}
