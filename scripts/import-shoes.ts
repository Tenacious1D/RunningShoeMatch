import { readFile } from "node:fs/promises";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createEmptyReport, parseImportArguments } from "./import/cli";
import { parseCsvText, validateHeaders } from "./import/csv";
import { printImportSummary, writeImportReport, type ImportReport } from "./import/report";
import { normalizeShoeRow, SHOE_IMPORT_COLUMNS, type NormalizedShoeImport } from "./import/shoe-schema";
import { chunks, createImportClient, stableJson } from "./import/supabase";

type BrandRow = { id: string; name: string; slug: string };
type ShoeRow = {
  id: string;
  brand_id: string;
  model_name: string;
  slug: string;
  model_version: string | null;
  model_year: number | null;
  status: string;
  gender: string;
  is_public: boolean;
  msrp: number | string | null;
  currency: string;
  release_date: string | null;
  short_description: string | null;
  full_description: string | null;
  primary_image_url: string | null;
  specs: Record<string, unknown>;
  primary_surface: string | null;
  support_category: string | null;
  weight_oz: number | string | null;
  weight_reference: string | null;
  heel_to_toe_drop_mm: number | string | null;
  heel_stack_height_mm: number | string | null;
  forefoot_stack_height_mm: number | string | null;
  available_widths: string[];
  spec_source_name: string | null;
  spec_source_url: string | null;
  spec_verified_at: string | null;
  spec_verification_status: string;
  spec_notes: string | null;
};
type ShoePayload = Omit<ShoeRow, "id" | "msrp" | "weight_oz" | "heel_to_toe_drop_mm" | "heel_stack_height_mm" | "forefoot_stack_height_mm"> & {
  msrp: number | null;
  weight_oz: number | null;
  heel_to_toe_drop_mm: number | null;
  heel_stack_height_mm: number | null;
  forefoot_stack_height_mm: number | null;
};
type PlannedChange = { kind: "added" | "updated"; line: number; payload: ShoePayload };

function numberOrNull(value: number | string | null) {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildPayload(shoe: NormalizedShoeImport, brandId: string, supplementalSpecs: Record<string, unknown>): ShoePayload {
  return {
    brand_id: brandId,
    model_name: shoe.modelName,
    slug: shoe.slug,
    model_version: shoe.modelVersion,
    model_year: shoe.modelYear,
    status: shoe.status,
    gender: shoe.gender,
    is_public: shoe.isPublic,
    msrp: shoe.msrp,
    currency: shoe.currency,
    release_date: shoe.releaseDate,
    short_description: shoe.shortDescription,
    full_description: shoe.fullDescription,
    primary_image_url: shoe.primaryImageUrl,
    specs: supplementalSpecs,
    primary_surface: shoe.primarySurface,
    support_category: shoe.supportCategory,
    weight_oz: shoe.weightOz,
    weight_reference: shoe.weightReference,
    heel_to_toe_drop_mm: shoe.heelToToeDropMm,
    heel_stack_height_mm: shoe.heelStackHeightMm,
    forefoot_stack_height_mm: shoe.forefootStackHeightMm,
    available_widths: shoe.availableWidths,
    spec_source_name: shoe.specSourceName,
    spec_source_url: shoe.specSourceUrl,
    spec_verified_at: shoe.specVerifiedAt,
    spec_verification_status: shoe.specVerificationStatus,
    spec_notes: shoe.specNotes,
  };
}

function shoeMatches(existing: ShoeRow, desired: ShoePayload) {
  return existing.brand_id === desired.brand_id &&
    existing.model_name === desired.model_name &&
    existing.model_version === desired.model_version &&
    existing.model_year === desired.model_year &&
    existing.status === desired.status &&
    existing.gender === desired.gender &&
    existing.is_public === desired.is_public &&
    numberOrNull(existing.msrp) === desired.msrp &&
    existing.currency === desired.currency &&
    existing.release_date === desired.release_date &&
    existing.short_description === desired.short_description &&
    existing.full_description === desired.full_description &&
    existing.primary_image_url === desired.primary_image_url &&
    stableJson(existing.specs) === stableJson(desired.specs) &&
    existing.primary_surface === desired.primary_surface &&
    existing.support_category === desired.support_category &&
    numberOrNull(existing.weight_oz) === desired.weight_oz &&
    existing.weight_reference === desired.weight_reference &&
    numberOrNull(existing.heel_to_toe_drop_mm) === desired.heel_to_toe_drop_mm &&
    numberOrNull(existing.heel_stack_height_mm) === desired.heel_stack_height_mm &&
    numberOrNull(existing.forefoot_stack_height_mm) === desired.forefoot_stack_height_mm &&
    stableJson(existing.available_widths) === stableJson(desired.available_widths) &&
    existing.spec_source_name === desired.spec_source_name &&
    existing.spec_source_url === desired.spec_source_url &&
    existing.spec_verified_at === desired.spec_verified_at &&
    existing.spec_verification_status === desired.spec_verification_status &&
    existing.spec_notes === desired.spec_notes;
}

async function loadBrands(client: SupabaseClient): Promise<BrandRow[]> {
  const rows: BrandRow[] = [];
  const pageSize = 1000;

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await client.from("brands").select("id, name, slug").range(from, from + pageSize - 1);
    if (error) throw new Error(`Unable to load brands: ${error.message}`);
    rows.push(...(data as BrandRow[]));
    if (data.length < pageSize) return rows;
  }
}

async function loadShoes(client: SupabaseClient, slugs: string[]): Promise<Map<string, ShoeRow>> {
  const rows: ShoeRow[] = [];

  for (const slugChunk of chunks(slugs)) {
    const { data, error } = await client
      .from("shoes")
      .select("id, brand_id, model_name, slug, model_version, model_year, status, gender, is_public, msrp, currency, release_date, short_description, full_description, primary_image_url, specs, primary_surface, support_category, weight_oz, weight_reference, heel_to_toe_drop_mm, heel_stack_height_mm, forefoot_stack_height_mm, available_widths, spec_source_name, spec_source_url, spec_verified_at, spec_verification_status, spec_notes")
      .in("slug", slugChunk);
    if (error) throw new Error(`Unable to load existing shoes: ${error.message}`);
    rows.push(...(data as ShoeRow[]));
  }

  return new Map(rows.map((row) => [row.slug, row]));
}

async function applyChanges(client: SupabaseClient, changes: PlannedChange[], report: ImportReport) {
  for (const changeChunk of chunks(changes, 100)) {
    const { error } = await client.from("shoes").upsert(changeChunk.map(({ payload }) => payload), { onConflict: "slug" });

    if (!error) {
      for (const change of changeChunk) report[change.kind] += 1;
      continue;
    }

    for (const change of changeChunk) {
      const { error: rowError } = await client.from("shoes").upsert(change.payload, { onConflict: "slug" });
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
    args = parseImportArguments(process.argv.slice(2), "import:shoes");
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Invalid import arguments.");
    process.exitCode = 1;
    return;
  }

  const report = createEmptyReport("shoes", args.mode, args.filePath);

  try {
    const parsed = parseCsvText(await readFile(args.filePath, "utf8"));
    report.errors.push(...validateHeaders(parsed.headers, SHOE_IMPORT_COLUMNS));

    const shoes: NormalizedShoeImport[] = [];
    for (const row of parsed.rows) {
      const result = normalizeShoeRow(row);
      if (result.success) shoes.push(result.data);
      else {
        report.invalid += 1;
        report.errors.push(`Line ${result.line}: ${result.message}`);
      }
    }

    const seenSlugs = new Map<string, number>();
    for (const shoe of shoes) {
      const firstLine = seenSlugs.get(shoe.slug);
      if (firstLine) {
        report.invalid += 1;
        report.errors.push(`Line ${shoe.sourceLine}: duplicate normalized slug "${shoe.slug}" (first seen on line ${firstLine}).`);
      } else seenSlugs.set(shoe.slug, shoe.sourceLine);
    }

    if (report.errors.length) {
      await finish(report);
      return;
    }

    const client = createImportClient();
    const existingBrands = await loadBrands(client);
    const brandsByName = new Map(existingBrands.map((brand) => [brand.name.toLowerCase(), brand]));
    const brandsBySlug = new Map(existingBrands.map((brand) => [brand.slug, brand]));
    const requestedBrands = new Map(shoes.map((shoe) => [shoe.brand.toLowerCase(), { name: shoe.brand, slug: shoe.brandSlug }]));
    const newBrands: Array<{ name: string; slug: string }> = [];
    const requestedBrandSlugOwners = new Map<string, string>();

    for (const [nameKey, requested] of requestedBrands) {
      const owner = requestedBrandSlugOwners.get(requested.slug);
      if (owner && owner !== nameKey) {
        report.invalid += shoes.filter((shoe) => [owner, nameKey].includes(shoe.brand.toLowerCase())).length;
        report.errors.push(`Different brand names normalize to the same slug "${requested.slug}".`);
      } else requestedBrandSlugOwners.set(requested.slug, nameKey);
    }

    if (report.errors.length) {
      await finish(report);
      return;
    }

    for (const [nameKey, requested] of requestedBrands) {
      const byName = brandsByName.get(nameKey);
      const bySlug = brandsBySlug.get(requested.slug);
      if (byName) continue;
      if (bySlug && bySlug.name.toLowerCase() !== nameKey) {
        report.invalid += shoes.filter((shoe) => shoe.brand.toLowerCase() === nameKey).length;
        report.errors.push(`Brand slug "${requested.slug}" already belongs to "${bySlug.name}".`);
      } else newBrands.push(requested);
    }

    if (report.errors.length) {
      await finish(report);
      return;
    }

    if (args.mode === "apply" && newBrands.length) {
      const { data, error } = await client.from("brands").insert(newBrands).select("id, name, slug");
      if (error) throw new Error(`Unable to create missing brands: ${error.message}`);
      for (const brand of data as BrandRow[]) {
        brandsByName.set(brand.name.toLowerCase(), brand);
        brandsBySlug.set(brand.slug, brand);
      }
    }

    const existingShoes = await loadShoes(client, shoes.map((shoe) => shoe.slug));
    const changes: PlannedChange[] = [];

    for (const shoe of shoes) {
      const brand = brandsByName.get(shoe.brand.toLowerCase());
      const brandId = brand?.id ?? `dry-run:${shoe.brandSlug}`;
      const existing = existingShoes.get(shoe.slug);
      const payload = buildPayload(shoe, brandId, existing?.specs ?? {});
      if (!existing) changes.push({ kind: "added", line: shoe.sourceLine, payload });
      else if (shoeMatches(existing, payload)) report.skipped += 1;
      else changes.push({ kind: "updated", line: shoe.sourceLine, payload });
    }

    if (args.mode === "dry-run") {
      report.added = changes.filter((change) => change.kind === "added").length;
      report.updated = changes.filter((change) => change.kind === "updated").length;
    } else {
      await applyChanges(client, changes, report);
    }
  } catch (error) {
    report.errors.push(error instanceof Error ? error.message : "Unexpected import error.");
  }

  await finish(report);
}

void run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Unexpected shoe import failure.");
  process.exitCode = 1;
});
