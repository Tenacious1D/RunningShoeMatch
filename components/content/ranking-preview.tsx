import Link from "next/link";

import { RankingScore } from "@/components/rankings/ranking-score";
import { AffiliateRetailerButton } from "@/components/shoes/affiliate-retailer-button";
import { ShoeImage } from "@/components/shoes/shoe-image";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/data/formatters";
import { getRankingPageBySlug } from "@/lib/data/rankings";

type RankingPreviewProps = {
  category: string;
  limit?: number;
};

async function RankingPreview({ category, limit = 3 }: RankingPreviewProps) {
  const ranking = await getRankingPageBySlug(category);

  if (!ranking || !ranking.currentRun) {
    return (
      <Card className="not-prose my-8 border-dashed">
        <CardContent className="p-6">
          <p className="font-bold">No published ranking is available for this category.</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">When a ranking snapshot is published, this preview will update automatically.</p>
          <Link href="/rankings" className={`${buttonVariants({ variant: "outline" })} mt-5`}>Explore rankings</Link>
        </CardContent>
      </Card>
    );
  }

  const results = ranking.results.slice(0, Math.max(1, limit));

  return (
    <section className="not-prose my-10 rounded-lg border border-border bg-card p-5 shadow-card sm:p-6" aria-label={`Current ${ranking.category.name} ranking preview`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="success">Current ranking</Badge>
            {process.env.NODE_ENV === "development" && ranking.isDemo ? <Badge variant="outline">Demo data</Badge> : null}
          </div>
          <h2 className="mt-3 text-2xl font-bold tracking-tight">{ranking.category.name}</h2>
          <p className="mt-2 text-sm text-muted-foreground">Effective {formatDate(ranking.currentRun.effectiveDate)} · Methodology {ranking.currentRun.methodologyVersion}</p>
        </div>
        <Link href={`/rankings/${ranking.category.slug}`} className={buttonVariants({ variant: "outline" })}>View full ranking</Link>
      </div>
      {results.length ? (
        <ol className="mt-6 divide-y divide-border border-y border-border">
          {results.map((result) => (
            <li key={result.id} className="grid gap-4 py-5 sm:grid-cols-[3rem_4.5rem_minmax(0,1fr)_7rem] sm:items-center">
              <span className="text-2xl font-bold tabular-nums">#{result.rank}</span>
              <ShoeImage src={result.shoe.imageUrl} alt={result.shoe.imageUrl ? `${result.shoe.brandName} ${result.shoe.modelName}` : ""} className="aspect-square rounded-md border border-border p-2" />
              <div className="min-w-0">
                <Link href={`/shoes/${result.shoe.slug}`} className="font-bold hover:text-primary">{result.shoe.brandName} {result.shoe.modelName}</Link>
                {result.primaryRetailerOffer ? <AffiliateRetailerButton offer={result.primaryRetailerOffer} className="mt-3 w-full justify-between sm:w-auto" /> : <p className="mt-2 text-xs text-muted-foreground">No retailer link available</p>}
              </div>
              <RankingScore score={result.score} />
            </li>
          ))}
        </ol>
      ) : <p className="mt-6 text-sm text-muted-foreground">This published snapshot has no publicly visible shoes.</p>}
      <p className="mt-5 text-xs leading-5 text-muted-foreground">Ranking values and retailer links are read from the current published database snapshot.</p>
    </section>
  );
}

export { RankingPreview, type RankingPreviewProps };
