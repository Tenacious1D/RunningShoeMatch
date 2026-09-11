import { readFile } from "node:fs/promises";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createEmptyReport, parseImportArguments } from "./import/cli";
import { parseCsvText, validateHeaders } from "./import/csv";
import { METRIC_IMPORT_COLUMNS, metricIdentity, normalizeMetricRow, type NormalizedMetricImport } from "./import/metric-schema";
import { printImportSummary, writeImportReport, type ImportReport } from "./import/report";
import { chunks, createImportClient, stableJson } from "./import/supabase";

type ShoeRow = { id: string; slug: string };
type MetricRow = {
  id: string;
  shoe_id: string;
  metric_key: string;
  metric_kind: string;
  value: number | string;
  normalized_value: number | string | null;
  unit: string | null;
  source_type: string;
  data_source: string;
  source_reference: string | null;
  effective_date: string;
  metric_version: string;
  confidence: number | string | null;
  verification_status: string;
  notes: string | null;
  is_public: boolean;
};
type MetricPayload = Omit<MetricRow, "id" | "value" | "normalized_value" | "confidence"> & {
  value: number;
  normalized_value: number | null;
  confidence: number | null;
};
type PlannedChange = { kind: "added" | "updated"; line: number; payload: MetricPayload };

function nullableNumber(value: number | string | null) {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildPayload(metric: NormalizedMetricImport, shoeId: string): MetricPayload {
  return {
    shoe_id: shoeId,
    metric_key: metric.metricKey,
    metric_kind: metric.metricKind,
    value: metric.value,
    normalized_value: metric.normalizedValue,
    unit: metric.unit,
    source_type: metric.sourceType,
    data_source: metric.dataSource,
    source_reference: metric.sourceReference,
    effective_date: metric.effectiveDate,
    metric_version: metric.metricVersion,
    confidence: metric.confidence,
    verification_status: metric.verificationStatus,
    notes: metric.notes,
    is_public: metric.isPublic,
  };
}

function databaseIdentity(row: MetricRow, shoeSlug: string) {
  return metricIdentity({
    shoeSlug,
    metricKey: row.metric_key,
    effectiveDate: row.effective_date,
    metricVersion: row.metric_version,
    dataSource: row.data_source,
  });
}

function metricMatches(existing: MetricRow, desired: MetricPayload) {
  return Number(existing.value) === desired.value &&
    existing.metric_kind === desired.metric_kind &&
    nullableNumber(existing.normalized_value) === desired.normalized_value &&
    existing.unit === desired.unit &&
    existing.source_type === desired.source_type &&
    existing.source_reference === desired.source_reference &&
    nullableNumber(existing.confidence) === desired.confidence &&
    existing.verification_status === desired.verification_status &&
    existing.notes === desired.notes &&
    existing.is_public === desired.is_public;
}

async function loadShoes(client: SupabaseClient, slugs: string[]) {
  const rows: ShoeRow[] = [];
  for (const slugChunk of chunks([...new Set(slugs)])) {
    const { data, error } = await client.from("shoes").select("id, slug").in("slug", slugChunk);
    if (error) throw new Error(`Unable to resolve shoe slugs: ${error.message}`);
    rows.push(...(data as ShoeRow[]));
  }
  return rows;
}

async function loadMetrics(client: SupabaseClient, shoeIds: string[], metricKeys: string[]) {
  const rows: MetricRow[] = [];
  const pageSize = 1000;

  for (const shoeIdChunk of chunks(shoeIds, 100)) {
    for (let from = 0; ; from += pageSize) {
      const { data, error } = await client
        .from("shoe_metrics")
        .select("id, shoe_id, metric_key, metric_kind, value, normalized_value, unit, source_type, data_source, source_reference, effective_date, metric_version, confidence, verification_status, notes, is_public")
        .in("shoe_id", shoeIdChunk)
        .in("metric_key", metricKeys)
        .range(from, from + pageSize - 1);
      if (error) throw new Error(`Unable to load existing metrics: ${error.message}`);
      rows.push(...(data as MetricRow[]));
      if (data.length < pageSize) break;
    }
  }

  return rows;
}

async function applyChanges(client: SupabaseClient, changes: PlannedChange[], report: ImportReport) {
  const conflictKey = "shoe_id,metric_key,effective_date,metric_version,data_source";

  for (const changeChunk of chunks(changes, 100)) {
    const { error } = await client.from("shoe_metrics").upsert(changeChunk.map(({ payload }) => payload), { onConflict: conflictKey });

    if (!error) {
      for (const change of changeChunk) report[change.kind] += 1;
      continue;
    }

    for (const change of changeChunk) {
      const { error: rowError } = await client.from("shoe_metrics").upsert(change.payload, { onConflict: conflictKey });
      if (rowError) report.errors.push(`Line ${change.line}: ${rowError.message}`);
      else report[change.kind] += 1;
    }
  }
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
    args = parseImportArguments(process.argv.slice(2), "import:metrics");
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Invalid import arguments.");
    process.exitCode = 1;
    return;
  }

  const report = createEmptyReport("metrics", args.mode, args.filePath);

  try {
    const parsed = parseCsvText(await readFile(args.filePath, "utf8"));
    report.errors.push(...validateHeaders(parsed.headers, METRIC_IMPORT_COLUMNS));
    const metrics: NormalizedMetricImport[] = [];

    for (const row of parsed.rows) {
      const result = normalizeMetricRow(row);
      if (result.success) metrics.push(result.data);
      else {
        report.invalid += 1;
        report.errors.push(`Line ${result.line}: ${result.message}`);
      }
    }

    const identities = new Map<string, number>();
    for (const metric of metrics) {
      const identity = metricIdentity(metric);
      const firstLine = identities.get(identity);
      if (firstLine) {
        report.invalid += 1;
        report.errors.push(`Line ${metric.sourceLine}: duplicate metric identity (first seen on line ${firstLine}).`);
      } else identities.set(identity, metric.sourceLine);
    }

    if (report.errors.length) {
      await finish(report);
      return;
    }

    const client = createImportClient();
    const shoes = await loadShoes(client, metrics.map((metric) => metric.shoeSlug));
    const shoesBySlug = new Map(shoes.map((shoe) => [shoe.slug, shoe]));
    const slugByShoeId = new Map(shoes.map((shoe) => [shoe.id, shoe.slug]));

    for (const metric of metrics) {
      if (!shoesBySlug.has(metric.shoeSlug)) {
        report.invalid += 1;
        report.errors.push(`Line ${metric.sourceLine}: shoe slug "${metric.shoeSlug}" does not exist.`);
      }
    }

    if (report.errors.length) {
      await finish(report);
      return;
    }

    const existingRows = await loadMetrics(client, shoes.map((shoe) => shoe.id), [...new Set(metrics.map((metric) => metric.metricKey))]);
    const existingByIdentity = new Map(existingRows.map((row) => [databaseIdentity(row, slugByShoeId.get(row.shoe_id) ?? ""), row]));
    const changes: PlannedChange[] = [];

    for (const metric of metrics) {
      const shoe = shoesBySlug.get(metric.shoeSlug)!;
      const payload = buildPayload(metric, shoe.id);
      const existing = existingByIdentity.get(metricIdentity(metric));
      if (!existing) changes.push({ kind: "added", line: metric.sourceLine, payload });
      else if (metricMatches(existing, payload)) report.skipped += 1;
      else if (existing.is_public) {
        report.invalid += 1;
        report.errors.push(`Line ${metric.sourceLine}: this public metric version is immutable; use a new effective_date or metric_version.`);
      } else changes.push({ kind: "updated", line: metric.sourceLine, payload });
    }

    if (report.errors.length) {
      await finish(report);
      return;
    }

    if (args.mode === "dry-run") {
      report.added = changes.filter((change) => change.kind === "added").length;
      report.updated = changes.filter((change) => change.kind === "updated").length;
    } else {
      await applyChanges(client, changes, report);
    }
  } catch (error) {
    report.errors.push(error instanceof Error ? error.message : stableJson(error));
  }

  await finish(report);
}

void run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Unexpected metric import failure.");
  process.exitCode = 1;
});
