import assert from "node:assert/strict";
import test from "node:test";

import type { CsvRow } from "../../scripts/import/csv";
import {
  normalizeRetailerLinkRow,
  RETAILER_LINK_IMPORT_COLUMNS,
  retailerLinkIdentity,
} from "../../scripts/import/retailer-link-schema";

function values(overrides: Record<string, string> = {}) {
  return { ...Object.fromEntries(RETAILER_LINK_IMPORT_COLUMNS.map((column) => [column, ""])), ...overrides };
}

function validRow(overrides: Record<string, string> = {}): CsvRow {
  return {
    line: 2,
    values: values({
      shoe_slug: " Demo Aero Day 2 ",
      retailer: " Demo Running Shop ",
      retailer_slug: " Demo Running Shop ",
      create_retailer: "false",
      affiliate_url: "https://retailer.example/demo-aero-day-2",
      displayed_price: "$139.995",
      currency: "usd",
      is_primary: "yes",
      active: "true",
      last_verified_at: "2026-09-11",
      ...overrides,
    }),
  };
}

test("normalizes a spreadsheet retailer-link row", () => {
  const result = normalizeRetailerLinkRow(validRow());
  assert.equal(result.success, true);
  if (!result.success) return;
  assert.equal(result.data.shoeSlug, "demo-aero-day-2");
  assert.equal(result.data.retailerName, "Demo Running Shop");
  assert.equal(result.data.retailerSlug, "demo-running-shop");
  assert.equal(result.data.displayedPrice, 140);
  assert.equal(result.data.currency, "USD");
  assert.equal(result.data.isPrimary, true);
  assert.equal(result.data.lastVerifiedAt, "2026-09-11T00:00:00.000Z");
  assert.equal(retailerLinkIdentity(result.data), "demo-aero-day-2|demo-running-shop");
});

test("requires explicit retailer creation details", () => {
  const result = normalizeRetailerLinkRow(validRow({ create_retailer: "true" }));
  assert.equal(result.success, false);
  if (!result.success) assert.match(result.message, /homepage.*active/i);
});

test("accepts explicit retailer creation with homepage and active state", () => {
  const result = normalizeRetailerLinkRow(validRow({
    create_retailer: "true",
    retailer_homepage_url: "https://retailer.example",
    retailer_active: "true",
  }));
  assert.equal(result.success, true);
  if (!result.success) return;
  assert.equal(result.data.createRetailer, true);
  assert.equal(result.data.retailerHomepageUrl, "https://retailer.example");
  assert.equal(result.data.retailerActive, true);
});

test("rejects invalid URLs, currency, prices, booleans, and dates", () => {
  const result = normalizeRetailerLinkRow(validRow({
    affiliate_url: "javascript:alert(1)",
    displayed_price: "-1",
    currency: "US",
    active: "maybe",
    last_verified_at: "2026-02-31",
  }));
  assert.equal(result.success, false);
  if (!result.success) {
    assert.match(result.message, /affiliate_url/);
    assert.match(result.message, /displayed_price/);
    assert.match(result.message, /currency/);
    assert.match(result.message, /active/);
    assert.match(result.message, /last_verified_at/);
  }
});

test("keeps optional price, regular URL, and verification date absent", () => {
  const result = normalizeRetailerLinkRow(validRow({
    displayed_price: "",
    regular_url: "",
    last_verified_at: "",
    is_primary: "false",
  }));
  assert.equal(result.success, true);
  if (!result.success) return;
  assert.equal(result.data.displayedPrice, null);
  assert.equal(result.data.regularUrl, null);
  assert.equal(result.data.lastVerifiedAt, null);
});
