export const OVERALL_SCORE_METHODOLOGY_VERSION = "overall-score-v1";

export const RATING_SOURCE_KEYS = [
  "running-warehouse",
  "fleet-feet",
  "zappos",
  "marathon-sports",
  "road-runner-sports",
] as const;

export const FIT_CLASSIFICATIONS = ["great", "ok", "bad"] as const;
export const CUSHION_CLASSIFICATIONS = ["plush", "balanced", "firm"] as const;

export const AVAILABILITY_RETAILER_SLUGS = [
  "running-warehouse",
  "road-runner-sports",
  "fleet-feet",
  "rei",
  "dicks-sporting-goods",
  "zappos",
  "amazon",
] as const;

export const RATING_TARGET_AGE_DAYS = 30;
export const RATING_WARNING_AGE_DAYS = 45;
export const RATING_MAX_AGE_DAYS = 90;

export type RatingSourceKey = (typeof RATING_SOURCE_KEYS)[number];
export type FitClassification = (typeof FIT_CLASSIFICATIONS)[number];
export type CushionClassification = (typeof CUSHION_CLASSIFICATIONS)[number];

export type RatingObservation = {
  sourceKey: RatingSourceKey;
  rating: number;
  reviewCount: number;
  observedAt: string;
};

export type OverallScoreCandidate = {
  shoeId: string;
  slug: string;
  weightValue: number | null;
  weightUnit: "g" | "oz" | null;
  legacyWeightOz?: number | null;
  modelYear: number | null;
  releaseDate: string | null;
  msrp: number | null;
  currency: string;
  fitClassification: FitClassification | null;
  cushionClassification: CushionClassification | null;
  ratingObservations: RatingObservation[];
  activeRetailerSlugs: string[];
};

export type OverallScoreBreakdown = {
  retailerFeedbackScore: number;
  popularityScore: number;
  specificationFeatureScore: number;
  finalScore: number;
  totalReviewCount: number;
  weightedRating: number;
  bayesianRating: number;
  activeAvailabilityCount: number;
  normalizedWeightOz: number;
  ratingWarnings: string[];
};

export type ScoreCandidateResult =
  | { eligible: true; score: OverallScoreBreakdown }
  | { eligible: false; reasons: string[] };

function round(value: number, precision = 4) {
  const multiplier = 10 ** precision;
  return Math.round(value * multiplier) / multiplier;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function dateAgeDays(effectiveDate: string, observedAt: string) {
  const effective = Date.parse(`${effectiveDate}T00:00:00Z`);
  const observed = Date.parse(`${observedAt}T00:00:00Z`);
  return Math.floor((effective - observed) / 86_400_000);
}

export function normalizeWeightOz(
  weightValue: number | null,
  weightUnit: "g" | "oz" | null,
  legacyWeightOz: number | null = null,
) {
  if (weightValue !== null && weightUnit === "oz") return weightValue;
  if (weightValue !== null && weightUnit === "g") return weightValue / 28.349523125;
  return legacyWeightOz;
}

export function scoreSpecificationFeatures(input: {
  weightOz: number;
  fit: FitClassification;
  cushion: CushionClassification;
  releaseYear: number;
  effectiveYear: number;
  msrp: number;
}) {
  const weightPoints = input.weightOz < 9.5 ? 2 : input.weightOz < 10.4 ? 1 : 0;
  const fitPoints = input.fit === "great" ? 2 : input.fit === "ok" ? 1 : 0;
  const cushionPoints = input.cushion === "plush" ? 2 : input.cushion === "balanced" ? 1 : 0;
  const age = input.effectiveYear - input.releaseYear;
  const recencyPoints = age <= 1 ? 2 : age === 2 ? 1 : 0;
  const pricePoints = input.msrp < 130 ? 2 : input.msrp < 160 ? 1 : 0;
  return (weightPoints + fitPoints + cushionPoints + recencyPoints + pricePoints) * 10;
}

export function scoreOverallCandidate(
  candidate: OverallScoreCandidate,
  effectiveDate: string,
  maximumReviewCount: number,
): ScoreCandidateResult {
  const reasons: string[] = [];
  const effectiveYear = Number(effectiveDate.slice(0, 4));
  const releaseYear = candidate.modelYear ?? (candidate.releaseDate ? Number(candidate.releaseDate.slice(0, 4)) : null);
  const weightOz = normalizeWeightOz(candidate.weightValue, candidate.weightUnit, candidate.legacyWeightOz ?? null);

  if (weightOz === null) reasons.push("missing weight");
  if (!candidate.fitClassification) reasons.push("missing fit classification");
  if (!candidate.cushionClassification) reasons.push("missing cushion classification");
  if (releaseYear === null || !Number.isFinite(releaseYear)) reasons.push("missing model year or release date");
  if (candidate.msrp === null) reasons.push("missing MSRP");
  if (candidate.currency !== "USD") reasons.push("MSRP currency must be USD");

  const latestBySource = new Map<RatingSourceKey, RatingObservation>();
  for (const observation of candidate.ratingObservations) {
    if (!RATING_SOURCE_KEYS.includes(observation.sourceKey)) continue;
    const age = dateAgeDays(effectiveDate, observation.observedAt);
    if (age < 0 || age > RATING_MAX_AGE_DAYS || observation.reviewCount <= 0) continue;
    const prior = latestBySource.get(observation.sourceKey);
    if (!prior || observation.observedAt > prior.observedAt) latestBySource.set(observation.sourceKey, observation);
  }
  const ratings = [...latestBySource.values()];
  if (!ratings.length) reasons.push("no current approved rating observation with reviews");
  if (maximumReviewCount <= 0) reasons.push("ranking population has no positive review-count maximum");

  if (reasons.length || weightOz === null || !candidate.fitClassification || !candidate.cushionClassification || releaseYear === null || candidate.msrp === null) {
    return { eligible: false, reasons };
  }

  const totalReviewCount = ratings.reduce((sum, row) => sum + row.reviewCount, 0);
  const weightedRating = ratings.reduce((sum, row) => sum + row.rating * row.reviewCount, 0) / totalReviewCount;
  const bayesianRating = (totalReviewCount * weightedRating + 100 * 4) / (totalReviewCount + 100);
  const retailerFeedbackScore = clamp(25 * (bayesianRating - 1), 0, 100);

  const reviewVolumeScore = 70 * Math.log1p(totalReviewCount) / Math.log1p(maximumReviewCount);
  const recognizedRetailers = new Set(AVAILABILITY_RETAILER_SLUGS);
  const activeAvailabilityCount = new Set(candidate.activeRetailerSlugs.filter((slug) => recognizedRetailers.has(slug as (typeof AVAILABILITY_RETAILER_SLUGS)[number]))).size;
  const popularityScore = clamp(reviewVolumeScore + 30 * activeAvailabilityCount / AVAILABILITY_RETAILER_SLUGS.length, 0, 100);
  const specificationFeatureScore = scoreSpecificationFeatures({
    weightOz,
    fit: candidate.fitClassification,
    cushion: candidate.cushionClassification,
    releaseYear,
    effectiveYear,
    msrp: candidate.msrp,
  });

  const ratingWarnings = ratings
    .filter((row) => dateAgeDays(effectiveDate, row.observedAt) > RATING_WARNING_AGE_DAYS)
    .map((row) => `${row.sourceKey} observation is older than ${RATING_WARNING_AGE_DAYS} days`);

  return {
    eligible: true,
    score: {
      retailerFeedbackScore: round(retailerFeedbackScore),
      popularityScore: round(popularityScore),
      specificationFeatureScore,
      finalScore: round((retailerFeedbackScore + popularityScore + specificationFeatureScore) / 3),
      totalReviewCount,
      weightedRating: round(weightedRating),
      bayesianRating: round(bayesianRating),
      activeAvailabilityCount,
      normalizedWeightOz: round(weightOz),
      ratingWarnings,
    },
  };
}

export function rankScoredCandidates<T extends { slug: string; score: OverallScoreBreakdown }>(candidates: T[]) {
  return [...candidates].sort((left, right) =>
    right.score.finalScore - left.score.finalScore ||
    right.score.totalReviewCount - left.score.totalReviewCount ||
    left.slug.localeCompare(right.slug),
  );
}
