import type { MDXComponents } from "mdx/types";

import { Callout, MdxImage, MdxLink, MdxTable } from "@/components/content/mdx-elements";
import { RankingPreview } from "@/components/content/ranking-preview";
import { ShoeCardBySlug } from "@/components/content/shoe-card-by-slug";

const baseComponents = {
  a: MdxLink,
  img: MdxImage,
  table: MdxTable,
  h2: ({ children, ...props }) => <h2 {...props}>{children}</h2>,
  h3: ({ children, ...props }) => <h3 {...props}>{children}</h3>,
  Callout,
  ShoeCardBySlug,
  RankingPreview,
} satisfies MDXComponents;

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return { ...baseComponents, ...components };
}
