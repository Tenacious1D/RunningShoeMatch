import type { Metadata } from "next";
import { ExternalLink, Scale } from "lucide-react";

import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/layout/page-hero";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Affiliate Disclosure | Running Shoe Match",
  description: "Read the Running Shoe Match affiliate disclosure and editorial principles.",
  alternates: { canonical: "/affiliate-disclosure" },
};

export default function AffiliateDisclosurePage() {
  return (
    <main>
      <PageHero eyebrow="Transparency" title="Affiliate Disclosure" description="How retailer links may support Running Shoe Match and how that relates to our evaluation process." />
      <Container size="narrow" className="py-12 sm:py-16">
        <Card className="border-primary/20"><CardContent className="p-6 sm:p-8"><ExternalLink className="h-6 w-6 text-primary" aria-hidden="true" /><p className="mt-5 text-xl font-bold leading-8">Running Shoe Match may earn a commission when you purchase through links on this site.</p><p className="mt-4 leading-7 text-muted-foreground">When affiliate retailer links are introduced, a qualifying purchase may generate compensation for the site. Retailer links will be stored with shoe data rather than hard-coded into pages or articles.</p></CardContent></Card>
        <div className="mt-10 flex gap-4"><Scale className="mt-1 h-6 w-6 shrink-0 text-accent" aria-hidden="true" /><div><h2 className="text-xl font-bold">Evaluation independence</h2><p className="mt-3 leading-7 text-muted-foreground">Affiliate availability will not determine a shoe&apos;s score or ranking position. The detailed evaluation methodology will be documented before recommendations are published.</p></div></div>
      </Container>
    </main>
  );
}
