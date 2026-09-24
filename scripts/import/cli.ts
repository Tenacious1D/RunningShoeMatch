import path from "node:path";

import type { ImportMode, ImportReport } from "./report";

export type ImportArguments = {
  filePath: string;
  mode: ImportMode;
};

export function parseImportArguments(argv: string[], command: string): ImportArguments {
  const dryRun = argv.includes("--dry-run");
  const apply = argv.includes("--apply");
  const positional = argv.filter((argument) => !argument.startsWith("--"));
  const unknownFlags = argv.filter((argument) => argument.startsWith("--") && !["--dry-run", "--apply"].includes(argument));

  if (unknownFlags.length || positional.length !== 1 || dryRun === apply) {
    throw new Error(`Usage: npm run ${command} -- <file.csv> --dry-run|--apply`);
  }

  return {
    filePath: path.resolve(process.cwd(), positional[0]),
    mode: dryRun ? "dry-run" : "apply",
  };
}

export function createEmptyReport(entity: ImportReport["entity"], mode: ImportMode, sourceFile: string): ImportReport {
  const now = new Date().toISOString();
  return {
    entity,
    mode,
    sourceFile: path.relative(process.cwd(), sourceFile),
    startedAt: now,
    finishedAt: now,
    added: 0,
    updated: 0,
    skipped: 0,
    invalid: 0,
    errors: [],
  };
}
