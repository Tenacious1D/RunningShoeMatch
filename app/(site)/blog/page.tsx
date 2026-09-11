import type { Metadata } from "next";

import { ArticleCard } from "@/components/content/article-card";
import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/layout/page-hero";
import { SectionHeading } from "@/components/ui/section-heading";
import { getPublishedBlogPosts } from "@/lib/content/blog";

export const metadata: Metadata = {
  title: "Running Shoe Guides | Running Shoe Match",
  description: "Practical running shoe guides and explanations from Running Shoe Match.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Running Shoe Guides | Running Shoe Match",
    description: "Practical running shoe guides and explanations from Running Shoe Match.",
    type: "website",
  },
};

export default function BlogPage() {
  const posts = getPublishedBlogPosts();

  return (
    <main>
      <PageHero eyebrow="Guides and education" title="Learn Before You Choose" description="Clear explanations of running shoe features, fit considerations, and the data behind better comparisons." />
      <Container className="py-12 sm:py-16">
        <SectionHeading title="Latest guides" description="Repository-managed articles, ordered newest first and connected to the current shoe and ranking database." />
        {posts.length ? (
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {posts.map((post) => (
              <ArticleCard
                key={post.slug}
                category={post.categories[0] ?? "Guide"}
                title={post.title}
                description={post.description}
                href={`/blog/${post.slug}`}
                publishedDate={post.publishedDate}
                readingTimeMinutes={post.readingTimeMinutes}
              />
            ))}
          </div>
        ) : (
          <p className="mt-8 rounded-lg border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">No guides are published yet.</p>
        )}
      </Container>
    </main>
  );
}
