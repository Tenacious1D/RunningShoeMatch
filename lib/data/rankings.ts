import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import type {
  RankingCategoryPageData,
  RankingCategorySummary,
  RankingListItem,
  RankingMovement,
  RankingPlacement,
  RankingRunSummary,
  RetailerOffer,
  ShoeGender,
  ShoeSpecifications,
  ShoeStatus,
  ShoeSummary,
} from "@/lib/data/types";
import { createPublicClient } from "@/lib/supabase/public";

type RankingCategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

type RankingRunRow = {
  id: string;
  name: string;
  effective_date: string;
  methodology_version: string;
  notes: string | null;
  published_at: string;
  results: Array<{ ranking_category_id: string }>;
};

type RetailerLinkRow = {
  id: string;
  affiliate_url: string;
  regular_url: string | null;
  displayed_price: number | null;
  currency: string;
  is_primary: boolean;
  last_verified_at: string | null;
  retailer: {
    name: string;
    slug: string;
  };
};

type RankedShoeRow = {
  id: string;
  slug: string;
  model_name: string;
  status: ShoeStatus;
  gender: ShoeGender;
  msrp: number | null;
  currency: string;
  short_description: string | null;
  primary_image_url: string | null;
  specs: ShoeSpecifications;
  brand: {
    name: string;
  };
  retailer_links: RetailerLinkRow[];
};

type RankingListRow = {
  id: string;
  rank: number;
  score: number;
  component_scores: Record<string, unknown>;
  metadata: Record<string, unknown>;
  shoe: RankedShoeRow;
};

type PreviousRankingRow = {
  shoe_id: string;
  rank: number;
};

type ShoeRankingHistoryRow = {
  rank: number;
  score: number;
  category: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
  };
  run: {
    name: string;
    effective_date: string;
    methodology_version: string;
  };
};

function isDemoText(value: string | null) {
  return value ? /development[\s/]demo/i.test(value) : false;
}

function toCategorySummary(row: RankingCategoryRow): RankingCategorySummary {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    isDemo: isDemoText(row.name) || isDemoText(row.description),
  };
}

function toRunSummary(row: RankingRunRow): RankingRunSummary {
  return {
    id: row.id,
    name: row.name,
    effectiveDate: row.effective_date,
    methodologyVersion: row.methodology_version,
    notes: row.notes,
    publishedAt: row.published_at,
  };
}

function toShoeSummary(row: RankedShoeRow): ShoeSummary {
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

function toRetailerOffer(row: RetailerLinkRow): RetailerOffer {
  return {
    id: row.id,
    retailerName: row.retailer.name,
    retailerSlug: row.retailer.slug,
    affiliateUrl: row.affiliate_url,
    regularUrl: row.regular_url,
    displayedPrice: row.displayed_price,
    currency: row.currency,
    isPrimary: row.is_primary,
    lastVerifiedAt: row.last_verified_at,
  };
}

function choosePrimaryOffer(rows: RetailerLinkRow[]) {
  const sorted = [...rows].sort((left, right) => {
    if (left.is_primary !== right.is_primary) {
      return left.is_primary ? -1 : 1;
    }

    if (left.displayed_price === null) return 1;
    if (right.displayed_price === null) return -1;
    return left.displayed_price - right.displayed_price;
  });

  return sorted[0] ? toRetailerOffer(sorted[0]) : null;
}

function deriveMovement(
  currentRank: number,
  previousRank: number | undefined,
  hasPreviousRun: boolean,
): RankingMovement | null {
  if (!hasPreviousRun) {
    return null;
  }

  if (previousRank === undefined) {
    return { direction: "new", places: null, previousRank: null };
  }

  const change = previousRank - currentRank;

  if (change === 0) {
    return { direction: "unchanged", places: 0, previousRank };
  }

  return {
    direction: change > 0 ? "up" : "down",
    places: Math.abs(change),
    previousRank,
  };
}

function toComponentScores(componentScores: Record<string, unknown>) {
  return Object.entries(componentScores).flatMap(([key, value]) =>
    typeof value === "number" && Number.isFinite(value)
      ? [{ key, score: value }]
      : [],
  );
}

export async function getActiveRankingCategories(): Promise<
  RankingCategorySummary[]
> {
  "use cache";
  cacheLife("hours");
  cacheTag("ranking-categories", "rankings");

  const supabase = createPublicClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("ranking_categories")
    .select("id, name, slug, description")
    .eq("active", true)
    .order("name")
    .overrideTypes<RankingCategoryRow[], { merge: false }>();

  if (error) {
    throw new Error("Unable to load ranking categories from Supabase.", {
      cause: error,
    });
  }

  return data.map(toCategorySummary);
}

export async function getRankingCategoryBySlug(
  slug: string,
): Promise<RankingCategorySummary | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("ranking-categories", "rankings", `ranking-${slug}`);

  const supabase = createPublicClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("ranking_categories")
    .select("id, name, slug, description")
    .eq("active", true)
    .eq("slug", slug)
    .maybeSingle()
    .overrideTypes<RankingCategoryRow, { merge: false }>();

  if (error) {
    throw new Error("Unable to load the ranking category from Supabase.", {
      cause: error,
    });
  }

  return data ? toCategorySummary(data) : null;
}

async function getPublishedRunsForCategory(
  categoryId: string,
): Promise<RankingRunRow[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("rankings", `category-runs-${categoryId}`);

  const supabase = createPublicClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("ranking_runs")
    .select(`
      id,
      name,
      effective_date,
      methodology_version,
      notes,
      published_at,
      results:ranking_results!inner(ranking_category_id)
    `)
    .eq("status", "published")
    .eq("results.ranking_category_id", categoryId)
    .order("effective_date", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(2)
    .overrideTypes<RankingRunRow[], { merge: false }>();

  if (error) {
    throw new Error("Unable to load published ranking snapshots from Supabase.", {
      cause: error,
    });
  }

  return data;
}

async function getRankingRows(
  runId: string,
  categoryId: string,
): Promise<RankingListRow[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("rankings", `ranking-results-${runId}-${categoryId}`);

  const supabase = createPublicClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("ranking_results")
    .select(`
      id,
      rank,
      score,
      component_scores,
      metadata,
      shoe:shoes!inner(
        id,
        slug,
        model_name,
        status,
        gender,
        msrp,
        currency,
        short_description,
        primary_image_url,
        specs,
        brand:brands!inner(name),
        retailer_links:shoe_retailer_links(
          id,
          affiliate_url,
          regular_url,
          displayed_price,
          currency,
          is_primary,
          last_verified_at,
          retailer:retailers!inner(name, slug)
        )
      )
    `)
    .eq("ranking_run_id", runId)
    .eq("ranking_category_id", categoryId)
    .order("rank", { ascending: true })
    .overrideTypes<RankingListRow[], { merge: false }>();

  if (error) {
    throw new Error("Unable to load ranked shoes from Supabase.", {
      cause: error,
    });
  }

  return data;
}

async function getPreviousRanks(
  runId: string,
  categoryId: string,
): Promise<Map<string, number>> {
  "use cache";
  cacheLife("hours");
  cacheTag("rankings", `ranking-results-${runId}-${categoryId}`);

  const supabase = createPublicClient();

  if (!supabase) {
    return new Map();
  }

  const { data, error } = await supabase
    .from("ranking_results")
    .select("shoe_id, rank")
    .eq("ranking_run_id", runId)
    .eq("ranking_category_id", categoryId)
    .overrideTypes<PreviousRankingRow[], { merge: false }>();

  if (error) {
    throw new Error("Unable to load the previous ranking snapshot from Supabase.", {
      cause: error,
    });
  }

  return new Map(data.map((row) => [row.shoe_id, row.rank]));
}

export async function getRankingPageBySlug(
  slug: string,
): Promise<RankingCategoryPageData | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("rankings", `ranking-${slug}`);

  const category = await getRankingCategoryBySlug(slug);

  if (!category) {
    return null;
  }

  const runs = await getPublishedRunsForCategory(category.id);
  const currentRunRow = runs[0];
  const previousRunRow = runs[1];

  if (!currentRunRow) {
    return {
      category,
      currentRun: null,
      previousRun: null,
      results: [],
      isDemo: category.isDemo,
    };
  }

  const [rows, previousRanks] = await Promise.all([
    getRankingRows(currentRunRow.id, category.id),
    previousRunRow
      ? getPreviousRanks(previousRunRow.id, category.id)
      : Promise.resolve(new Map<string, number>()),
  ]);

  const results: RankingListItem[] = rows.map((row) => ({
    id: row.id,
    rank: row.rank,
    score: row.score,
    componentScores: toComponentScores(row.component_scores),
    movement: deriveMovement(
      row.rank,
      previousRanks.get(row.shoe.id),
      Boolean(previousRunRow),
    ),
    shoe: toShoeSummary(row.shoe),
    primaryRetailerOffer: choosePrimaryOffer(row.shoe.retailer_links),
  }));

  const isDemo =
    category.isDemo ||
    isDemoText(currentRunRow.name) ||
    isDemoText(currentRunRow.notes) ||
    rows.some((row) => row.metadata.development_demo === true);

  return {
    category,
    currentRun: toRunSummary(currentRunRow),
    previousRun: previousRunRow ? toRunSummary(previousRunRow) : null,
    results,
    isDemo,
  };
}

export async function getCurrentRankingsForShoe(
  shoeId: string,
): Promise<RankingPlacement[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("rankings", `shoe-rankings-${shoeId}`);

  const supabase = createPublicClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("ranking_results")
    .select(`
      rank,
      score,
      category:ranking_categories!inner(id, name, slug, description),
      run:ranking_runs!inner(name, effective_date, methodology_version)
    `)
    .eq("shoe_id", shoeId)
    .order("rank", { ascending: true })
    .overrideTypes<ShoeRankingHistoryRow[], { merge: false }>();

  if (error) {
    throw new Error("Unable to load ranking placements from Supabase.", {
      cause: error,
    });
  }

  const newestByCategory = new Map<string, ShoeRankingHistoryRow>();

  for (const row of data) {
    const existing = newestByCategory.get(row.category.id);

    if (!existing || row.run.effective_date > existing.run.effective_date) {
      newestByCategory.set(row.category.id, row);
    }
  }

  return Array.from(newestByCategory.values())
    .sort((left, right) => left.rank - right.rank)
    .map((row) => ({
      categoryName: row.category.name,
      categorySlug: row.category.slug,
      categoryDescription: row.category.description,
      runName: row.run.name,
      effectiveDate: row.run.effective_date,
      methodologyVersion: row.run.methodology_version,
      rank: row.rank,
      score: row.score,
    }));
}

