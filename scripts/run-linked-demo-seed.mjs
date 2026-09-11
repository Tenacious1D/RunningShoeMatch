import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const confirmationVariable = "RSM_ALLOW_LINKED_DEMO_SEED";
const requiredConfirmation = "YES";

if (process.env[confirmationVariable] !== requiredConfirmation) {
  console.error(
    `Refusing to seed a linked database. Set ${confirmationVariable}=${requiredConfirmation} only for a disposable development project.`,
  );
  process.exit(1);
}

const projectRoot = process.cwd();
const projectRefPath = resolve(projectRoot, "supabase", ".temp", "project-ref");
const environmentPath = resolve(projectRoot, ".env.local");

if (!existsSync(projectRefPath) || !existsSync(environmentPath)) {
  console.error(
    "The linked project reference or .env.local is missing. Run Supabase link and configure .env.local first.",
  );
  process.exit(1);
}

const linkedProjectRef = readFileSync(projectRefPath, "utf8").trim();
const environmentText = readFileSync(environmentPath, "utf8");
const urlLine = environmentText
  .split(/\r?\n/)
  .find((line) => line.trim().startsWith("NEXT_PUBLIC_SUPABASE_URL="));
const configuredUrl = urlLine?.slice(urlLine.indexOf("=") + 1).trim().replace(/^['\"]|['\"]$/g, "");

if (!configuredUrl) {
  console.error("NEXT_PUBLIC_SUPABASE_URL is missing from .env.local.");
  process.exit(1);
}

let configuredProjectRef;

try {
  configuredProjectRef = new URL(configuredUrl).hostname.split(".")[0];
} catch {
  console.error("NEXT_PUBLIC_SUPABASE_URL in .env.local is not a valid URL.");
  process.exit(1);
}

if (!linkedProjectRef || configuredProjectRef !== linkedProjectRef) {
  console.error(
    "The Supabase CLI link does not match NEXT_PUBLIC_SUPABASE_URL. Refusing to seed the linked database.",
  );
  process.exit(1);
}

const supabaseEntrypoint = resolve(
  projectRoot,
  "node_modules",
  "supabase",
  "dist",
  "supabase.js",
);
const result = spawnSync(
  process.execPath,
  [supabaseEntrypoint, "db", "query", "--linked", "--file", "supabase/seed.sql"],
  { stdio: "inherit", windowsHide: true },
);

if (result.error) {
  console.error(`Unable to start the Supabase CLI: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
