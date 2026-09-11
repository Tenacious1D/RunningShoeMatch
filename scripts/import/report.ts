import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export type ImportMode = "dry-run" | "apply";

export type ImportReport = {
  entity: "shoes" | "metrics" | "rankings";
  mode: ImportMode;
  sourceFile: string;
  startedAt: string;
  finishedAt: string;
  added: number;
  updated: number;
  skipped: number;
  invalid: number;
  errors: string[];
  rankingRunId?: string;
};

function safeFilePart(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "import";
}

export async function writeImportReport(report: ImportReport): Promise<string> {
  const reportDirectory = path.resolve(process.cwd(), "data", "imports", "reports");
  const stamp = report.finishedAt.replace(/[:.]/g, "-");
  const sourceName = safeFilePart(path.basename(report.sourceFile, path.extname(report.sourceFile)));
  const reportPath = path.join(reportDirectory, `${stamp}-${report.entity}-${sourceName}-${report.mode}.md`);
  const errorLines = report.errors.length
    ? report.errors.map((error) => `- ${error}`).join("\n")
    : "- None";
  const entityTitle = report.entity === "shoes" ? "Shoe" : report.entity === "metrics" ? "Metric" : "Ranking";
  const runLine = report.rankingRunId ? `\n- Ranking run ID: ${report.rankingRunId}` : "";
  const markdown = `# ${entityTitle} import report

- Mode: ${report.mode === "dry-run" ? "DRY RUN (no database writes)" : "APPLY"}
- Source: ${report.sourceFile}
- Started: ${report.startedAt}
- Finished: ${report.finishedAt}
${runLine}

## Summary

| Result | Count |
| --- | ---: |
| Added | ${report.added} |
| Updated | ${report.updated} |
| Skipped | ${report.skipped} |
| Invalid | ${report.invalid} |
| Errors | ${report.errors.length} |

## Errors

${errorLines}
`;

  await mkdir(reportDirectory, { recursive: true });
  await writeFile(reportPath, markdown, "utf8");
  return path.relative(process.cwd(), reportPath);
}

export function printImportSummary(report: ImportReport, reportPath: string) {
  console.log(`\n${report.entity.toUpperCase()} IMPORT ${report.mode === "dry-run" ? "DRY RUN" : "APPLY"}`);
  console.log(`Added: ${report.added}`);
  console.log(`Updated: ${report.updated}`);
  console.log(`Skipped: ${report.skipped}`);
  console.log(`Invalid: ${report.invalid}`);
  console.log(`Errors: ${report.errors.length}`);
  console.log(`Report: ${reportPath}`);
  if (report.rankingRunId) console.log(`Ranking run ID: ${report.rankingRunId}`);

  if (report.mode === "dry-run") {
    console.log("No database changes were made.");
  }
}
