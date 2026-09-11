import * as React from "react";

import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type PageHeroProps = {
  title: string;
  description: React.ReactNode;
  eyebrow?: string;
  children?: React.ReactNode;
  className?: string;
};

function PageHero({ title, description, eyebrow, children, className }: PageHeroProps) {
  return (
    <section className={cn("border-b border-border bg-card", className)}>
      <Container size="wide" className="py-14 sm:py-16 lg:py-20">
        <div className="max-w-3xl">
          {eyebrow ? <Badge variant="neutral">{eyebrow}</Badge> : null}
          <h1 className="mt-5 text-4xl font-bold tracking-[-0.035em] sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          <div className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
            {description}
          </div>
          {children ? <div className="mt-8 flex flex-wrap gap-3">{children}</div> : null}
        </div>
      </Container>
    </section>
  );
}

export { PageHero, type PageHeroProps };