import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/layout/page-hero";
import { QuizArchitectureFlow } from "@/components/quiz/quiz-architecture-flow";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Running Shoe Quiz | Running Shoe Match",
  description: "A guided running shoe matching experience is coming to Running Shoe Match.",
  alternates: { canonical: "/quiz" },
};

export default function QuizPage() {
  return (
    <main>
      <PageHero eyebrow="Guided matching" title="Find Your Running Shoe Match" description="A focused, data-informed path to a manageable shortlist—not an endless wall of products." />
      <Container className="py-12 sm:py-16">
        <Card className="overflow-hidden border-primary/20">
          <CardContent className="p-6 sm:p-10 lg:p-12">
            <Badge>In development</Badge>
            <h2 className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl">The guided matching quiz will live here.</h2>
            <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">We are preparing the boundaries around the quiz before deciding its questions or matching rules. No questions, weights, scores, or recommendations are active yet.</p>
            <QuizArchitectureFlow />
          </CardContent>
        </Card>
      </Container>
    </main>
  );
}
