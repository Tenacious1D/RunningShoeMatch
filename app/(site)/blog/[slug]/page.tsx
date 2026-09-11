import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArticleLayout } from "@/components/content/article-layout";
import {
  getPublishedBlogPostBySlug,
  getPublishedBlogPosts,
  getRelatedBlogPosts,
} from "@/lib/content/blog";

type BlogArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getPublishedBlogPosts().map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: BlogArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPublishedBlogPostBySlug(slug);

  if (!post) {
    return { title: "Guide Not Found | Running Shoe Match" };
  }

  const title = `${post.title} | Running Shoe Match`;
  const canonical = `/blog/${post.slug}`;

  return {
    title,
    description: post.description,
    authors: [{ name: post.author }],
    category: post.categories[0],
    keywords: post.tags,
    alternates: { canonical },
    openGraph: {
      title,
      description: post.description,
      type: "article",
      url: canonical,
      publishedTime: `${post.publishedDate}T00:00:00Z`,
      modifiedTime: post.updatedDate ? `${post.updatedDate}T00:00:00Z` : undefined,
      authors: [post.author],
      tags: post.tags,
      images: post.image && post.imageAlt ? [{ url: post.image, alt: post.imageAlt }] : [],
    },
    twitter: {
      card: post.image ? "summary_large_image" : "summary",
      title,
      description: post.description,
      images: post.image ? [post.image] : [],
    },
  };
}

export default async function BlogArticlePage({ params }: BlogArticlePageProps) {
  const { slug } = await params;
  const post = getPublishedBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const { default: Article } = await import(`@/content/blog/${slug}.mdx`);
  const relatedPosts = getRelatedBlogPosts(post);

  return (
    <ArticleLayout post={post} relatedPosts={relatedPosts}>
      <Article />
    </ArticleLayout>
  );
}
