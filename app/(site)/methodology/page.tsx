import type { Metadata } from "next";
import Link from "next/link";
import { Archive, Database, Scale } from "lucide-react";

import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/layout/page-hero";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";

export const metadata: Metadata = {
  title: "Methodology | Running Shoe Match",
  description: "See the planned principles behind Running Shoe Match recommendations and rankings.",
  alternates: { canonical: "/methodology" },
};

const methods = [
  { icon: Database, title: "Structured inputs", text: "Shoes will be evaluated through consistent product fields rather than one-off page copy." },
  { icon: Scale, title: "Defined criteria", text: "Each category will use relevant, documented criteria instead of a single universal list." },
  { icon: Archive, title: "Versioned results", text: "Published ranking snapshots will be retained so changes over time can be explained." },
];

export default function MethodologyPage() {
  return (
    <main>
      <PageHero eyebrow="Methodology" title="How We Plan to Evaluate Running Shoes" description="A transparent framework for comparing intended use, shoe attributes, and runner needs without embedding decisions inside the interface." />
      <Container className="py-12 sm:py-16">
        <div className="rounded-lg border border-accent/30 bg-accent/5 p-5 sm:p-6"><p className="font-bold">Methodology in development</p><p className="mt-2 text-sm leading-6 text-muted-foreground">The criteria are still being finalized, and no live ranking has been published.</p></div>
        <SectionHeading className="mt-14" title="Planned foundations" description="The recommendation experience will use deterministic rules and a separate matching engine, not an LLM. Affiliate relationships will not determine scores or placement." />
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {methods.map(({ icon: Icon, title, text }) => <Card key={title}><CardContent className="p-6"><Icon className="h-6 w-6 text-primary" aria-hidden="true" /><h2 className="mt-5 text-lg font-bold">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></CardContent></Card>)}
        </div>
        <div className="mt-12"><Button asChild><Link href="/rankings">Explore category previews</Link></Button></div>
      </Container>
    </main>
  );
}
