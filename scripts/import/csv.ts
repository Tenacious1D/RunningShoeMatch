import { parse } from "csv-parse/sync";

export type CsvRow = {
  line: number;
  values: Record<string, string>;
};

export type ParsedCsv = {
  headers: string[];
  rows: CsvRow[];
};

export function normalizeWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeSlug(value: string): string {
  return normalizeWhitespace(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function parseCsvText(source: string): ParsedCsv {
  let headers: string[] = [];

  const records = parse<Record<string, string>>(source, {
    bom: true,
    columns(rawHeaders: string[]) {
      headers = rawHeaders.map(normalizeWhitespace);

      if (headers.some((header) => !header)) {
        throw new Error("CSV contains an empty column header.");
      }

      if (new Set(headers).size !== headers.length) {
        throw new Error("CSV contains duplicate column headers.");
      }

      return headers;
    },
    relax_column_count: false,
    skip_empty_lines: true,
    trim: false,
  });

  if (!headers.length) {
    throw new Error("CSV must include a header row.");
  }

  return {
    headers,
    rows: records.map((values, index) => ({ line: index + 2, values })),
  };
}

export function validateHeaders(actual: string[], expected: readonly string[]): string[] {
  const actualSet = new Set(actual);
  const expectedSet = new Set(expected);
  const missing = expected.filter((header) => !actualSet.has(header));
  const unexpected = actual.filter((header) => !expectedSet.has(header));
  const errors: string[] = [];

  if (missing.length) {
    errors.push(`Missing columns: ${missing.join(", ")}`);
  }

  if (unexpected.length) {
    errors.push(`Unexpected columns: ${unexpected.join(", ")}`);
  }

  return errors;
}
