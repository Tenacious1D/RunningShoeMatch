import { readFile } from "node:fs/promises";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createEmptyReport, parseImportArguments } from "./import/cli";
import { parseCsvText, validateHeaders } from "./import/csv";
import {
  normalizeRankingInput,
  RANKING_INPUT_COLUMNS,
  rankingInputIdentity,
  type NormalizedRankingInput,
} from "./import/ranking-source-schema";
import { printImportSummary, writeImportReport, type ImportReport } from "./import/report";
import { chunks, createImportClient } from "./import/supabase";

type ShoeRow = { id: string; slug: string };
type CategoryRow = { id: string; slug: string; active: boolean };
type StoredInput = {
  shoe_id: string;
  methodology_version: string;
  effective_date: string;
  fit_classification: string;
  cushion_classification: string;
  reviewed_at: string;
  notes: string | null;
};
type StoredEligibility = {
  shoe_id: string;
  ranking_category_id: string;
  methodology_version: string;
  effective_date: string;
};

async function loadReferences(client: SupabaseClient, shoeSlugs: string[]) {
  const shoes: ShoeRow[] = [];
  for (const group of chunks([...new Set(shoeSlugs)])) {
    const { data, error } = await client.from("shoes").select("id, slug").in("slug", group);
    if (error) throw new Error(`Unable to resolve shoe slugs: ${error.message}`);
    shoes.push(...(data as ShoeRow[]));
  }
  const { data: categoryData, error: categoryError } = await client.from("ranking_categories").select("id, slug, active");
  if (categoryError) throw new Error(`Unable to load ranking categories: ${categoryError.message}`);
  return { shoes, categories: categoryData as CategoryRow[] };
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
    args = parseImportArguments(process.argv.slice(2), "import:ranking-inputs");
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Invalid ranking input import arguments.");
    process.exitCode = 1;
    return;
  }
  const report = createEmptyReport("ranking-inputs", args.mode, args.filePath);

  try {
    const parsed = parseCsvText(await readFile(args.filePath, "utf8"));
    report.errors.push(...validateHeaders(parsed.headers, RANKING_INPUT_COLUMNS));
    const rows: NormalizedRankingInput[] = [];
    for (const row of parsed.rows) {
      const normalized = normalizeRankingInput(row);
      if (normalized.success) rows.push(normalized.data);
      else {
        report.invalid += 1;
        report.errors.push(`Line ${normalized.line}: ${normalized.message}`);
      }
    }

    const identities = new Map<string, number>();
    for (const row of rows) {
      const identity = rankingInputIdentity(row);
      const firstLine = identities.get(identity);
      if (firstLine) {
        report.invalid += 1;
        report.errors.push(`Line ${row.sourceLine}: duplicate ranking input version (first seen on line ${firstLine}).`);
      } else identities.set(identity, row.sourceLine);
    }
    if (report.errors.length) return await finish(report);

    const client = createImportClient();
    const { shoes, categories } = await loadReferences(client, rows.map((row) => row.shoeSlug));
    const shoesBySlug = new Map(shoes.map((shoe) => [shoe.slug, shoe]));
    const categoriesBySlug = new Map(categories.filter((category) => category.active).map((category) => [category.slug, category]));
    for (const row of rows) {
      if (!shoesBySlug.has(row.shoeSlug)) {
        report.invalid += 1;
        report.errors.push(`Line ${row.sourceLine}: shoe "${row.shoeSlug}" does not exist.`);
      }
      for (const slug of row.categorySlugs) {
        if (!categoriesBySlug.has(slug)) {
          report.invalid += 1;
          report.errors.push(`Line ${row.sourceLine}: active category "${slug}" does not exist.`);
        }
      }
    }
    if (report.errors.length) return await finish(report);

    const shoeIds = shoes.map((shoe) => shoe.id);
    const [inputQuery, eligibilityQuery] = await Promise.all([
      client.from("shoe_ranking_inputs").select("shoe_id, methodology_version, effective_date, fit_classification, cushion_classification, reviewed_at, notes").in("shoe_id", shoeIds),
      client.from("shoe_ranking_category_eligibility").select("shoe_id, ranking_category_id, methodology_version, effective_date").in("shoe_id", shoeIds),
    ]);
    if (inputQuery.error) throw new Error(`Unable to load ranking inputs: ${inputQuery.error.message}. Apply the automated-ranking migration first.`);
    if (eligibilityQuery.error) throw new Error(`Unable to load ranking eligibility: ${eligibilityQuery.error.message}`);

    const shoeSlugById = new Map(shoes.map((shoe) => [shoe.id, shoe.slug]));
    const categorySlugById = new Map(categories.map((category) => [category.id, category.slug]));
    const storedInputs = new Map((inputQuery.data as StoredInput[]).map((row) => [
      `${shoeSlugById.get(row.shoe_id)}|${row.methodology_version}|${row.effective_date}`,
      row,
    ]));
    const storedCategories = new Map<string, string[]>();
    for (const row of eligibilityQuery.data as StoredEligibility[]) {
      const key = `${shoeSlugById.get(row.shoe_id)}|${row.methodology_version}|${row.effective_date}`;
      storedCategories.set(key, [...(storedCategories.get(key) ?? []), categorySlugById.get(row.ranking_category_id) ?? ""]);
    }

    const changes: NormalizedRankingInput[] = [];
    for (const row of rows) {
      const identity = rankingInputIdentity(row);
      const stored = storedInputs.get(identity);
      const desiredCategories = [...row.categorySlugs].sort();
      const currentCategories = (storedCategories.get(identity) ?? []).filter(Boolean).sort();
      const unchanged = stored &&
        stored.fit_classification === row.fitClassification &&
        stored.cushion_classification === row.cushionClassification &&
        stored.reviewed_at === row.reviewedAt &&
        stored.notes === row.notes &&
        JSON.stringify(currentCategories) === JSON.stringify(desiredCategories);
      if (unchanged) report.skipped += 1;
      else {
        changes.push(row);
        if (stored) report.updated += 1;
        else report.added += 1;
      }
    }

    if (args.mode === "apply" && changes.length) {
      const { data, error } = await client.rpc("import_shoe_ranking_inputs", {
        p_rows: changes.map((row) => ({
          shoe_slug: row.shoeSlug,
          methodology_version: row.methodologyVersion,
          effective_date: row.effectiveDate,
          fit_classification: row.fitClassification,
          cushion_classification: row.cushionClassification,
          category_slugs: row.categorySlugs,
          reviewed_at: row.reviewedAt,
          notes: row.notes,
        })),
      });
      if (error) throw new Error(`Ranking input transaction failed: ${error.message}`);
      const processed = (data as { processed_inputs?: number } | null)?.processed_inputs ?? 0;
      if (processed !== changes.length) throw new Error("Ranking input transaction returned an unexpected processed count.");
    }
  } catch (error) {
    report.errors.push(error instanceof Error ? error.message : "Unexpected ranking input import error.");
  }
  await finish(report);
}

void run();
