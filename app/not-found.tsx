import Link from "next/link";
import { ArrowLeft, Footprints } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center bg-surface py-16">
      <Container size="narrow">
        <div className="rounded-lg border border-border bg-card p-8 text-center shadow-card sm:p-12">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 text-primary"><Footprints className="h-7 w-7" aria-hidden="true" /></span>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-primary">404 · Route not found</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">This path does not lead anywhere yet.</h1>
          <p className="mx-auto mt-4 max-w-lg leading-7 text-muted-foreground">The page may have moved, or it may still be waiting to join the Running Shoe Match route map.</p>
          <Button asChild className="mt-8"><Link href="/"><ArrowLeft aria-hidden="true" />Return home</Link></Button>
        </div>
      </Container>
    </main>
  );
}
