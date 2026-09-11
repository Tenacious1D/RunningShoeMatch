import type { Metadata } from "next";
import { Search, SlidersHorizontal } from "lucide-react";

import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/layout/page-hero";
import { ShoeCard } from "@/components/shoes/shoe-card";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { placeholderShoes } from "@/lib/placeholder-data";

export const metadata: Metadata = {
  title: "Browse Running Shoes | Running Shoe Match",
  description: "Browse the future Running Shoe Match database of structured running shoe profiles.",
  alternates: { canonical: "/shoes" },
};

const filters = ["Surface", "Support", "Cushion", "Use case"];

export default function ShoesPage() {
  return (
    <main>
      <PageHero eyebrow="Shoe database" title="Browse Running Shoes" description="Compare structured shoe profiles in one consistent format. Search and filtering will activate when the database is ready." />
      <Container className="py-12 sm:py-16">
        <div className="rounded-lg border border-border bg-card p-4 shadow-card sm:p-5">
          <div className="relative">
            <label htmlFor="shoe-search" className="sr-only">Search running shoes</label>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input id="shoe-search" type="search" placeholder="Search by brand or model" className="h-12 w-full rounded-md border border-border bg-background pl-12 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/20" />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="Future shoe filters">
            <span className="mr-1 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground"><SlidersHorizontal className="h-4 w-4" aria-hidden="true" />Filters</span>
            {filters.map((filter) => <Button key={filter} variant="outline" size="sm" disabled>{filter}</Button>)}
          </div>
        </div>
        <SectionHeading className="mt-14" eyebrow="Database preview" title="Shoe profiles are coming" description="These placeholders demonstrate the reusable card layout. They are not product recommendations or published evaluations." />
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {placeholderShoes.map((shoe) => <ShoeCard key={shoe.name} {...shoe} />)}
        </div>
      </Container>
    </main>
  );
}
