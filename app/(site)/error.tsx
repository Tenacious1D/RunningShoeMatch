"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";

type SiteErrorProps = { error: Error & { digest?: string }; reset: () => void };

export default function SiteError({ error, reset }: SiteErrorProps) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <main className="bg-surface py-20">
      <Container size="narrow">
        <div className="rounded-lg border border-border bg-card p-8 text-center shadow-card sm:p-12">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-destructive">Something went wrong</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">We could not load this page.</h1>
          <p className="mt-4 leading-7 text-muted-foreground">Try the page again. If the problem continues, return to the homepage.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3"><Button onClick={reset}><RefreshCw aria-hidden="true" />Try again</Button><Button asChild variant="outline"><Link href="/">Return home</Link></Button></div>
        </div>
      </Container>
    </main>
  );
}
