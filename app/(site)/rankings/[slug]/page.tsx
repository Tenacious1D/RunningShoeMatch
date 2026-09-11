import type { Metadata } from "next";
import { ArrowLeft, CalendarDays, GitCompareArrows, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/layout/page-hero";
import { RankingList } from "@/components/rankings/ranking-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/data/formatters";
import {
  getActiveRankingCategories,
  getRankingCategoryBySlug,
  getRankingPageBySlug,
} from "@/lib/data/rankings";

type RankingPageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const categories = await getActiveRankingCategories();
  return categories.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: RankingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getRankingCategoryBySlug(slug);

  if (!category) {
    return { title: "Ranking Not Found | Running Shoe Match" };
  }

  const title = `${category.name} Rankings | Running Shoe Match`;
  const description =
    category.description ??
    `View the latest published ${category.name.toLowerCase()} ranking snapshot from Running Shoe Match.`;

  return {
    title,
    description,
    alternates: { canonical: `/rankings/${category.slug}` },
    openGraph: { title, description, type: "website" },
  };
}

export default async function RankingCategoryPage({ params }: RankingPageProps) {
  const { slug } = await params;
  const ranking = await getRankingPageBySlug(slug);

  if (!ranking) {
    notFound();
  }

  const showDemoNotice =
    process.env.NODE_ENV === "development" && ranking.isDemo;

  return (
    <main>
      <PageHero
        eyebrow="Published ranking"
        title={`${ranking.category.name} Rankings`}
        description={ranking.category.description ?? "A versioned running shoe ranking category."}
      >
        <Button asChild variant="outline"><Link href="/methodology">View methodology</Link></Button>
      </PageHero>

      <Container size="wide" className="py-12 sm:py-16">
        {showDemoNotice ? (
          <div className="mb-8 rounded-lg border border-warning/30 bg-warning/10 p-5 sm:p-6">
            <p className="font-bold">Development/demo results—not an official ranking</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">The shoes, scores, movements, and component scores below come from fictional seeded snapshots for application testing.</p>
          </div>
        ) : null}

        {ranking.currentRun ? (
          <>
            <Card className="mb-10">
              <CardContent className="grid gap-6 p-5 sm:p-6 md:grid-cols-3">
                <div className="flex gap-3">
                  <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Effective date</p>
                    <p className="mt-2 font-bold">{formatDate(ranking.currentRun.effectiveDate)}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Methodology version</p>
                    <p className="mt-2 font-bold">{ranking.currentRun.methodologyVersion}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <GitCompareArrows className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Movement comparison</p>
                    <p className="mt-2 font-bold">
                      {ranking.previousRun
                        ? formatDate(ranking.previousRun.effectiveDate)
                        : "First published snapshot"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <Badge variant="neutral">{ranking.currentRun.name}</Badge>
                <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Ranked shoes</h2>
              </div>
              <p className="text-sm text-muted-foreground">{ranking.results.length} {ranking.results.length === 1 ? "shoe" : "shoes"}</p>
            </div>

            {ranking.results.length ? (
              <RankingList results={ranking.results} label={`${ranking.category.name} ranking results`} />
            ) : (
              <p className="rounded-lg border border-dashed border-border bg-surface p-8 text-center text-sm text-muted-foreground">This published snapshot does not contain any publicly visible shoes.</p>
            )}

            {ranking.results.some((result) => result.primaryRetailerOffer) ? (
              <p className="mt-6 text-xs leading-5 text-muted-foreground">Running Shoe Match may earn a commission when you purchase through links on this site. Affiliate relationships do not determine ranking order.</p>
            ) : null}
          </>
        ) : (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-6 sm:p-8">
            <h2 className="text-xl font-bold tracking-tight">No published ranking is available for this category.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">The category is active, but it does not yet appear in a published ranking run.</p>
          </div>
        )}

        <div className="mt-12 flex flex-col gap-4 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
          <Button asChild variant="ghost" className="self-start"><Link href="/rankings"><ArrowLeft aria-hidden="true" />All ranking categories</Link></Button>
          <Button asChild variant="outline" className="self-start"><Link href="/methodology">How rankings are evaluated</Link></Button>
        </div>
      </Container>
    </main>
  );
}
