import "server-only";

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import GithubSlugger from "github-slugger";
import matter from "gray-matter";

export type BlogHeading = {
  id: string;
  level: 2 | 3;
  text: string;
};

export type BlogPostMetadata = {
  title: string;
  slug: string;
  description: string;
  publishedDate: string;
  updatedDate?: string;
  author: string;
  image?: string;
  imageAlt?: string;
  tags: string[];
  categories: string[];
  draft: boolean;
};

export type BlogPost = BlogPostMetadata & {
  headings: BlogHeading[];
  readingTimeMinutes: number;
};

const blogDirectory = path.join(process.cwd(), "content", "blog");
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(
  data: Record<string, unknown>,
  key: string,
  fileName: string,
): string {
  const value = data[key];

  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Invalid blog frontmatter in ${fileName}: ${key} must be a non-empty string.`);
  }

  return value.trim();
}

function optionalString(
  data: Record<string, unknown>,
  key: string,
  fileName: string,
): string | undefined {
  const value = data[key];

  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new Error(`Invalid blog frontmatter in ${fileName}: ${key} must be a string.`);
  }

  return value.trim();
}

function requireStringArray(
  data: Record<string, unknown>,
  key: string,
  fileName: string,
): string[] {
  const value = data[key];

  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || !item.trim())) {
    throw new Error(`Invalid blog frontmatter in ${fileName}: ${key} must be an array of non-empty strings.`);
  }

  return value.map((item) => (item as string).trim());
}

function validateDate(value: string, key: string, fileName: string) {
  if (!isoDatePattern.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) {
    throw new Error(`Invalid blog frontmatter in ${fileName}: ${key} must use YYYY-MM-DD.`);
  }
}

function cleanHeadingText(value: string) {
  return value
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
    .replace(/[`*_~]/g, "")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function extractHeadings(content: string): BlogHeading[] {
  const slugger = new GithubSlugger();
  const withoutCodeFences = content.replace(/```[\s\S]*?```/g, "");
  const headings: BlogHeading[] = [];

  for (const match of withoutCodeFences.matchAll(/^(##|###)\s+(.+?)\s*#*$/gm)) {
    const text = cleanHeadingText(match[2]);

    if (text) {
      headings.push({
        id: slugger.slug(text),
        level: match[1].length as 2 | 3,
        text,
      });
    }
  }

  return headings;
}

function parseBlogPost(fileName: string): BlogPost {
  const filePath = path.join(blogDirectory, fileName);
  const source = readFileSync(filePath, "utf8");
  const { data: rawData, content } = matter(source);

  if (!isRecord(rawData)) {
    throw new Error(`Invalid blog frontmatter in ${fileName}: expected a YAML object.`);
  }

  const slug = requireString(rawData, "slug", fileName);
  const expectedSlug = fileName.replace(/\.mdx$/, "");

  if (!slugPattern.test(slug)) {
    throw new Error(`Invalid blog frontmatter in ${fileName}: slug must be lowercase and hyphenated.`);
  }

  if (slug !== expectedSlug) {
    throw new Error(`Invalid blog frontmatter in ${fileName}: slug must match the file name.`);
  }

  const publishedDate = requireString(rawData, "publishedDate", fileName);
  const updatedDate = optionalString(rawData, "updatedDate", fileName);
  validateDate(publishedDate, "publishedDate", fileName);

  if (updatedDate) {
    validateDate(updatedDate, "updatedDate", fileName);
  }

  const draft = rawData.draft;

  if (typeof draft !== "boolean") {
    throw new Error(`Invalid blog frontmatter in ${fileName}: draft must be true or false.`);
  }

  const image = optionalString(rawData, "image", fileName);
  const imageAlt = optionalString(rawData, "imageAlt", fileName);

  if (image && !image.startsWith("/")) {
    throw new Error(`Invalid blog frontmatter in ${fileName}: image must be a root-relative public path.`);
  }

  if (image && !imageAlt) {
    throw new Error(`Invalid blog frontmatter in ${fileName}: imageAlt is required when image is set.`);
  }

  if (/^#\s+/m.test(content)) {
    throw new Error(`Invalid blog content in ${fileName}: the article layout supplies the H1, so begin sections with H2.`);
  }

  const words = content.trim().split(/\s+/).filter(Boolean).length;

  return {
    title: requireString(rawData, "title", fileName),
    slug,
    description: requireString(rawData, "description", fileName),
    publishedDate,
    updatedDate,
    author: requireString(rawData, "author", fileName),
    image,
    imageAlt,
    tags: requireStringArray(rawData, "tags", fileName),
    categories: requireStringArray(rawData, "categories", fileName),
    draft,
    headings: extractHeadings(content),
    readingTimeMinutes: Math.max(1, Math.ceil(words / 225)),
  };
}

function readAllBlogPosts(): BlogPost[] {
  const fileNames = readdirSync(blogDirectory)
    .filter((fileName) => fileName.endsWith(".mdx"))
    .sort();
  const posts = fileNames.map(parseBlogPost);
  const slugs = new Set<string>();

  for (const post of posts) {
    if (slugs.has(post.slug)) {
      throw new Error(`Duplicate blog slug detected: ${post.slug}`);
    }

    slugs.add(post.slug);
  }

  return posts.sort((left, right) => right.publishedDate.localeCompare(left.publishedDate));
}

export function getPublishedBlogPosts(): BlogPost[] {
  return readAllBlogPosts().filter((post) => !post.draft);
}

export function getPublishedBlogPostBySlug(slug: string): BlogPost | null {
  return getPublishedBlogPosts().find((post) => post.slug === slug) ?? null;
}

export function getRelatedBlogPosts(post: BlogPost, limit = 3): BlogPost[] {
  const tags = new Set(post.tags.map((tag) => tag.toLowerCase()));
  const categories = new Set(post.categories.map((category) => category.toLowerCase()));

  return getPublishedBlogPosts()
    .filter((candidate) => candidate.slug !== post.slug)
    .map((candidate) => ({
      candidate,
      relevance:
        candidate.tags.filter((tag) => tags.has(tag.toLowerCase())).length +
        candidate.categories.filter((category) => categories.has(category.toLowerCase())).length * 2,
    }))
    .filter(({ relevance }) => relevance > 0)
    .sort((left, right) => right.relevance - left.relevance)
    .slice(0, limit)
    .map(({ candidate }) => candidate);
}
