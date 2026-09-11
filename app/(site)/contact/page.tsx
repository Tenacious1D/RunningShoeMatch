import type { Metadata } from "next";
import { Mail, MessageSquareText } from "lucide-react";

import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/layout/page-hero";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Contact | Running Shoe Match",
  description: "Contact information for Running Shoe Match.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <main>
      <PageHero eyebrow="Get in touch" title="Contact Running Shoe Match" description="A direct way to ask questions, flag corrections, or share feedback will be available here." />
      <Container size="narrow" className="py-12 sm:py-16">
        <Card><CardContent className="p-6 sm:p-8"><Badge variant="neutral">Contact placeholder</Badge><div className="mt-6 flex gap-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"><Mail className="h-5 w-5" aria-hidden="true" /></span><div><h2 className="text-xl font-bold">Contact details are coming</h2><p className="mt-2 leading-7 text-muted-foreground">Contact details will be published here before launch. No email address or submission form is active yet.</p></div></div></CardContent></Card>
        <div className="mt-8 flex gap-4 rounded-lg border border-border bg-surface p-6"><MessageSquareText className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" /><p className="text-sm leading-6 text-muted-foreground">The future contact flow will make room for data corrections, partnership questions, and general feedback without collecting unnecessary information.</p></div>
      </Container>
    </main>
  );
}
