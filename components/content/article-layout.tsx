import { ArrowLeft, CalendarDays, Clock3 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { ArticleCard } from "@/components/content/article-card";
import { TableOfContents } from "@/components/content/table-of-contents";
import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import type { BlogPost } from "@/lib/content/blog";
import { formatDate } from "@/lib/data/formatters";
import { cn } from "@/lib/utils";

type ArticleLayoutProps = {
  post: BlogPost;
  relatedPosts: BlogPost[];
  children: ReactNode;
};

function ArticleLayout({ post, relatedPosts, children }: ArticleLayoutProps) {
  const category = post.categories[0] ?? "Guide";

  return (
    <main>
      <header className="border-b border-border bg-card">
        <Container size="wide" className="py-12 sm:py-16 lg:py-20">
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            All guides
          </Link>
          <div className="mt-8 max-w-4xl">
            <div className="flex flex-wrap gap-2">
              <Badge variant="neutral">{category}</Badge>
              {post.title.includes("DEMO") ? <Badge variant="outline">Sample content</Badge> : null}
            </div>
            <h1 className="mt-6 text-4xl font-bold tracking-[-0.035em] sm:text-5xl lg:text-6xl lg:leading-[1.08]">
              {post.title}
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground sm:text-xl">
              {post.description}
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">By {post.author}</span>
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
                Published {formatDate(post.publishedDate)}
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock3 className="h-4 w-4" aria-hidden="true" />
                {post.readingTimeMinutes} min read
              </span>
              {post.updatedDate ? <span>Updated {formatDate(post.updatedDate)}</span> : null}
            </div>
          </div>
          {post.image && post.imageAlt ? (
            <div className="relative mt-10 aspect-[16/7] overflow-hidden rounded-lg border border-border bg-surface">
              <Image src={post.image} alt={post.imageAlt} fill priority sizes="(min-width: 1280px) 1216px, 100vw" className="object-cover" />
            </div>
          ) : null}
        </Container>
      </header>

      <Container size="wide" className="py-12 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,46rem)_15rem] lg:items-start lg:justify-center">
          <article className="article-prose min-w-0">{children}</article>
          <aside className="order-first lg:order-last">
            <TableOfContents headings={post.headings} />
          </aside>
        </div>
      </Container>

      <section className="border-t border-border bg-card py-12 sm:py-16">
        <Container size="wide">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Keep exploring</p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                {relatedPosts.length ? "Related guides" : "Compare current shoe data"}
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/shoes" className={buttonVariants({ variant: "outline" })}>Browse shoes</Link>
              <Link href="/rankings" className={buttonVariants({ variant: "outline" })}>Explore rankings</Link>
              <Link href="/methodology" className={buttonVariants()}>Our methodology</Link>
            </div>
          </div>
          {relatedPosts.length ? (
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {relatedPosts.map((relatedPost) => (
                <ArticleCard
                  key={relatedPost.slug}
                  category={relatedPost.categories[0] ?? "Guide"}
                  title={relatedPost.title}
                  description={relatedPost.description}
                  href={`/blog/${relatedPost.slug}`}
                  publishedDate={relatedPost.publishedDate}
                  readingTimeMinutes={relatedPost.readingTimeMinutes}
                />
              ))}
            </div>
          ) : null}
          <p className={cn("mt-8 text-xs leading-5 text-muted-foreground", relatedPosts.length && "border-t border-border pt-6")}>
            Running Shoe Match may earn a commission when you purchase through links on this site.
          </p>
        </Container>
      </section>
    </main>
  );
}

export { ArticleLayout, type ArticleLayoutProps };
