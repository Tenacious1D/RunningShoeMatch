import type { Metadata } from "next";
import { ClipboardList, Database, Route } from "lucide-react";

import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/layout/page-hero";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Running Shoe Quiz | Running Shoe Match",
  description: "A guided running shoe matching experience is coming to Running Shoe Match.",
  alternates: { canonical: "/quiz" },
};

const plannedSteps = [
  { icon: ClipboardList, title: "Share how you run", text: "Answer focused questions about your training, preferences, and intended use." },
  { icon: Route, title: "Build your runner profile", text: "Your answers will become a structured profile for the matching engine." },
  { icon: Database, title: "Compare suitable shoes", text: "The engine will compare that profile with structured shoe data." },
];

export default function QuizPage() {
  return (
    <main>
      <PageHero eyebrow="Guided matching" title="Find Your Running Shoe Match" description="A focused, data-informed path to a manageable shortlist—not an endless wall of products." />
      <Container className="py-12 sm:py-16">
        <Card className="overflow-hidden border-primary/20">
          <CardContent className="p-6 sm:p-10 lg:p-12">
            <Badge>In development</Badge>
            <h2 className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl">The guided matching quiz will live here.</h2>
            <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">We are building the structured shoe data and matching rules before opening the quiz. No questions or recommendations are active yet.</p>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {plannedSteps.map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-lg border border-border bg-surface p-5">
                  <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  <h3 className="mt-4 font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </Container>
    </main>
  );
}
