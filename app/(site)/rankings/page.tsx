import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/layout/page-hero";
import { RankingCategoryCard } from "@/components/rankings/ranking-category-card";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { rankingCategories } from "@/lib/placeholder-data";

export const metadata: Metadata = {
  title: "Running Shoe Rankings | Running Shoe Match",
  description: "Explore upcoming running shoe ranking categories built around transparent, repeatable criteria.",
  alternates: { canonical: "/rankings" },
};

export default function RankingsPage() {
  return (
    <main>
      <PageHero eyebrow="Category rankings" title="Running Shoe Rankings" description="Explore the categories we plan to evaluate using structured data, defined criteria, and versioned ranking snapshots." />
      <Container className="py-12 sm:py-16">
        <SectionHeading title="Explore ranking categories" description="Category pages are ready for future published results. No product rankings or scores are live yet." />
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rankingCategories.map((category) => <RankingCategoryCard key={category.slug} title={category.title} description={category.description} surface={category.surface} href={`/rankings/${category.slug}`} />)}
        </div>
        <div className="mt-14 flex flex-col gap-5 rounded-lg border border-border bg-surface p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <h2 className="text-xl font-bold tracking-tight">How will rankings work?</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Read the planned principles behind evaluation criteria, snapshot history, and editorial independence.</p>
          </div>
          <Button asChild variant="outline"><Link href="/methodology">Read methodology</Link></Button>
        </div>
      </Container>
    </main>
  );
}
