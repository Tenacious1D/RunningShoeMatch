import { Info, TriangleAlert } from "lucide-react";
import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "@/lib/utils";

function MdxLink({ href = "", children, ...props }: ComponentPropsWithoutRef<"a">) {
  if (href.startsWith("/") || href.startsWith("#")) {
    return (
      <Link href={href} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </a>
  );
}

function MdxImage({ className, alt = "", ...props }: ComponentPropsWithoutRef<"img">) {
  // Article authors may use local Markdown images without knowing intrinsic dimensions.
  // eslint-disable-next-line @next/next/no-img-element
  return <img {...props} alt={alt} loading="lazy" decoding="async" className={cn("h-auto max-w-full rounded-lg border border-border", className)} />;
}

function MdxTable({ children }: { children?: ReactNode }) {
  return (
    <div className="not-prose my-8 overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[36rem] border-collapse text-left text-sm">{children}</table>
    </div>
  );
}

type CalloutProps = {
  children: ReactNode;
  title?: string;
  tone?: "info" | "warning";
};

function Callout({ children, title = "Note", tone = "info" }: CalloutProps) {
  const Icon = tone === "warning" ? TriangleAlert : Info;

  return (
    <aside className={cn("not-prose my-8 rounded-lg border p-5", tone === "warning" ? "border-warning/35 bg-warning/10" : "border-primary/25 bg-primary/5")}>
      <div className="flex items-start gap-3">
        <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", tone === "warning" ? "text-warning" : "text-primary")} aria-hidden="true" />
        <div>
          <p className="font-bold text-foreground">{title}</p>
          <div className="mt-2 text-sm leading-6 text-muted-foreground">{children}</div>
        </div>
      </div>
    </aside>
  );
}

export { Callout, MdxImage, MdxLink, MdxTable, type CalloutProps };
