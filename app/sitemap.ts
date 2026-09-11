import type { MetadataRoute } from "next";

import { getPublishedBlogPosts } from "@/lib/content/blog";
import { getActiveRankingCategories } from "@/lib/data/rankings";
import { getPublicShoeSlugs } from "@/lib/data/shoes";
import { getSiteUrl } from "@/lib/site";

const staticRoutes: Array<{
  path: string;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
  priority: number;
}> = [
  { path: "", changeFrequency: "weekly", priority: 1 },
  { path: "/quiz", changeFrequency: "monthly", priority: 0.9 },
  { path: "/shoes", changeFrequency: "weekly", priority: 0.9 },
  { path: "/rankings", changeFrequency: "weekly", priority: 0.9 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.8 },
  { path: "/methodology", changeFrequency: "monthly", priority: 0.7 },
  { path: "/about", changeFrequency: "monthly", priority: 0.6 },
  { path: "/affiliate-disclosure", changeFrequency: "yearly", priority: 0.4 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.4 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.4 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const [shoeSlugs, rankingCategories] = await Promise.all([
    getPublicShoeSlugs(),
    getActiveRankingCategories(),
  ]);
  const blogPosts = getPublishedBlogPosts();

  return [
    ...staticRoutes.map(({ path, ...entry }) => ({
      url: `${siteUrl}${path}`,
      ...entry,
    })),
    ...shoeSlugs.map((slug) => ({
      url: `${siteUrl}/shoes/${slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...rankingCategories.map((category) => ({
      url: `${siteUrl}/rankings/${category.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...blogPosts.map((post) => ({
      url: `${siteUrl}/blog/${post.slug}`,
      lastModified: post.updatedDate ?? post.publishedDate,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
