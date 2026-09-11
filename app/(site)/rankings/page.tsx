import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/layout/page-hero";
import { RankingCategoryCard } from "@/components/rankings/ranking-category-card";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { getActiveRankingCategories } from "@/lib/data/rankings";

export const metadata: Metadata = {
  title: "Running Shoe Rankings | Running Shoe Match",
  description: "Explore published running shoe ranking categories built around transparent, repeatable criteria and versioned snapshots.",
  alternates: { canonical: "/rankings" },
};

export default async function RankingsPage() {
  const categories = await getActiveRankingCategories();
  const showDemoNotice =
    process.env.NODE_ENV === "development" &&
    categories.some((category) => category.isDemo);

  return (
    <main>
      <PageHero eyebrow="Category rankings" title="Running Shoe Rankings" description="Explore active categories backed by published, date-stamped ranking snapshots. Each update preserves the previous results for historical comparison." />
      <Container className="py-12 sm:py-16">
        {showDemoNotice ? (
          <div className="mb-10 rounded-lg border border-warning/30 bg-warning/10 p-5 text-sm leading-6">
            <p className="font-bold">Development/demo ranking data</p>
            <p className="mt-1 text-muted-foreground">These seeded categories and their results are fictional fixtures used to verify the application. They are not official rankings.</p>
          </div>
        ) : null}
        <SectionHeading title="Explore ranking categories" description="Every active category uses the same reusable page and automatically selects its newest published snapshot." />
        {categories.length ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <RankingCategoryCard
                key={category.id}
                title={category.name}
                description={category.description}
                isDemo={process.env.NODE_ENV === "development" && category.isDemo}
                href={`/rankings/${category.slug}`}
              />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-lg border border-dashed border-border bg-surface p-8 text-center">
            <h2 className="text-xl font-bold tracking-tight">No active ranking categories are available.</h2>
            <p className="mt-2 text-sm text-muted-foreground">Publish or seed ranking data to populate this page.</p>
          </div>
        )}
        <div className="mt-14 flex flex-col gap-5 rounded-lg border border-border bg-surface p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <h2 className="text-xl font-bold tracking-tight">How do rankings work?</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Read the principles behind evaluation criteria, snapshot history, and editorial independence.</p>
          </div>
          <Button asChild variant="outline"><Link href="/methodology">Read methodology</Link></Button>
        </div>
      </Container>
    </main>
  );
}
