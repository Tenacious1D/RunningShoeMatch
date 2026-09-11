import Link from "next/link";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";

export default function ShoeNotFound() {
  return (
    <main className="bg-surface py-20">
      <Container size="narrow">
        <div className="rounded-xl border border-border bg-card p-8 text-center shadow-card sm:p-12">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Shoe not found</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">This shoe profile is unavailable.</h1>
          <p className="mt-4 leading-7 text-muted-foreground">It may be unpublished, or the address may have changed.</p>
          <Button asChild className="mt-8"><Link href="/shoes">Browse active shoes</Link></Button>
        </div>
      </Container>
    </main>
  );
}

