import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeWeightOz,
  rankScoredCandidates,
  scoreOverallCandidate,
  scoreSpecificationFeatures,
  type OverallScoreCandidate,
} from "../../lib/rankings/overall-score-v1";

function candidate(overrides: Partial<OverallScoreCandidate> = {}): OverallScoreCandidate {
  return {
    shoeId: "shoe-1",
    slug: "shoe-one",
    weightValue: 9,
    weightUnit: "oz",
    modelYear: 2026,
    releaseDate: "2026-01-01",
    msrp: 129,
    currency: "USD",
    fitClassification: "great",
    cushionClassification: "plush",
    ratingObservations: [
      { sourceKey: "running-warehouse", rating: 4.5, reviewCount: 100, observedAt: "2026-09-01" },
      { sourceKey: "fleet-feet", rating: 4, reviewCount: 50, observedAt: "2026-09-02" },
    ],
    activeRetailerSlugs: ["running-warehouse", "fleet-feet", "amazon"],
    ...overrides,
  };
}

test("preserves source weight while deriving ounces only in the score layer", () => {
  assert.equal(normalizeWeightOz(238, "g"), 238 / 28.349523125);
  assert.equal(normalizeWeightOz(8.4, "oz"), 8.4);
  assert.equal(normalizeWeightOz(null, null, 9.1), 9.1);
});

test("reproduces the approved specification feature point bands", () => {
  assert.equal(scoreSpecificationFeatures({
    weightOz: 9.49,
    fit: "great",
    cushion: "plush",
    releaseYear: 2025,
    effectiveYear: 2026,
    msrp: 129.99,
  }), 100);
  assert.equal(scoreSpecificationFeatures({
    weightOz: 10,
    fit: "ok",
    cushion: "balanced",
    releaseYear: 2024,
    effectiveYear: 2026,
    msrp: 159.99,
  }), 50);
});

test("calculates RFS, popularity, SFS, and equal-third final score", () => {
  const result = scoreOverallCandidate(candidate(), "2026-09-23", 300);
  assert.equal(result.eligible, true);
  if (!result.eligible) return;
  assert.equal(result.score.totalReviewCount, 150);
  assert.equal(result.score.weightedRating, 4.3333);
  assert.equal(result.score.bayesianRating, 4.2);
  assert.equal(result.score.retailerFeedbackScore, 80);
  assert.equal(result.score.specificationFeatureScore, 100);
  assert.ok(result.score.popularityScore > 74 && result.score.popularityScore < 75);
  assert.ok(result.score.finalScore > 84 && result.score.finalScore < 85);
});

test("excludes stale ratings and candidates missing required inputs", () => {
  const result = scoreOverallCandidate(candidate({
    weightValue: null,
    weightUnit: null,
    ratingObservations: [
      { sourceKey: "zappos", rating: 5, reviewCount: 1000, observedAt: "2026-01-01" },
    ],
  }), "2026-09-23", 1000);
  assert.equal(result.eligible, false);
  if (result.eligible) return;
  assert.match(result.reasons.join(" "), /missing weight/);
  assert.match(result.reasons.join(" "), /no current approved rating/);
});

test("breaks equal-score ties by review count, then slug", () => {
  const score = {
    retailerFeedbackScore: 80,
    popularityScore: 80,
    specificationFeatureScore: 80,
    finalScore: 80,
    totalReviewCount: 10,
    weightedRating: 4,
    bayesianRating: 4,
    activeAvailabilityCount: 1,
    normalizedWeightOz: 9,
    ratingWarnings: [],
  };
  const ranked = rankScoredCandidates([
    { slug: "z-shoe", score },
    { slug: "a-shoe", score: { ...score, totalReviewCount: 20 } },
    { slug: "b-shoe", score },
  ]);
  assert.deepEqual(ranked.map((row) => row.slug), ["a-shoe", "b-shoe", "z-shoe"]);
});
