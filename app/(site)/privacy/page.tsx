import type { Metadata } from "next";
import { Cookie, MousePointerClick, UserRoundCheck } from "lucide-react";

import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/layout/page-hero";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Privacy | Running Shoe Match",
  description: "Privacy information for the Running Shoe Match website.",
  alternates: { canonical: "/privacy" },
};

const futureTopics = [
  { icon: UserRoundCheck, title: "Quiz responses", text: "How optional runner-profile answers are handled when the matching quiz launches." },
  { icon: MousePointerClick, title: "Affiliate clicks", text: "What limited referral information may be recorded when retailer links are introduced." },
  { icon: Cookie, title: "Site analytics", text: "What measurement tools are used, why they are used, and the controls available to visitors." },
];

export default function PrivacyPage() {
  return (
    <main>
      <PageHero eyebrow="Site information" title="Privacy" description="A plain-language privacy policy will explain what the site collects, why it is needed, and how visitors can exercise their choices." />
      <Container size="narrow" className="py-12 sm:py-16">
        <Badge variant="neutral">Policy placeholder</Badge>
        <h2 className="mt-5 text-2xl font-bold tracking-tight">The final privacy policy will be published before data collection features launch.</h2>
        <p className="mt-4 leading-7 text-muted-foreground">Running Shoe Match does not yet offer its quiz, affiliate click analytics, or account-based features. This page reserves a clear home for the policy that will govern those capabilities.</p>
        <div className="mt-10 space-y-4">
          {futureTopics.map(({ icon: Icon, title, text }) => <Card key={title}><CardContent className="flex gap-4 p-5 sm:p-6"><Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" /><div><h3 className="font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></div></CardContent></Card>)}
        </div>
      </Container>
    </main>
  );
}
