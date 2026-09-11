import type { Metadata } from "next";
import { ArrowRight, CheckCircle2, Database, ListChecks, SlidersHorizontal } from "lucide-react";
import Link from "next/link";

import { ArticleCard } from "@/components/content/article-card";
import { Container } from "@/components/layout/container";
import { RankingCategoryCard } from "@/components/rankings/ranking-category-card";
import { ShoeCard } from "@/components/shoes/shoe-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/utils";
import { getActiveRankingCategories } from "@/lib/data/rankings";
import { getActiveShoes } from "@/lib/data/shoes";
import { placeholderGuides } from "@/lib/placeholder-data";

export const metadata: Metadata = {
  title: "Running Shoe Match | Find the Right Running Shoe",
  description: "Narrow down running shoes using structured shoe data, guided matching, and independent ranking criteria.",
  alternates: { canonical: "/" },
};

const steps = [
  {
    title: "Tell us how you run",
    description: "Share the surfaces, distances, support needs, and ride preferences that shape your training.",
    icon: SlidersHorizontal,
  },
  {
    title: "We compare your needs against our shoe data",
    description: "A deterministic matching system will evaluate structured specifications and intended use.",
    icon: Database,
  },
  {
    title: "See your best matches",
    description: "Review a focused shortlist with clear reasons, useful specifications, and comparison context.",
    icon: ListChecks,
  },
] as const;

export default async function HomePage() {
  const [featuredShoes, rankingCategories] = await Promise.all([
    getActiveShoes(3),
    getActiveRankingCategories(),
  ]);

  return (
    <main>
      <section className="overflow-hidden border-b border-border bg-card">
        <Container size="wide" className="grid gap-12 py-16 sm:py-20 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:py-28">
          <div className="max-w-3xl">
            <Badge variant="success">Objective guidance for runners</Badge>
            <h1 className="mt-6 text-4xl font-bold tracking-[-0.04em] sm:text-5xl lg:text-6xl lg:leading-[1.04]">
              Find the Running Shoe That Fits Your Run
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
              Running Shoe Match uses structured shoe data and independent ranking criteria to help narrow down shoes for the way you actually train.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/quiz" className={cn(buttonVariants({ size: "lg" }), "group")}>
                Find My Shoe
                <ArrowRight className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
              <Link href="/rankings" className={buttonVariants({ variant: "outline", size: "lg" })}>
                Explore Rankings
              </Link>
            </div>
            <p className="mt-6 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />
              Deterministic matching. Transparent criteria. No black-box recommendations.
            </p>
          </div>

          <Card className="overflow-hidden border-primary/20 bg-background shadow-lifted">
            <div className="border-b border-border bg-foreground px-5 py-4 text-background sm:px-6">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-background/60">Comparison preview</p>
              <p className="mt-1 font-semibold">One clear view of the details that matter</p>
            </div>
            <CardContent className="space-y-4 p-5 sm:p-6">
              {[
                ["Use case", "Daily training"],
                ["Surface", "Road"],
                ["Support", "Neutral"],
                ["Cushion", "Balanced"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-6 rounded-md border border-border bg-card px-4 py-3">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span className="text-sm font-semibold">{value}</span>
                </div>
              ))}
              <div className="rounded-md border border-dashed border-primary/30 bg-primary/5 px-4 py-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Match results coming later</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">This panel will explain why each recommended shoe fits the runner profile.</p>
              </div>
            </CardContent>
          </Card>
        </Container>
      </section>

      <section className="section-space">
        <Container size="wide">
          <SectionHeading eyebrow="How it works" title="A focused path from needs to shoes" description="The finished experience will keep the questions simple while the matching logic remains structured and explainable." />
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {steps.map(({ title, description, icon: Icon }, index) => (
              <Card key={title} className="h-full">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="text-sm font-bold tabular-nums text-muted-foreground">0{index + 1}</span>
                  </div>
                  <h2 className="mt-6 text-xl font-bold tracking-tight">{title}</h2>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="section-space border-y border-border bg-card">
        <Container size="wide">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading eyebrow="Explore running shoe rankings" title="Start with the job the shoe needs to do" description="Each active category uses a consistent page backed by the newest published ranking snapshot." />
            <Link href="/rankings" className={cn(buttonVariants({ variant: "outline" }), "shrink-0")}>View all rankings</Link>
          </div>
          {rankingCategories.length ? (
            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {rankingCategories.map((category) => (
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
            <p className="mt-10 rounded-lg border border-dashed border-border bg-background p-8 text-center text-sm text-muted-foreground">No active ranking categories are published yet.</p>
          )}
        </Container>
      </section>

      <section className="section-space">
        <Container size="wide">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading eyebrow="Browse shoes" title="A database designed for useful comparison" description="Shoe profiles combine available specifications, metric context, and retailer options in one reusable format." />
            <Link href="/shoes" className={cn(buttonVariants({ variant: "outline" }), "shrink-0")}>Browse all shoes</Link>
          </div>
          {featuredShoes.length ? (
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredShoes.map((shoe) => <ShoeCard key={shoe.id} shoe={shoe} />)}
            </div>
          ) : (
            <div className="mt-10 rounded-lg border border-dashed border-border bg-surface p-8 text-center">
              <p className="font-bold">No active shoe profiles are published yet.</p>
              <p className="mt-2 text-sm text-muted-foreground">Visit the shoe database after development data has been seeded.</p>
            </div>
          )}
        </Container>
      </section>

      <section className="section-space bg-foreground text-background">
        <Container size="wide" className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-background/60">Learn about our rankings</p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">A methodology you can inspect—not a list you have to trust blindly.</h2>
            <p className="mt-4 text-base leading-7 text-background/70 sm:text-lg">See how structured specifications, runner feedback, intended use, and versioned snapshots are planned to work together.</p>
          </div>
          <Link href="/methodology" className={buttonVariants({ variant: "accent", size: "lg" })}>Read the methodology <ArrowRight aria-hidden="true" /></Link>
        </Container>
      </section>

      <section className="section-space">
        <Container size="wide">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading eyebrow="Latest guides" title="Learn the language of running shoes" description="Practical explainers will help runners interpret specifications and compare options with more confidence." />
            <Link href="/blog" className={cn(buttonVariants({ variant: "outline" }), "shrink-0")}>Visit the blog</Link>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {placeholderGuides.map((guide) => <ArticleCard key={guide.title} {...guide} />)}
          </div>
        </Container>
      </section>
    </main>
  );
}
