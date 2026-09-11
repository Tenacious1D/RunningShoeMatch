import type { Metadata } from "next";
import { ArrowLeft, CalendarDays, Info, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { AffiliateRetailerButton } from "@/components/shoes/affiliate-retailer-button";
import { ShoeImage } from "@/components/shoes/shoe-image";
import { ShoeScore } from "@/components/shoes/shoe-score";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  formatCurrency,
  formatDataLabel,
  formatDate,
  getDisplaySpecifications,
} from "@/lib/data/formatters";
import { getPublicShoeSlugs, getShoeBySlug } from "@/lib/data/shoes";

type ShoePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const slugs = await getPublicShoeSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: ShoePageProps): Promise<Metadata> {
  const { slug } = await params;
  const shoe = await getShoeBySlug(slug);

  if (!shoe) {
    return { title: "Shoe Not Found | Running Shoe Match" };
  }

  const title = `${shoe.brandName} ${shoe.modelName} | Running Shoe Match`;
  const description =
    shoe.shortDescription ??
    `View specifications, metrics, ranking context, and retailer availability for the ${shoe.brandName} ${shoe.modelName}.`;

  return {
    title,
    description,
    alternates: { canonical: `/shoes/${shoe.slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      images: shoe.imageUrl ? [{ url: shoe.imageUrl, alt: `${shoe.brandName} ${shoe.modelName}` }] : undefined,
    },
  };
}

export default async function ShoePage({ params }: ShoePageProps) {
  const { slug } = await params;
  const shoe = await getShoeBySlug(slug);

  if (!shoe) {
    notFound();
  }

  const shoeName = `${shoe.brandName} ${shoe.modelName}`;
  const specifications = getDisplaySpecifications(shoe.specs);

  return (
    <main>
      <section className="border-b border-border bg-card">
        <Container size="wide" className="py-10 sm:py-14 lg:py-16">
          <Button asChild variant="ghost" className="-ml-3 mb-7">
            <Link href="/shoes"><ArrowLeft aria-hidden="true" />Back to shoes</Link>
          </Button>
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <ShoeImage
              src={shoe.imageUrl}
              alt={shoe.imageUrl ? shoeName : ""}
              className="aspect-[4/3] rounded-xl border border-border p-8 shadow-card sm:p-12"
              imageClassName="max-h-[28rem]"
            />
            <div>
              <div className="flex flex-wrap gap-2">
                <Badge variant={shoe.status === "active" ? "success" : shoe.status === "discontinued" ? "destructive" : "neutral"}>
                  {formatDataLabel(shoe.status)}
                </Badge>
                <Badge variant="neutral">{formatDataLabel(shoe.gender)}</Badge>
              </div>
              <p className="mt-6 text-sm font-bold uppercase tracking-[0.16em] text-primary">{shoe.brandName}</p>
              <h1 className="mt-2 text-4xl font-bold tracking-[-0.04em] sm:text-5xl lg:text-6xl">{shoe.modelName}</h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
                {shoe.shortDescription ?? "A detailed summary has not been added for this shoe yet."}
              </p>
              <div className="mt-8 flex flex-wrap items-end gap-8 border-t border-border pt-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">MSRP</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums">
                    {shoe.msrp === null
                      ? "Unavailable"
                      : formatCurrency(shoe.msrp, shoe.currency, { maximumFractionDigits: 0 })}
                  </p>
                </div>
                {shoe.modelYear ? (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Model year</p>
                    <p className="mt-1 text-lg font-bold tabular-nums">{shoe.modelYear}</p>
                  </div>
                ) : null}
                {shoe.releaseDate ? (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Release date</p>
                    <p className="mt-1 text-sm font-semibold">{formatDate(shoe.releaseDate)}</p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {shoe.status === "discontinued" ? (
        <Container size="wide" className="pt-8">
          <div className="flex gap-3 rounded-lg border border-warning/30 bg-warning/10 p-5 text-sm leading-6">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden="true" />
            <p><strong>This model is discontinued.</strong> Retailer availability may be limited, and displayed links may change.</p>
          </div>
        </Container>
      ) : null}

      <Container size="wide" className="grid gap-12 py-12 sm:py-16 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="space-y-16">
          <section>
            <SectionHeading eyebrow="Overview" title="About this shoe" />
            <div className="mt-6 max-w-3xl space-y-5 text-base leading-8 text-muted-foreground">
              <p>{shoe.fullDescription ?? shoe.shortDescription ?? "A full description has not been added yet."}</p>
            </div>
          </section>

          <section>
            <SectionHeading eyebrow="Specifications" title="Manufacturer details" description="Available specifications are shown directly from the shoe record." />
            {specifications.length || shoe.modelVersion ? (
              <dl className="mt-7 grid overflow-hidden rounded-lg border border-border bg-card sm:grid-cols-2">
                {shoe.modelVersion ? (
                  <div className="border-b border-border p-5 sm:border-r">
                    <dt className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Model version</dt>
                    <dd className="mt-2 font-semibold">{shoe.modelVersion}</dd>
                  </div>
                ) : null}
                {specifications.map((spec, index) => (
                  <div key={spec.key} className={`border-b border-border p-5 ${index % 2 === 0 ? "sm:border-r" : ""}`}>
                    <dt className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">{spec.label}</dt>
                    <dd className="mt-2 font-semibold tabular-nums">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-6 rounded-lg border border-dashed border-border bg-surface p-6 text-sm text-muted-foreground">Specifications are not available for this shoe yet.</p>
            )}
          </section>

          <section>
            <SectionHeading eyebrow="Metrics" title="Available shoe metrics" description="The latest public observation for each metric is shown. These measurements are separate from future quiz matching logic." />
            {shoe.metrics.length ? (
              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                {shoe.metrics.map((metric) => (
                  <Card key={metric.key}>
                    <CardContent className="p-5 sm:p-6">
                      {metric.normalizedValue === null ? (
                        <div className="flex items-end justify-between gap-4">
                          <h3 className="font-bold">{formatDataLabel(metric.key)}</h3>
                          <p className="text-xl font-bold tabular-nums">{metric.value}{metric.unit ? ` ${metric.unit}` : ""}</p>
                        </div>
                      ) : (
                        <ShoeScore score={metric.normalizedValue} label={formatDataLabel(metric.key)} compact />
                      )}
                      <p className="mt-4 text-xs leading-5 text-muted-foreground">Effective {formatDate(metric.effectiveDate)} · {metric.version}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="mt-6 rounded-lg border border-dashed border-border bg-surface p-6 text-sm text-muted-foreground">No public metrics are available for this shoe yet.</p>
            )}
          </section>

          <section>
            <SectionHeading eyebrow="Rankings" title="Current ranking placements" description="For each relevant category, this shows the newest published snapshot containing this shoe." />
            {shoe.rankings.length ? (
              <div className="mt-7 space-y-4">
                {shoe.rankings.map((ranking) => (
                  <Card key={ranking.categorySlug}>
                    <CardContent className="grid gap-5 p-5 sm:grid-cols-[4.5rem_1fr_auto] sm:items-center sm:p-6">
                      <div className="flex h-14 w-14 items-center justify-center rounded-md bg-primary/10 text-xl font-bold tabular-nums text-primary">#{ranking.rank}</div>
                      <div>
                        <h3 className="font-bold">{ranking.categoryName}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{ranking.runName} · {formatDate(ranking.effectiveDate)}</p>
                      </div>
                      <div className="sm:text-right">
                        <p className="text-xl font-bold tabular-nums">{Math.round(ranking.score)}<span className="text-xs text-muted-foreground">/100</span></p>
                        <p className="mt-1 text-xs text-muted-foreground">Method {ranking.methodologyVersion}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="mt-6 rounded-lg border border-dashed border-border bg-surface p-6 text-sm text-muted-foreground">This shoe does not appear in a published ranking snapshot yet.</p>
            )}
          </section>
        </div>

        <aside className="rounded-xl border border-border bg-card p-5 shadow-card sm:p-6 lg:sticky lg:top-24">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="text-lg font-bold tracking-tight">Where to buy</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">Retailer links are loaded from the database and may change as availability is verified.</p>
          {shoe.retailerOffers.length ? (
            <div className="mt-6 grid gap-3">
              {shoe.retailerOffers.map((offer) => (
                <AffiliateRetailerButton key={offer.id} offer={offer} className="w-full justify-between" />
              ))}
            </div>
          ) : (
            <p className="mt-6 rounded-md border border-dashed border-border bg-surface p-4 text-sm text-muted-foreground">No retailer links are currently available.</p>
          )}
          <div className="mt-6 border-t border-border pt-5 text-xs leading-5 text-muted-foreground">
            <p>Running Shoe Match may earn a commission when you purchase through links on this site.</p>
            <p className="mt-3 flex items-center gap-2"><CalendarDays className="h-4 w-4" aria-hidden="true" />Prices and availability can change.</p>
          </div>
        </aside>
      </Container>
    </main>
  );
}

