import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/data/formatters";
import { listAdminRankingRuns } from "@/lib/data/admin";

export default async function AdminRankingsPage() {
  const runs = await listAdminRankingRuns();

  return (
    <main>
      <AdminPageHeader title="Ranking runs" description="Every imported ranking snapshot remains visible here. Draft and published states are kept separate, and published history is immutable." />
      <div className="mt-8 overflow-x-auto rounded-lg border border-border bg-card shadow-card">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-border bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th scope="col" className="px-5 py-3">Ranking run</th>
              <th scope="col" className="px-5 py-3">Effective date</th>
              <th scope="col" className="px-5 py-3">Methodology</th>
              <th scope="col" className="px-5 py-3">Status</th>
              <th scope="col" className="px-5 py-3 text-right">Results</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {runs.map((run) => (
              <tr key={run.id}>
                <th scope="row" className="px-5 py-4 font-semibold">{run.name}</th>
                <td className="px-5 py-4 text-muted-foreground">{formatDate(run.effectiveDate)}</td>
                <td className="px-5 py-4 font-mono text-xs">{run.methodologyVersion}</td>
                <td className="px-5 py-4"><Badge variant={run.status === "published" ? "success" : "neutral"}>{run.status}</Badge></td>
                <td className="px-5 py-4 text-right tabular-nums">{run.resultCount}</td>
              </tr>
            ))}
            {!runs.length ? <tr><td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">No ranking runs found.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </main>
  );
}
