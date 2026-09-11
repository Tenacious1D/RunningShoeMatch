import type { Metadata } from "next";
import { BarChart3, Focus, ListChecks } from "lucide-react";

import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/layout/page-hero";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";

export const metadata: Metadata = {
  title: "About | Running Shoe Match",
  description: "Learn why Running Shoe Match is being built and how it will help runners compare shoes.",
  alternates: { canonical: "/about" },
};

const principles = [
  { icon: Focus, title: "Fit the run", text: "Start with how a runner trains and what they need the shoe to do." },
  { icon: ListChecks, title: "Use consistent data", text: "Describe every shoe through the same structured fields and evaluation framework." },
  { icon: BarChart3, title: "Explain the result", text: "Show why a shoe appears in a match or ranking instead of hiding the reasoning." },
];

export default function AboutPage() {
  return (
    <main>
      <PageHero eyebrow="About the project" title="A Clearer Way to Compare Running Shoes" description="Running Shoe Match is being built to help runners move from crowded choices to a useful, explainable shortlist." />
      <Container className="py-12 sm:py-16">
        <SectionHeading title="Built around the runner" description="The goal is not to recreate a shoe store. It is to organize relevant shoe data, ask focused questions, and make comparisons easier to understand." />
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {principles.map(({ icon: Icon, title, text }) => (
            <Card key={title}><CardContent className="p-6"><Icon className="h-6 w-6 text-primary" aria-hidden="true" /><h2 className="mt-5 text-lg font-bold">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></CardContent></Card>
          ))}
        </div>
        <div className="mt-14 max-w-3xl border-l-4 border-accent pl-6">
          <h2 className="text-2xl font-bold tracking-tight">What comes next</h2>
          <p className="mt-3 leading-7 text-muted-foreground">The public experience is currently a design foundation. Structured shoe records, a deterministic matching engine, versioned rankings, and editorial guides will be added in deliberate phases.</p>
        </div>
      </Container>
    </main>
  );
}
