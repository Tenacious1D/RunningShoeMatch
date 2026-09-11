import { readFile } from "node:fs/promises";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createEmptyReport, parseImportArguments } from "./import/cli";
import { parseCsvText, validateHeaders } from "./import/csv";
import { buildRankingSnapshot, normalizeRankingRow, RANKING_IMPORT_COLUMNS, validateRankingReferences, type RankingSnapshot } from "./import/ranking-schema";
import { printImportSummary, writeImportReport, type ImportReport } from "./import/report";
import { chunks, createImportClient } from "./import/supabase";

type ShoeReference = { id: string; slug: string };
type CategoryReference = { id: string; slug: string; active: boolean };
type ExistingRun = { id: string; import_hash: string | null; status: string };

async function loadShoeReferences(client: SupabaseClient, slugs: string[]) {
  const rows: ShoeReference[] = [];
  for (const group of chunks([...new Set(slugs)])) {
    const { data, error } = await client.from("shoes").select("id, slug").in("slug", group);
    if (error) throw new Error(`Unable to load referenced shoes: ${error.message}`);
    rows.push(...(data as ShoeReference[]));
  }
  return new Map(rows.map((row) => [row.slug, row]));
}

async function loadCategoryReferences(client: SupabaseClient, slugs: string[]) {
  const rows: CategoryReference[] = [];
  for (const group of chunks([...new Set(slugs)])) {
    const { data, error } = await client.from("ranking_categories").select("id, slug, active").in("slug", group);
    if (error) throw new Error(`Unable to load ranking categories: ${error.message}`);
    rows.push(...(data as CategoryReference[]));
  }
  return new Map(rows.filter((row) => row.active).map((row) => [row.slug, row]));
}

async function findExistingRun(client: SupabaseClient, snapshot: RankingSnapshot): Promise<ExistingRun | null> {
  const { data: byHash, error: hashError } = await client.from("ranking_runs").select("id, import_hash, status").eq("import_hash", snapshot.importHash).maybeSingle();
  if (hashError) throw new Error(`Unable to check ranking import history: ${hashError.message}. Apply the Phase 12 migration first.`);
  if (byHash) return byHash as ExistingRun;

  const { data: byIdentity, error: identityError } = await client
    .from("ranking_runs")
    .select("id, import_hash, status")
    .eq("name", snapshot.runName)
    .eq("effective_date", snapshot.effectiveDate)
    .maybeSingle();
  if (identityError) throw new Error(`Unable to check ranking run identity: ${identityError.message}`);
  if (byIdentity) throw new Error(`A different ranking snapshot already uses run_name "${snapshot.runName}" and effective_date ${snapshot.effectiveDate}. Choose a new run name or review the existing run.`);
  return null;
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
    args = parseImportArguments(process.argv.slice(2), "import:rankings");
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Invalid ranking import arguments.");
    process.exitCode = 1;
    return;
  }

  const report = createEmptyReport("rankings", args.mode, args.filePath);

  try {
    const parsed = parseCsvText(await readFile(args.filePath, "utf8"));
    report.errors.push(...validateHeaders(parsed.headers, RANKING_IMPORT_COLUMNS));

    const rows = [];
    for (const row of parsed.rows) {
      const normalized = normalizeRankingRow(row);
      if (normalized.success) rows.push(normalized.data);
      else {
        report.invalid += 1;
        report.errors.push(...normalized.errors);
      }
    }

    if (report.errors.length) {
      await finish(report);
      return;
    }

    const snapshotResult = buildRankingSnapshot(rows);
    if (!snapshotResult.success) {
      report.invalid += snapshotResult.errors.length;
      report.errors.push(...snapshotResult.errors);
      await finish(report);
      return;
    }
    const snapshot = snapshotResult.data;
    const client = createImportClient();
    const shoes = await loadShoeReferences(client, snapshot.rows.map((row) => row.shoeSlug));
    const categories = await loadCategoryReferences(client, snapshot.rows.map((row) => row.categorySlug));
    const referenceErrors = validateRankingReferences(snapshot, new Set(shoes.keys()), new Set(categories.keys()));
    if (referenceErrors.length) {
      report.invalid += referenceErrors.length;
      report.errors.push(...referenceErrors);
      await finish(report);
      return;
    }

    const existing = await findExistingRun(client, snapshot);
    if (existing) {
      report.rankingRunId = existing.id;
      report.skipped = snapshot.rows.length;
      console.log(`Identical ranking snapshot already exists as ${existing.id} (${existing.status}).`);
      await finish(report);
      return;
    }

    if (args.mode === "dry-run") {
      report.added = snapshot.rows.length;
      console.log(`Validated one new DRAFT ranking run containing ${snapshot.rows.length} results across ${new Set(snapshot.rows.map((row) => row.categorySlug)).size} categories.`);
      await finish(report);
      return;
    }

    const results = snapshot.rows.map((row) => ({
      ranking_category_id: categories.get(row.categorySlug)?.id,
      shoe_id: shoes.get(row.shoeSlug)?.id,
      rank: row.rank,
      score: row.score,
      component_scores: row.componentScores,
      metadata: {
        import_source_line: row.sourceLine,
        ...(row.resultNotes ? { notes: row.resultNotes } : {}),
      },
    }));

    const { data, error } = await client.rpc("import_ranking_snapshot", {
      p_name: snapshot.runName,
      p_effective_date: snapshot.effectiveDate,
      p_methodology_version: snapshot.methodologyVersion,
      p_notes: snapshot.runNotes,
      p_import_hash: snapshot.importHash,
      p_results: results,
    });
    if (error) throw new Error(`Ranking snapshot transaction failed: ${error.message}`);

    const response = data as { ranking_run_id?: string; created?: boolean } | null;
    if (!response?.ranking_run_id) throw new Error("Ranking import completed without returning a ranking run ID.");
    report.rankingRunId = response.ranking_run_id;
    if (response.created === false) report.skipped = snapshot.rows.length;
    else report.added = snapshot.rows.length;
    console.log(`Created DRAFT ranking run ${response.ranking_run_id}. Review it before publishing.`);
    console.log(`Publish only when approved: npm run rankings:publish -- ${response.ranking_run_id}`);
  } catch (error) {
    report.errors.push(error instanceof Error ? error.message : "Unexpected ranking import error.");
  }

  await finish(report);
}

void run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Unexpected ranking import failure.");
  process.exitCode = 1;
});
