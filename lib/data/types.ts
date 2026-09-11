export type ShoeStatus = "active" | "discontinued" | "upcoming";
export type ShoeGender = "men" | "women" | "unisex";

export type ShoeSpecifications = Record<string, unknown>;

export type ShoeSummary = {
  id: string;
  slug: string;
  brandName: string;
  modelName: string;
  status: ShoeStatus;
  gender: ShoeGender;
  msrp: number | null;
  currency: string;
  shortDescription: string | null;
  imageUrl: string | null;
  specs: ShoeSpecifications;
};

export type ShoeMetric = {
  key: string;
  value: number;
  normalizedValue: number | null;
  unit: string | null;
  dataSource: string;
  effectiveDate: string;
  version: string;
  confidence: number | null;
  notes: string | null;
};

export type RetailerOffer = {
  id: string;
  retailerName: string;
  retailerSlug: string;
  affiliateUrl: string;
  regularUrl: string | null;
  displayedPrice: number | null;
  currency: string;
  isPrimary: boolean;
  lastVerifiedAt: string | null;
};

export type RankingPlacement = {
  categoryName: string;
  categorySlug: string;
  categoryDescription: string | null;
  runName: string;
  effectiveDate: string;
  methodologyVersion: string;
  rank: number;
  score: number;
};

export type RankingCategorySummary = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isDemo: boolean;
};

export type RankingRunSummary = {
  id: string;
  name: string;
  effectiveDate: string;
  methodologyVersion: string;
  notes: string | null;
  publishedAt: string;
};

export type RankingMovement =
  | {
      direction: "up" | "down" | "unchanged";
      places: number;
      previousRank: number;
    }
  | {
      direction: "new";
      places: null;
      previousRank: null;
    };

export type RankingComponentScore = {
  key: string;
  score: number;
};

export type RankingListItem = {
  id: string;
  rank: number;
  score: number;
  componentScores: RankingComponentScore[];
  movement: RankingMovement | null;
  shoe: ShoeSummary;
  primaryRetailerOffer: RetailerOffer | null;
};

export type RankingCategoryPageData = {
  category: RankingCategorySummary;
  currentRun: RankingRunSummary | null;
  previousRun: RankingRunSummary | null;
  results: RankingListItem[];
  isDemo: boolean;
};

export type ShoeDetail = ShoeSummary & {
  modelVersion: string | null;
  modelYear: number | null;
  fullDescription: string | null;
  releaseDate: string | null;
  metrics: ShoeMetric[];
  rankings: RankingPlacement[];
  retailerOffers: RetailerOffer[];
};
