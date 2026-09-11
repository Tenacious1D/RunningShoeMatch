import { Container } from "@/components/layout/container";

export default function ShoeLoading() {
  return (
    <main aria-label="Loading shoe profile" aria-busy="true">
      <Container size="wide" className="grid gap-10 py-14 lg:grid-cols-2 lg:items-center">
        <div className="aspect-[4/3] animate-pulse rounded-xl bg-muted" />
        <div>
          <div className="h-5 w-28 animate-pulse rounded bg-muted" />
          <div className="mt-5 h-14 max-w-lg animate-pulse rounded bg-muted" />
          <div className="mt-5 h-24 max-w-xl animate-pulse rounded bg-muted" />
        </div>
      </Container>
    </main>
  );
}

