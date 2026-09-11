import type { Metadata } from "next";

import { ArticleCard } from "@/components/content/article-card";
import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/layout/page-hero";
import { SectionHeading } from "@/components/ui/section-heading";
import { placeholderGuides } from "@/lib/placeholder-data";

export const metadata: Metadata = {
  title: "Running Shoe Guides | Running Shoe Match",
  description: "Practical running shoe guides and explanations from Running Shoe Match.",
  alternates: { canonical: "/blog" },
};

export default function BlogPage() {
  return (
    <main>
      <PageHero eyebrow="Guides and education" title="Learn Before You Choose" description="Clear explanations of running shoe features, fit considerations, and the data behind better comparisons." />
      <Container className="py-12 sm:py-16">
        <SectionHeading title="Latest guides" description="The blog will use file-based MDX. These cards preview the topics and layout; no articles have been published yet." />
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {placeholderGuides.map((guide) => <ArticleCard key={guide.title} {...guide} />)}
        </div>
      </Container>
    </main>
  );
}
