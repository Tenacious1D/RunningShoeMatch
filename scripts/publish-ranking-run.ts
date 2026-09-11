import { z } from "zod";

import { createImportClient } from "./import/supabase";

const runIdSchema = z.string().uuid();

async function run() {
  const args = process.argv.slice(2);
  if (args.length !== 1) throw new Error("Usage: npm run rankings:publish -- <ranking-run-id>");

  const parsed = runIdSchema.safeParse(args[0]);
  if (!parsed.success) throw new Error("The ranking run ID must be a valid UUID.");

  const client = createImportClient();
  const { data, error } = await client.rpc("publish_ranking_run", { p_ranking_run_id: parsed.data });
  if (error) throw new Error(`Ranking publication failed: ${error.message}`);

  const result = data as { ranking_run_id?: string; status?: string; published_at?: string; result_count?: number; already_published?: boolean } | null;
  if (!result?.ranking_run_id || result.status !== "published") throw new Error("Publication completed without a valid published response.");

  console.log(result.already_published ? "Ranking run was already published; no changes were made." : "Ranking run published successfully.");
  console.log(`Ranking run ID: ${result.ranking_run_id}`);
  console.log(`Results: ${result.result_count ?? 0}`);
  console.log(`Published at: ${result.published_at ?? "unknown"}`);
}

void run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Unexpected ranking publication failure.");
  process.exitCode = 1;
});
