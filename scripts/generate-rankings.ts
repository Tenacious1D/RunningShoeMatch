import type { SupabaseClient } from "@supabase/supabase-js";

import {
  OVERALL_SCORE_METHODOLOGY_VERSION,
  RATING_MAX_AGE_DAYS,
  rankScoredCandidates,
  scoreOverallCandidate,
  type CushionClassification,
  type FitClassification,
  type OverallScoreCandidate,
  type OverallScoreBreakdown,
  type RatingSourceKey,
} from "../lib/rankings/overall-score-v1";
import { buildRankingSnapshot, type NormalizedRankingRow } from "./import/ranking-schema";
import { createEmptyReport } from "./import/cli";
import { printImportSummary, writeImportReport } from "./import/report";
import { createImportClient } from "./import/supabase";

type Mode = "dry-run" | "apply";
type Arguments = { mode: Mode; effectiveDate: string; runName: string };
type ShoeRow = {
  id: string;
  slug: string;
  weight_value: number | string | null;
  weight_unit: "g" | "oz" | null;
  weight_oz: number | string | null;
  model_year: number | null;
  release_date: string | null;
  msrp: number | string | null;
  currency: string;
};
type InputRow = {
  shoe_id: string;
  methodology_version: string;
  effective_date: string;
  fit_classification: FitClassification;
  cushion_classification: CushionClassification;
};
type ReviewRow = {
  shoe_id: string;
  source_key: RatingSourceKey;
  rating: number | string;
  review_count: number;
  observed_at: string;
};
type RetailerLinkRow = {
  shoe_id: string;
  retailers: { slug: string; active: boolean } | { slug: string; active: boolean }[] | null;
};
type CategoryRow = { id: string; slug: string };
type EligibilityRow = {
  shoe_id: string;
  ranking_category_id: string;
  effective_date: string;
};
type ScoredCandidate = { shoeId: string; slug: string; score: OverallScoreBreakdown };

function parseArguments(argv: string[]): Arguments {
  const dryRun = argv.includes("--dry-run");
  const apply = argv.includes("--apply");
  const effectiveIndex = argv.indexOf("--effective-date");
  const nameIndex = argv.indexOf("--name");
  const effectiveDate = effectiveIndex >= 0 ? argv[effectiveIndex + 1] : "";
  const runName = nameIndex >= 0 ? argv[nameIndex + 1] : `Automated rankings ${effectiveDate}`;
  const consumed = new Set(["--dry-run", "--apply", "--effective-date", effectiveDate]);
  if (nameIndex >= 0) {
    consumed.add("--name");
    consumed.add(runName);
  }
  const unknown = argv.filter((argument) => !consumed.has(argument));
  const parsed = Date.parse(`${effectiveDate}T00:00:00Z`);
  if (dryRun === apply || !/^\d{4}-\d{2}-\d{2}$/.test(effectiveDate) ||
      Number.isNaN(parsed) || new Date(parsed).toISOString().slice(0, 10) !== effectiveDate ||
      !runName.trim() || unknown.length) {
    throw new Error("Usage: npm run rankings:generate -- --effective-date YYYY-MM-DD [--name \"Run name\"] --dry-run|--apply");
  }
  return { mode: dryRun ? "dry-run" : "apply", effectiveDate, runName: runName.trim() };
}

function numberOrNull(value: number | string | null) {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function latestByShoe<T extends { shoe_id: string; effective_date: string }>(rows: T[]) {
  const latest = new Map<string, T>();
  for (const row of rows) {
    const existing = latest.get(row.shoe_id);
    if (!existing || row.effective_date > existing.effective_date) latest.set(row.shoe_id, row);
  }
  return latest;
}

function currentReviewCount(candidate: OverallScoreCandidate, effectiveDate: string) {
  const effective = Date.parse(`${effectiveDate}T00:00:00Z`);
  const latest = new Map<string, { count: number; date: string }>();
  for (const observation of candidate.ratingObservations) {
    const observed = Date.parse(`${observation.observedAt}T00:00:00Z`);
    const age = Math.floor((effective - observed) / 86_400_000);
    if (age < 0 || age > RATING_MAX_AGE_DAYS || observation.reviewCount <= 0) continue;
    const prior = latest.get(observation.sourceKey);
    if (!prior || observation.observedAt > prior.date) {
      latest.set(observation.sourceKey, { count: observation.reviewCount, date: observation.observedAt });
    }
  }
  return [...latest.values()].reduce((sum, row) => sum + row.count, 0);
}

async function loadData(client: SupabaseClient, effectiveDate: string) {
  const earliest = new Date(`${effectiveDate}T00:00:00Z`);
  earliest.setUTCDate(earliest.getUTCDate() - RATING_MAX_AGE_DAYS);
  const earliestDate = earliest.toISOString().slice(0, 10);
  const [shoes, inputs, reviews, links, categories, eligibility] = await Promise.all([
    client.from("shoes")
      .select("id, slug, weight_value, weight_unit, weight_oz, model_year, release_date, msrp, currency")
      .eq("status", "active").eq("is_public", true),
    client.from("shoe_ranking_inputs")
      .select("shoe_id, methodology_version, effective_date, fit_classification, cushion_classification")
      .eq("methodology_version", OVERALL_SCORE_METHODOLOGY_VERSION).lte("effective_date", effectiveDate),
    client.from("shoe_review_observations")
      .select("shoe_id, source_key, rating, review_count, observed_at")
      .gte("observed_at", earliestDate).lte("observed_at", effectiveDate),
    client.from("shoe_retailer_links")
      .select("shoe_id, retailers(slug, active)").eq("active", true),
    client.from("ranking_categories").select("id, slug").eq("active", true),
    client.from("shoe_ranking_category_eligibility")
      .select("shoe_id, ranking_category_id, effective_date")
      .eq("methodology_version", OVERALL_SCORE_METHODOLOGY_VERSION).lte("effective_date", effectiveDate),
  ]);
  for (const [label, query] of [
    ["shoes", shoes], ["ranking inputs", inputs], ["review observations", reviews],
    ["retailer availability", links], ["categories", categories], ["category eligibility", eligibility],
  ] as const) {
    if (query.error) throw new Error(`Unable to load ${label}: ${query.error.message}. Apply the automated-ranking migration first.`);
  }
  return {
    shoes: shoes.data as ShoeRow[],
    inputs: inputs.data as InputRow[],
    reviews: reviews.data as ReviewRow[],
    links: links.data as RetailerLinkRow[],
    categories: categories.data as CategoryRow[],
    eligibility: eligibility.data as EligibilityRow[],
  };
}

async function run() {
  let args: Arguments;
  try {
    args = parseArguments(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Invalid ranking generation arguments.");
    process.exitCode = 1;
    return;
  }

  const report = createEmptyReport("ranking-generation", args.mode, "Supabase scoring inputs");
  try {
    const client = createImportClient();
    const data = await loadData(client, args.effectiveDate);
    const inputsByShoe = latestByShoe(data.inputs);
    const reviewsByShoe = new Map<string, ReviewRow[]>();
    for (const row of data.reviews) reviewsByShoe.set(row.shoe_id, [...(reviewsByShoe.get(row.shoe_id) ?? []), row]);
    const retailersByShoe = new Map<string, string[]>();
    for (const row of data.links) {
      const retailer = Array.isArray(row.retailers) ? row.retailers[0] : row.retailers;
      if (retailer?.active) retailersByShoe.set(row.shoe_id, [...(retailersByShoe.get(row.shoe_id) ?? []), retailer.slug]);
    }

    const candidates: OverallScoreCandidate[] = data.shoes.map((shoe) => {
      const input = inputsByShoe.get(shoe.id);
      return {
        shoeId: shoe.id,
        slug: shoe.slug,
        weightValue: numberOrNull(shoe.weight_value),
        weightUnit: shoe.weight_unit,
        legacyWeightOz: numberOrNull(shoe.weight_oz),
        modelYear: shoe.model_year,
        releaseDate: shoe.release_date,
        msrp: numberOrNull(shoe.msrp),
        currency: shoe.currency,
        fitClassification: input?.fit_classification ?? null,
        cushionClassification: input?.cushion_classification ?? null,
        ratingObservations: (reviewsByShoe.get(shoe.id) ?? []).map((row) => ({
          sourceKey: row.source_key,
          rating: Number(row.rating),
          reviewCount: row.review_count,
          observedAt: row.observed_at,
        })),
        activeRetailerSlugs: retailersByShoe.get(shoe.id) ?? [],
      };
    });

    const latestEligibilityDate = new Map<string, string>();
    for (const row of data.eligibility) {
      const current = latestEligibilityDate.get(row.shoe_id);
      if (!current || row.effective_date > current) latestEligibilityDate.set(row.shoe_id, row.effective_date);
    }
    const shoesWithCurrentEligibility = new Set(
      data.eligibility
        .filter((row) => row.effective_date === latestEligibilityDate.get(row.shoe_id))
        .map((row) => row.shoe_id),
    );
    const scoreEligibleCandidates = candidates.filter((candidate) =>
      shoesWithCurrentEligibility.has(candidate.shoeId) &&
      scoreOverallCandidate(candidate, args.effectiveDate, 1).eligible,
    );
    const maximumReviewCount = Math.max(0, ...scoreEligibleCandidates.map((candidate) => currentReviewCount(candidate, args.effectiveDate)));
    const scored = new Map<string, ScoredCandidate>();
    const exclusions: string[] = [];
    for (const candidate of candidates) {
      if (!shoesWithCurrentEligibility.has(candidate.shoeId)) {
        exclusions.push(`Excluded ${candidate.slug}: missing reviewed category eligibility.`);
        continue;
      }
      const result = scoreOverallCandidate(candidate, args.effectiveDate, maximumReviewCount);
      if (result.eligible) scored.set(candidate.shoeId, { shoeId: candidate.shoeId, slug: candidate.slug, score: result.score });
      else exclusions.push(`Excluded ${candidate.slug}: ${result.reasons.join(", ")}.`);
    }

    const categoriesById = new Map(data.categories.map((category) => [category.id, category]));
    const eligibleByCategory = new Map<string, ScoredCandidate[]>();
    for (const row of data.eligibility) {
      if (row.effective_date !== latestEligibilityDate.get(row.shoe_id)) continue;
      const category = categoriesById.get(row.ranking_category_id);
      const candidate = scored.get(row.shoe_id);
      if (category && candidate) eligibleByCategory.set(category.slug, [...(eligibleByCategory.get(category.slug) ?? []), candidate]);
    }

    const runNotes = `Generated by ${OVERALL_SCORE_METHODOLOGY_VERSION}; draft requires human review before publication.`;
    const resultRows: NormalizedRankingRow[] = [];
    for (const [categorySlug, members] of [...eligibleByCategory.entries()].sort(([left], [right]) => left.localeCompare(right))) {
      const ranked = rankScoredCandidates(members);
      ranked.forEach((candidate, index) => {
        resultRows.push({
          sourceLine: index + 1,
          runName: args.runName,
          effectiveDate: args.effectiveDate,
          methodologyVersion: OVERALL_SCORE_METHODOLOGY_VERSION,
          runNotes,
          categorySlug,
          shoeSlug: candidate.slug,
          rank: index + 1,
          score: candidate.score.finalScore,
          componentScores: {
            retailer_feedback_score: candidate.score.retailerFeedbackScore,
            popularity_score: candidate.score.popularityScore,
            specification_feature_score: candidate.score.specificationFeatureScore,
          },
          resultNotes: JSON.stringify({
            total_review_count: candidate.score.totalReviewCount,
            active_availability_count: candidate.score.activeAvailabilityCount,
            normalized_weight_oz: candidate.score.normalizedWeightOz,
            rating_warnings: candidate.score.ratingWarnings,
          }),
        });
      });
    }
    if (!resultRows.length) throw new Error("No ranking results were generated. Review exclusions and category eligibility.");
    const snapshot = buildRankingSnapshot(resultRows);
    if (!snapshot.success) throw new Error(snapshot.errors.join(" "));

    const { data: existing, error: existingError } = await client.from("ranking_runs")
      .select("id, status").eq("import_hash", snapshot.data.importHash).maybeSingle();
    if (existingError) throw new Error(`Unable to check generated snapshot history: ${existingError.message}`);
    if (existing) {
      report.skipped = resultRows.length;
      report.rankingRunId = existing.id;
      console.log(`Identical generated snapshot already exists as ${existing.id} (${existing.status}).`);
    } else if (args.mode === "dry-run") {
      report.added = resultRows.length;
    } else {
      const categoryIds = new Map(data.categories.map((category) => [category.slug, category.id]));
      const shoeIds = new Map(data.shoes.map((shoe) => [shoe.slug, shoe.id]));
      const { data: imported, error } = await client.rpc("import_ranking_snapshot", {
        p_name: snapshot.data.runName,
        p_effective_date: snapshot.data.effectiveDate,
        p_methodology_version: snapshot.data.methodologyVersion,
        p_notes: snapshot.data.runNotes,
        p_import_hash: snapshot.data.importHash,
        p_results: snapshot.data.rows.map((row) => ({
          ranking_category_id: categoryIds.get(row.categorySlug),
          shoe_id: shoeIds.get(row.shoeSlug),
          rank: row.rank,
          score: row.score,
          component_scores: row.componentScores,
          metadata: row.resultNotes ? JSON.parse(row.resultNotes) : {},
        })),
      });
      if (error) throw new Error(`Generated snapshot transaction failed: ${error.message}`);
      const response = imported as { ranking_run_id?: string; created?: boolean } | null;
      if (!response?.ranking_run_id) throw new Error("Generated snapshot did not return a ranking run ID.");
      report.rankingRunId = response.ranking_run_id;
      report.added = response.created === false ? 0 : resultRows.length;
      report.skipped = response.created === false ? resultRows.length : 0;
      console.log(`Created DRAFT ranking run ${response.ranking_run_id}. It was not published.`);
    }

    console.log(`Scored ${scored.size} of ${candidates.length} public active shoes into ${eligibleByCategory.size} categories.`);
    if (exclusions.length) {
      console.log("Eligibility exclusions and freshness warnings are informational for generation:");
      exclusions.forEach((message) => console.log(`- ${message}`));
    }
  } catch (error) {
    report.errors.push(error instanceof Error ? error.message : "Unexpected ranking generation error.");
  }

  report.finishedAt = new Date().toISOString();
  const reportPath = await writeImportReport(report);
  printImportSummary(report, reportPath);
  if (report.errors.length) process.exitCode = 1;
}

void run();
