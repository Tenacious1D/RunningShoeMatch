import { readFile } from "node:fs/promises";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createEmptyReport, parseImportArguments } from "./import/cli";
import { parseCsvText, validateHeaders } from "./import/csv";
import {
  normalizeRankingReview,
  RANKING_REVIEW_COLUMNS,
  rankingReviewIdentity,
  type NormalizedRankingReview,
} from "./import/ranking-source-schema";
import { printImportSummary, writeImportReport, type ImportReport } from "./import/report";
import { chunks, createImportClient } from "./import/supabase";

type ShoeRow = { id: string; slug: string };
type StoredReview = {
  shoe_id: string;
  source_key: string;
  rating: number | string;
  review_count: number;
  product_url: string | null;
  observed_at: string;
  verification_status: string;
  notes: string | null;
};

async function loadShoes(client: SupabaseClient, slugs: string[]) {
  const rows: ShoeRow[] = [];
  for (const group of chunks([...new Set(slugs)])) {
    const { data, error } = await client.from("shoes").select("id, slug").in("slug", group);
    if (error) throw new Error(`Unable to resolve shoe slugs: ${error.message}`);
    rows.push(...(data as ShoeRow[]));
  }
  return rows;
}

function matches(stored: StoredReview, desired: NormalizedRankingReview) {
  return Number(stored.rating) === desired.rating &&
    stored.review_count === desired.reviewCount &&
    stored.product_url === desired.productUrl &&
    stored.verification_status === desired.verificationStatus &&
    stored.notes === desired.notes;
}

async function finish(report: ImportReport) {
  report.finishedAt = new Date().toISOString();
  const reportPath = await writeImportReport(report);
  printImportSummary(report, reportPath);
  if (report.invalid || report.errors.length) process.exitCode = 1;
}

async function run() {
  let args;
  try {
    args = parseImportArguments(process.argv.slice(2), "import:ranking-reviews");
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Invalid ranking review import arguments.");
    process.exitCode = 1;
    return;
  }
  const report = createEmptyReport("ranking-reviews", args.mode, args.filePath);

  try {
    const parsed = parseCsvText(await readFile(args.filePath, "utf8"));
    report.errors.push(...validateHeaders(parsed.headers, RANKING_REVIEW_COLUMNS));
    const rows: NormalizedRankingReview[] = [];
    for (const row of parsed.rows) {
      const normalized = normalizeRankingReview(row);
      if (normalized.success) rows.push(normalized.data);
      else {
        report.invalid += 1;
        report.errors.push(`Line ${normalized.line}: ${normalized.message}`);
      }
    }

    const identities = new Map<string, number>();
    for (const row of rows) {
      const identity = rankingReviewIdentity(row);
      const firstLine = identities.get(identity);
      if (firstLine) {
        report.invalid += 1;
        report.errors.push(`Line ${row.sourceLine}: duplicate observation (first seen on line ${firstLine}).`);
      } else identities.set(identity, row.sourceLine);
    }
    if (report.errors.length) return await finish(report);

    const client = createImportClient();
    const shoes = await loadShoes(client, rows.map((row) => row.shoeSlug));
    const shoesBySlug = new Map(shoes.map((shoe) => [shoe.slug, shoe]));
    for (const row of rows) {
      if (!shoesBySlug.has(row.shoeSlug)) {
        report.invalid += 1;
        report.errors.push(`Line ${row.sourceLine}: shoe "${row.shoeSlug}" does not exist.`);
      }
    }
    if (report.errors.length) return await finish(report);

    const { data, error } = await client
      .from("shoe_review_observations")
      .select("shoe_id, source_key, rating, review_count, product_url, observed_at, verification_status, notes")
      .in("shoe_id", shoes.map((shoe) => shoe.id));
    if (error) throw new Error(`Unable to load review observations: ${error.message}. Apply the automated-ranking migration first.`);

    const slugsById = new Map(shoes.map((shoe) => [shoe.id, shoe.slug]));
    const existing = new Map((data as StoredReview[]).map((row) => [
      `${slugsById.get(row.shoe_id)}|${row.source_key}|${row.observed_at}`,
      row,
    ]));
    const changes: NormalizedRankingReview[] = [];
    for (const row of rows) {
      const stored = existing.get(rankingReviewIdentity(row));
      if (!stored) {
        report.added += 1;
        changes.push(row);
      } else if (matches(stored, row)) report.skipped += 1;
      else {
        report.updated += 1;
        changes.push(row);
      }
    }

    if (args.mode === "apply" && changes.length) {
      const { data: result, error: applyError } = await client.rpc("import_ranking_review_observations", {
        p_rows: changes.map((row) => ({
          shoe_slug: row.shoeSlug,
          source_key: row.sourceKey,
          rating: row.rating,
          review_count: row.reviewCount,
          product_url: row.productUrl,
          observed_at: row.observedAt,
          verification_status: row.verificationStatus,
          notes: row.notes,
        })),
      });
      if (applyError) throw new Error(`Ranking review transaction failed: ${applyError.message}`);
      const processed = (result as { processed_rows?: number } | null)?.processed_rows ?? 0;
      if (processed !== changes.length) throw new Error("Ranking review transaction returned an unexpected processed count.");
    }
  } catch (error) {
    report.errors.push(error instanceof Error ? error.message : "Unexpected ranking review import error.");
  }
  await finish(report);
}

void run();
