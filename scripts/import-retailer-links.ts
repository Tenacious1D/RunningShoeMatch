import { readFile } from "node:fs/promises";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createEmptyReport, parseImportArguments } from "./import/cli";
import { parseCsvText, validateHeaders } from "./import/csv";
import {
  normalizeRetailerLinkRow,
  RETAILER_LINK_IMPORT_COLUMNS,
  retailerLinkIdentity,
  type NormalizedRetailerLinkImport,
} from "./import/retailer-link-schema";
import { printImportSummary, writeImportReport, type ImportReport } from "./import/report";
import { chunks, createImportClient } from "./import/supabase";

type ShoeRow = { id: string; slug: string };
type RetailerRow = { id: string; name: string; slug: string };
type RetailerLinkRow = {
  shoe_id: string;
  retailer_id: string;
  affiliate_url: string;
  regular_url: string | null;
  displayed_price: number | string | null;
  currency: string;
  is_primary: boolean;
  active: boolean;
  last_verified_at: string | null;
};
type RetailerLinkPayload = {
  shoe_slug: string;
  retailer_slug: string;
  affiliate_url: string;
  regular_url: string | null;
  displayed_price: number | null;
  currency: string;
  is_primary: boolean;
  active: boolean;
  last_verified_at: string | null;
};
type PlannedChange = { kind: "added" | "updated"; line: number; payload: RetailerLinkPayload };

async function loadShoes(client: SupabaseClient, slugs: string[]) {
  const rows: ShoeRow[] = [];
  for (const group of chunks([...new Set(slugs)])) {
    const { data, error } = await client.from("shoes").select("id, slug").in("slug", group);
    if (error) throw new Error(`Unable to resolve shoe slugs: ${error.message}`);
    rows.push(...(data as ShoeRow[]));
  }
  return rows;
}

async function loadRetailers(client: SupabaseClient) {
  const rows: RetailerRow[] = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await client.from("retailers").select("id, name, slug").range(from, from + pageSize - 1);
    if (error) throw new Error(`Unable to load retailers: ${error.message}`);
    rows.push(...(data as RetailerRow[]));
    if (data.length < pageSize) return rows;
  }
}

async function loadLinks(client: SupabaseClient, shoeIds: string[]) {
  const rows: RetailerLinkRow[] = [];
  const pageSize = 1000;
  for (const group of chunks(shoeIds)) {
    for (let from = 0; ; from += pageSize) {
      const { data, error } = await client
        .from("shoe_retailer_links")
        .select("shoe_id, retailer_id, affiliate_url, regular_url, displayed_price, currency, is_primary, active, last_verified_at")
        .in("shoe_id", group)
        .range(from, from + pageSize - 1);
      if (error) throw new Error(`Unable to load existing retailer links: ${error.message}`);
      rows.push(...(data as RetailerLinkRow[]));
      if (data.length < pageSize) break;
    }
  }
  return rows;
}

function timestampsMatch(left: string | null, right: string | null) {
  if (left === null || right === null) return left === right;
  return new Date(left).valueOf() === new Date(right).valueOf();
}

function linkMatches(existing: RetailerLinkRow, desired: RetailerLinkPayload) {
  const price = existing.displayed_price === null ? null : Number(existing.displayed_price);
  return existing.affiliate_url === desired.affiliate_url &&
    existing.regular_url === desired.regular_url &&
    price === desired.displayed_price &&
    existing.currency === desired.currency &&
    existing.is_primary === desired.is_primary &&
    existing.active === desired.active &&
    timestampsMatch(existing.last_verified_at, desired.last_verified_at);
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
    args = parseImportArguments(process.argv.slice(2), "import:retailer-links");
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Invalid retailer-link import arguments.");
    process.exitCode = 1;
    return;
  }

  const report = createEmptyReport("retailer-links", args.mode, args.filePath);

  try {
    const parsed = parseCsvText(await readFile(args.filePath, "utf8"));
    report.errors.push(...validateHeaders(parsed.headers, RETAILER_LINK_IMPORT_COLUMNS));
    const links: NormalizedRetailerLinkImport[] = [];

    for (const row of parsed.rows) {
      const normalized = normalizeRetailerLinkRow(row);
      if (normalized.success) links.push(normalized.data);
      else {
        report.invalid += 1;
        report.errors.push(`Line ${normalized.line}: ${normalized.message}`);
      }
    }

    const identities = new Map<string, number>();
    for (const link of links) {
      const identity = retailerLinkIdentity(link);
      const firstLine = identities.get(identity);
      if (firstLine) {
        report.invalid += 1;
        report.errors.push(`Line ${link.sourceLine}: duplicate shoe/retailer relationship (first seen on line ${firstLine}).`);
      } else identities.set(identity, link.sourceLine);
    }

    if (report.errors.length) {
      await finish(report);
      return;
    }

    const client = createImportClient();
    const [shoes, retailers] = await Promise.all([
      loadShoes(client, links.map((link) => link.shoeSlug)),
      loadRetailers(client),
    ]);
    const shoesBySlug = new Map(shoes.map((shoe) => [shoe.slug, shoe]));
    const retailersBySlug = new Map(retailers.map((retailer) => [retailer.slug, retailer]));
    const retailersByName = new Map(retailers.map((retailer) => [retailer.name.toLocaleLowerCase("en-US"), retailer]));
    const newRetailers = new Map<string, { name: string; slug: string; homepage_url: string; active: boolean }>();

    for (const link of links) {
      if (!shoesBySlug.has(link.shoeSlug)) {
        report.invalid += 1;
        report.errors.push(`Line ${link.sourceLine}: shoe slug "${link.shoeSlug}" does not exist.`);
      }

      const existingBySlug = retailersBySlug.get(link.retailerSlug);
      const existingByName = retailersByName.get(link.retailerName.toLocaleLowerCase("en-US"));
      if (existingBySlug && existingBySlug.name.toLocaleLowerCase("en-US") !== link.retailerName.toLocaleLowerCase("en-US")) {
        report.invalid += 1;
        report.errors.push(`Line ${link.sourceLine}: retailer slug "${link.retailerSlug}" belongs to "${existingBySlug.name}".`);
      } else if (!existingBySlug && existingByName) {
        report.invalid += 1;
        report.errors.push(`Line ${link.sourceLine}: retailer name "${link.retailerName}" already uses slug "${existingByName.slug}".`);
      } else if (!existingBySlug && !link.createRetailer) {
        report.invalid += 1;
        report.errors.push(`Line ${link.sourceLine}: retailer "${link.retailerSlug}" does not exist; set create_retailer=true with homepage and active values to create it explicitly.`);
      } else if (!existingBySlug && link.createRetailer) {
        const requested = {
          name: link.retailerName,
          slug: link.retailerSlug,
          homepage_url: link.retailerHomepageUrl!,
          active: link.retailerActive!,
        };
        const earlier = newRetailers.get(link.retailerSlug);
        if (earlier && JSON.stringify(earlier) !== JSON.stringify(requested)) {
          report.invalid += 1;
          report.errors.push(`Line ${link.sourceLine}: conflicting creation details for retailer "${link.retailerSlug}".`);
        } else newRetailers.set(link.retailerSlug, requested);
      }
    }

    if (report.errors.length) {
      await finish(report);
      return;
    }

    const existingLinks = await loadLinks(client, shoes.map((shoe) => shoe.id));
    const retailerIdsBySlug = new Map(retailers.map((retailer) => [retailer.slug, retailer.id]));
    for (const retailer of newRetailers.values()) retailerIdsBySlug.set(retailer.slug, `new:${retailer.slug}`);
    const existingByIdentity = new Map(existingLinks.map((link) => [`${link.shoe_id}|${link.retailer_id}`, link]));
    const plannedState = new Map(existingLinks.map((link) => [`${link.shoe_id}|${link.retailer_id}`, {
      shoeId: link.shoe_id,
      active: link.active,
      isPrimary: link.is_primary,
    }]));
    const changes: PlannedChange[] = [];

    for (const link of links) {
      const shoe = shoesBySlug.get(link.shoeSlug)!;
      const retailerId = retailerIdsBySlug.get(link.retailerSlug)!;
      const payload: RetailerLinkPayload = {
        shoe_slug: link.shoeSlug,
        retailer_slug: link.retailerSlug,
        affiliate_url: link.affiliateUrl,
        regular_url: link.regularUrl,
        displayed_price: link.displayedPrice,
        currency: link.currency,
        is_primary: link.isPrimary,
        active: link.active,
        last_verified_at: link.lastVerifiedAt,
      };
      const identity = `${shoe.id}|${retailerId}`;
      const existing = existingByIdentity.get(identity);
      plannedState.set(identity, { shoeId: shoe.id, active: link.active, isPrimary: link.isPrimary });
      if (!existing) changes.push({ kind: "added", line: link.sourceLine, payload });
      else if (linkMatches(existing, payload)) report.skipped += 1;
      else changes.push({ kind: "updated", line: link.sourceLine, payload });
    }

    const primaryCounts = new Map<string, number>();
    for (const state of plannedState.values()) {
      if (state.active && state.isPrimary) primaryCounts.set(state.shoeId, (primaryCounts.get(state.shoeId) ?? 0) + 1);
    }
    for (const [shoeId, count] of primaryCounts) {
      if (count > 1) {
        const shoeSlug = shoes.find((shoe) => shoe.id === shoeId)?.slug ?? shoeId;
        report.invalid += 1;
        report.errors.push(`Shoe "${shoeSlug}" would have ${count} active primary retailer links. Include the current primary row and set is_primary=false when changing it.`);
      }
    }

    if (report.errors.length) {
      await finish(report);
      return;
    }

    if (args.mode === "dry-run") {
      report.added = changes.filter((change) => change.kind === "added").length;
      report.updated = changes.filter((change) => change.kind === "updated").length;
      if (newRetailers.size) console.log(`Would create ${newRetailers.size} explicitly approved retailer(s).`);
    } else if (changes.length || newRetailers.size) {
      const { data, error } = await client.rpc("import_retailer_links", {
        p_new_retailers: [...newRetailers.values()],
        p_links: changes.map((change) => change.payload),
      });
      if (error) throw new Error(`Retailer-link transaction failed: ${error.message}. Apply the latest migration first.`);
      const result = data as { created_retailers?: number; processed_links?: number } | null;
      if ((result?.processed_links ?? 0) !== changes.length) throw new Error("Retailer-link transaction returned an unexpected processed count.");
      report.added = changes.filter((change) => change.kind === "added").length;
      report.updated = changes.filter((change) => change.kind === "updated").length;
      if (result?.created_retailers) console.log(`Created ${result.created_retailers} retailer(s).`);
    }
  } catch (error) {
    report.errors.push(error instanceof Error ? error.message : "Unexpected retailer-link import error.");
  }

  await finish(report);
}

void run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Unexpected retailer-link import failure.");
  process.exitCode = 1;
});
