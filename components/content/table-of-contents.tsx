import Link from "next/link";

import type { BlogHeading } from "@/lib/content/blog";
import { cn } from "@/lib/utils";

type TableOfContentsProps = {
  headings: BlogHeading[];
};

function TableOfContents({ headings }: TableOfContentsProps) {
  if (headings.length < 2) {
    return null;
  }

  return (
    <nav aria-labelledby="article-contents" className="rounded-lg border border-border bg-card p-5 shadow-card lg:sticky lg:top-24">
      <h2 id="article-contents" className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
        In this guide
      </h2>
      <ol className="mt-4 space-y-3 border-l border-border pl-4 text-sm">
        {headings.map((heading) => (
          <li key={heading.id} className={cn(heading.level === 3 && "pl-3")}>
            <Link href={`#${heading.id}`} className="leading-5 text-muted-foreground transition-colors hover:text-primary">
              {heading.text}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export { TableOfContents, type TableOfContentsProps };
