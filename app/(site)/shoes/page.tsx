import type { Metadata } from "next";
import { Search, SlidersHorizontal } from "lucide-react";

import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/layout/page-hero";
import { ShoeCard } from "@/components/shoes/shoe-card";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { getActiveShoes, isShoeCatalogConfigured } from "@/lib/data/shoes";

export const metadata: Metadata = {
  title: "Browse Running Shoes | Running Shoe Match",
  description: "Browse the future Running Shoe Match database of structured running shoe profiles.",
  alternates: { canonical: "/shoes" },
};

const filters = ["Surface", "Support", "Cushion", "Use case"];

export default async function ShoesPage() {
  const shoes = await getActiveShoes();
  const isConfigured = isShoeCatalogConfigured();

  return (
    <main>
      <PageHero eyebrow="Shoe database" title="Browse Running Shoes" description="Compare active running shoes using structured specifications, metrics, ranking context, and retailer availability from our database." />
      <Container className="py-12 sm:py-16">
        <div className="rounded-lg border border-border bg-card p-4 shadow-card sm:p-5">
          <div className="relative">
            <label htmlFor="shoe-search" className="sr-only">Search running shoes</label>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input id="shoe-search" type="search" placeholder="Search is coming soon" disabled className="h-12 w-full rounded-md border border-border bg-background pl-12 pr-4 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-70" />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="Future shoe filters">
            <span className="mr-1 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground"><SlidersHorizontal className="h-4 w-4" aria-hidden="true" />Filters</span>
            {filters.map((filter) => <Button key={filter} variant="outline" size="sm" disabled>{filter}</Button>)}
          </div>
        </div>
        <SectionHeading className="mt-14" eyebrow="Current catalog" title="Active running shoes" description="These profiles come directly from Supabase. Development/demo records are fixtures and are not recommendations or official evaluations." />
        {shoes.length ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {shoes.map((shoe) => <ShoeCard key={shoe.id} shoe={shoe} />)}
          </div>
        ) : (
          <div className="mt-8 rounded-lg border border-dashed border-border bg-surface p-8 text-center sm:p-12">
            <h2 className="text-xl font-bold tracking-tight">
              {isConfigured ? "No active shoes are published yet." : "Supabase is not configured."}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
              {isConfigured
                ? "Seed the development database or publish an active shoe to populate this catalog."
                : "Add the public Supabase URL and publishable key to .env.local, then restart the development server."}
            </p>
          </div>
        )}
      </Container>
    </main>
  );
}
