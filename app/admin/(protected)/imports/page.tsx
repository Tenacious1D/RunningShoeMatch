import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const workflows = [
  { title: "Shoe catalog", dryRun: "npm run import:shoes -- data/imports/your-shoes.csv --dry-run", apply: "npm run import:shoes -- data/imports/your-shoes.csv --apply" },
  { title: "Shoe metrics", dryRun: "npm run import:metrics -- data/imports/your-metrics.csv --dry-run", apply: "npm run import:metrics -- data/imports/your-metrics.csv --apply" },
  { title: "Ranking snapshot", dryRun: "npm run import:rankings -- data/imports/your-rankings.csv --dry-run", apply: "npm run import:rankings -- data/imports/your-rankings.csv --apply" },
] as const;

export default function AdminImportsPage() {
  return (
    <main>
      <AdminPageHeader title="Imports" description="CSV imports currently run from a trusted local terminal using the server-only Supabase secret. Browser uploads are intentionally not enabled yet." />
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {workflows.map((workflow) => (
          <Card key={workflow.title}>
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3"><h2 className="font-bold">{workflow.title}</h2><Badge variant="outline">CLI only</Badge></div>
              <p className="mt-5 text-xs font-bold uppercase tracking-wide text-muted-foreground">1. Validate</p>
              <code className="mt-2 block overflow-x-auto rounded-md bg-foreground p-3 text-xs leading-5 text-background">{workflow.dryRun}</code>
              <p className="mt-5 text-xs font-bold uppercase tracking-wide text-muted-foreground">2. Apply after review</p>
              <code className="mt-2 block overflow-x-auto rounded-md bg-foreground p-3 text-xs leading-5 text-background">{workflow.apply}</code>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-6 rounded-lg border border-border bg-card p-5 text-sm leading-6 text-muted-foreground sm:p-6">
        Ranking imports create drafts. Publish an approved draft separately with <code className="rounded bg-muted px-1.5 py-1 text-foreground">npm run rankings:publish -- &lt;ranking-run-id&gt;</code>. See <code className="text-foreground">docs/IMPORTING.md</code> and <code className="text-foreground">docs/RANKING_IMPORTS.md</code> for the full safeguards.
      </div>
    </main>
  );
}
