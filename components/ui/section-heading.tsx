import * as React from "react";

import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  title: string;
  eyebrow?: string;
  description?: React.ReactNode;
  align?: "left" | "center";
  as?: "h1" | "h2" | "h3";
  className?: string;
};

function SectionHeading({
  title,
  eyebrow,
  description,
  align = "left",
  as: Heading = "h2",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow ? (
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-primary">
          {eyebrow}
        </p>
      ) : null}
      <Heading className="text-3xl font-bold tracking-tight sm:text-4xl">
        {title}
      </Heading>
      {description ? (
        <div className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
          {description}
        </div>
      ) : null}
    </div>
  );
}

export { SectionHeading, type SectionHeadingProps };