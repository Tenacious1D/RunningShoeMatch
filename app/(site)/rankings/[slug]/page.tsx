import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/layout/page-hero";
import { RankingResultRow } from "@/components/rankings/ranking-result-row";
import { Button } from "@/components/ui/button";
import { getRankingCategory, rankingCategories } from "@/lib/placeholder-data";

type RankingPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return rankingCategories.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: RankingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = getRankingCategory(slug);
  if (!category) return {};
  return {
    title: `${category.title} Rankings | Running Shoe Match`,
    description: `Preview the upcoming ${category.title.toLowerCase()} ranking category from Running Shoe Match.`,
    alternates: { canonical: `/rankings/${slug}` },
  };
}

export default async function RankingCategoryPage({ params }: RankingPageProps) {
  const { slug } = await params;
  const category = getRankingCategory(slug);
  if (!category) notFound();

  return (
    <main>
      <PageHero eyebrow="Category preview" title={`${category.title} Rankings`} description={category.description}>
        <Button asChild variant="outline"><Link href="/methodology">How rankings will work</Link></Button>
      </PageHero>
      <Container className="py-12 sm:py-16">
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-5 sm:p-6">
          <p className="font-bold">No ranking has been published for this category yet.</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">This template will display a versioned ranking snapshot once the shoe data and evaluation criteria are ready.</p>
        </div>
        <div className="mt-10 space-y-4" aria-label="Future ranking results">
          {Array.from({ length: 3 }, (_, index) => <RankingResultRow key={index} />)}
        </div>
        <Button asChild variant="ghost" className="mt-8"><Link href="/rankings">Back to all categories</Link></Button>
      </Container>
    </main>
  );
}
