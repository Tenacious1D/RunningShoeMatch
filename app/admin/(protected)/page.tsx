import Link from "next/link";
import { CalendarClock, Database, ExternalLink, Eye, EyeOff, Footprints, Gauge, Store, Tags } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/data/formatters";
import { getAdminDashboardSummary } from "@/lib/data/admin";

const cards = [
  { key: "activeShoes", label: "Active shoes", icon: Footprints, href: "/admin/shoes" },
  { key: "publicShoes", label: "Public shoes", icon: Eye, href: "/admin/shoes" },
  { key: "nonPublicShoes", label: "Non-public shoes", icon: EyeOff, href: "/admin/shoes" },
  { key: "brands", label: "Brands", icon: Tags, href: "/admin/shoes" },
  { key: "metrics", label: "Metric observations", icon: Gauge, href: "/admin/shoes" },
  { key: "retailerLinks", label: "Retailer links", icon: Store, href: "/admin/shoes" },
  { key: "rankingRuns", label: "Ranking runs", icon: Database, href: "/admin/rankings" },
  { key: "draftRankingRuns", label: "Draft ranking runs", icon: CalendarClock, href: "/admin/rankings" },
] as const;

export default async function AdminDashboardPage() {
  const summary = await getAdminDashboardSummary();

  return (
    <main>
      <AdminPageHeader title="Dashboard" description="Read-only operational summaries from Supabase. Editing and browser uploads will be added only when their authorization workflows are designed." />

      <section aria-label="Database summary" className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ key, label, icon: Icon, href }) => (
          <Link href={href} key={key} className="group">
            <Card className="h-full transition-colors group-hover:border-primary/35">
              <CardContent className="p-5 sm:p-6">
                <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                <p className="mt-5 text-3xl font-bold tracking-tight">{summary[key]}</p>
                <p className="mt-1 text-sm text-muted-foreground">{label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>

      <Card className="mt-6">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-sm font-semibold">Latest published ranking effective date</p>
            <p className="mt-1 text-xl font-bold">{summary.latestPublishedRankingDate ? formatDate(summary.latestPublishedRankingDate) : "No published rankings"}</p>
          </div>
          <Link href="/admin/rankings" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
            Review ranking runs <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
