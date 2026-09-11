import type { Metadata } from "next";
import { ArrowRight, Check, Info } from "lucide-react";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { ShoeCard } from "@/components/shoes/shoe-card";
import { ShoeScore } from "@/components/shoes/shoe-score";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";

export const metadata: Metadata = {
  title: "Design System | Running Shoe Match",
  robots: { index: false, follow: false },
};

const colorTokens = [
  { name: "Primary", className: "bg-primary", value: "Performance blue" },
  { name: "Accent", className: "bg-accent", value: "Signal green" },
  { name: "Foreground", className: "bg-foreground", value: "Deep navy" },
  { name: "Surface", className: "bg-surface", value: "Cool neutral" },
  { name: "Card", className: "bg-card", value: "Content surface" },
  { name: "Warning", className: "bg-warning", value: "Attention" },
] as const;

export default function DesignSystemPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return (
    <main className="pb-24">
      <section className="border-b border-border bg-card py-14 sm:py-16">
        <Container size="wide">
          <Badge variant="neutral">Development only</Badge>
          <h1 className="mt-5 text-4xl font-bold tracking-[-0.035em] sm:text-5xl">Design system</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
            Reusable visual foundations for a credible, lightweight, and data-driven running experience.
          </p>
        </Container>
      </section>

      <Container size="wide" className="space-y-20 pt-16 sm:pt-20">
        <section>
          <SectionHeading eyebrow="Foundations" title="Color tokens" description="Global semantic colors are defined once and consumed throughout the interface." />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {colorTokens.map((token) => (
              <div key={token.name} className="overflow-hidden rounded-lg border border-border bg-card shadow-card">
                <div className={`h-20 ${token.className}`} />
                <div className="p-4">
                  <p className="font-semibold">{token.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{token.value}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <SectionHeading eyebrow="Typography" title="Clear hierarchy" description="Compact, confident headings pair with readable body copy and restrained data labels." />
          <Card className="mt-8">
            <CardContent className="space-y-8 p-6 sm:p-8">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">Display heading</p>
                <p className="text-4xl font-bold tracking-[-0.035em] sm:text-5xl">Find your next daily trainer.</p>
              </div>
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">Section heading</p>
                <p className="text-3xl font-bold tracking-tight">Compare the details that matter.</p>
              </div>
              <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
                Body copy uses generous line height and neutral contrast so specifications, methodology, and guidance remain easy to scan on any screen.
              </p>
              <p className="text-sm font-semibold tabular-nums">Data label · 8.7 oz · 34 mm · 8 mm drop</p>
            </CardContent>
          </Card>
        </section>

        <section>
          <SectionHeading eyebrow="Actions" title="Buttons" />
          <div className="mt-8 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-6 shadow-card">
            <Button>Primary action</Button>
            <Button variant="accent">Positive action</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Text link</Button>
            <Button disabled>Disabled</Button>
            <Button size="lg">
              Find My Shoe
              <ArrowRight aria-hidden="true" />
            </Button>
          </div>
        </section>

        <section>
          <SectionHeading eyebrow="Labels" title="Badges" />
          <div className="mt-8 flex flex-wrap gap-3 rounded-lg border border-border bg-card p-6 shadow-card">
            <Badge>Daily trainer</Badge>
            <Badge variant="success">Strong match</Badge>
            <Badge variant="secondary">Neutral</Badge>
            <Badge variant="neutral">Road</Badge>
            <Badge variant="outline">New model</Badge>
            <Badge variant="destructive">Limited data</Badge>
          </div>
        </section>

        <section>
          <SectionHeading eyebrow="Surfaces" title="Cards" description="Cards group related information without making the interface feel like a storefront." />
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Standard card</CardTitle>
                <CardDescription>A flexible information surface with a quiet border and restrained shadow.</CardDescription>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-muted-foreground">Use for comparisons, methodology notes, and grouped content.</CardContent>
            </Card>
            <Card className="border-primary/25">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Info className="h-4 w-4 text-primary" aria-hidden="true" /> Data note</CardTitle>
                <CardDescription>Use emphasis intentionally for high-value context.</CardDescription>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-muted-foreground">A colored border signals importance without adding decorative noise.</CardContent>
            </Card>
            <Card className="bg-foreground text-background">
              <CardHeader>
                <CardTitle>Inverted card</CardTitle>
                <CardDescription className="text-background/65">A high-contrast option for compact calls to action.</CardDescription>
              </CardHeader>
              <CardFooter><Button variant="accent">Continue <ArrowRight aria-hidden="true" /></Button></CardFooter>
            </Card>
          </div>
        </section>

        <section>
          <SectionHeading eyebrow="Scoring" title="Shoe scores" description="Scores use tabular numbers, accessible progress semantics, and limited status color." />
          <Card className="mt-8 max-w-2xl">
            <CardContent className="space-y-7 p-6 sm:p-8">
              <ShoeScore score={94} label="Excellent match" />
              <ShoeScore score={78} label="Good match" />
              <ShoeScore score={62} label="Partial match" />
            </CardContent>
          </Card>
        </section>

        <section>
          <SectionHeading eyebrow="Shoe component" title="Shoe card placeholders" description="These examples demonstrate reusable data presentation only; no ranking or affiliate logic is connected." />
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <ShoeCard
              brand="Example Running"
              name="Daily Trainer 01"
              category="Daily trainer"
              score={91}
              tags={["Neutral", "Road"]}
              specs={[{ label: "Weight", value: "8.7 oz" }, { label: "Drop", value: "8 mm" }, { label: "Stack", value: "34 mm" }]}
            />
            <ShoeCard
              brand="Sample Athletics"
              name="Cushion Max 02"
              category="Max cushion"
              score={84}
              tags={["Plush", "Road"]}
              specs={[{ label: "Weight", value: "10.2 oz" }, { label: "Drop", value: "6 mm" }, { label: "Stack", value: "40 mm" }]}
            />
            <ShoeCard
              brand="Demo Footwear"
              name="Stable Run 03"
              category="Stability"
              score={76}
              tags={["Support", "Daily"]}
              specs={[{ label: "Weight", value: "9.9 oz" }, { label: "Drop", value: "10 mm" }, { label: "Stack", value: "36 mm" }]}
            />
          </div>
        </section>

        <section>
          <SectionHeading eyebrow="Rhythm" title="Spacing examples" description="An eight-point rhythm keeps layouts predictable across phones and larger screens." />
          <Card className="mt-8">
            <CardContent className="space-y-5 p-6 sm:p-8">
              {[8, 16, 24, 32, 48, 64].map((space) => (
                <div key={space} className="grid grid-cols-[3rem_1fr] items-center gap-4">
                  <span className="text-sm font-semibold tabular-nums text-muted-foreground">{space}px</span>
                  <div className="flex items-center">
                    <div className="h-3 rounded-full bg-primary" style={{ width: `${space * 2}px` }} />
                    <Check className="ml-3 h-4 w-4 text-success" aria-hidden="true" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </Container>
    </main>
  );
}