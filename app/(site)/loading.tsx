import { Container } from "@/components/layout/container";

export default function Loading() {
  return (
    <main aria-label="Loading page" aria-busy="true">
      <div className="border-b border-border bg-card"><Container size="wide" className="py-16"><div className="h-5 w-28 animate-pulse rounded bg-muted" /><div className="mt-5 h-12 max-w-xl animate-pulse rounded bg-muted" /><div className="mt-5 h-6 max-w-2xl animate-pulse rounded bg-muted" /></Container></div>
      <Container className="grid gap-5 py-12 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => <div key={index} className="h-64 animate-pulse rounded-lg border border-border bg-muted/70" />)}
      </Container>
    </main>
  );
}
