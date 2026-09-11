import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const target = process.argv[2];

if (target !== "--local" && target !== "--linked") {
  console.error("Usage: node scripts/validate-database.mjs --local|--linked");
  process.exit(1);
}

const supabaseEntrypoint = resolve(
  process.cwd(),
  "node_modules",
  "supabase",
  "dist",
  "supabase.js",
);
const result = spawnSync(
  process.execPath,
  [
    supabaseEntrypoint,
    "db",
    "query",
    target,
    "--file",
    "supabase/validation/validate_database.sql",
    "--output-format",
    "json",
    "--agent",
    "yes",
  ],
  { encoding: "utf8", windowsHide: true },
);

if (result.error) {
  console.error(`Unable to start the Supabase CLI: ${result.error.message}`);
  process.exit(1);
}

if (result.status !== 0) {
  process.stderr.write(result.stderr);
  process.stdout.write(result.stdout);
  process.exit(result.status ?? 1);
}

let payload;

try {
  payload = JSON.parse(result.stdout.trim());
} catch {
  console.error("Supabase returned an unreadable validation response.");
  process.stderr.write(result.stderr);
  process.exit(1);
}

if (!Array.isArray(payload.rows)) {
  console.error("Supabase validation response did not include result rows.");
  process.exit(1);
}

const failures = payload.rows.filter((row) => Number(row.issue_count) !== 0);

for (const row of payload.rows) {
  const issueCount = Number(row.issue_count);
  const status = issueCount === 0 ? "PASS" : `FAIL (${issueCount})`;
  console.log(`${status}: ${String(row.check_name)}`);
}

if (failures.length > 0) {
  process.exit(1);
}
