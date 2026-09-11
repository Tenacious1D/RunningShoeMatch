import type { Metadata } from "next";
import { CheckCircle2, CircleX, Database, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/layout/page-hero";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { testSupabaseConnection } from "@/lib/supabase/connection";

export const metadata: Metadata = {
  title: "Database Diagnostics | Running Shoe Match",
  robots: { index: false, follow: false },
};

function StatusRow({
  label,
  successful,
}: {
  label: string;
  successful: boolean;
}) {
  const Icon = successful ? CheckCircle2 : CircleX;

  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-5 last:border-0">
      <span className="font-semibold">{label}</span>
      <span
        className={
          successful
            ? "inline-flex items-center gap-2 font-bold text-success"
            : "inline-flex items-center gap-2 font-bold text-destructive"
        }
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
        {successful ? "Yes" : "No"}
      </span>
    </div>
  );
}

function DiagnosticsLoading() {
  return (
    <Container size="narrow" className="py-12 sm:py-16">
      <Card aria-busy="true">
        <CardContent className="p-6 sm:p-8">
          <p className="font-semibold">Checking Supabase connectivity…</p>
          <div className="mt-6 h-16 animate-pulse rounded-md bg-muted" />
        </CardContent>
      </Card>
    </Container>
  );
}

async function DatabaseStatus() {
  const status = await testSupabaseConnection();

  return (
    <Container size="narrow" className="py-12 sm:py-16">
      <Card>
        <CardContent className="p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <Badge variant="neutral">Supabase</Badge>
            <Database className="h-6 w-6 text-primary" aria-hidden="true" />
          </div>
          <div className="mt-5">
            <StatusRow
              label="Supabase configuration present"
              successful={status.configurationPresent}
            />
            <StatusRow
              label="Database connection successful"
              successful={status.databaseConnectionSuccessful}
            />
          </div>
        </CardContent>
      </Card>

      {!status.configurationPresent ? (
        <Card className="mt-6 border-primary/20">
          <CardContent className="p-6 sm:p-8">
            <h2 className="text-xl font-bold tracking-tight">
              Add your project credentials
            </h2>
            <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-6 text-muted-foreground">
              <li>
                In Supabase, open the project&apos;s Connect dialog or Settings
                → API Keys.
              </li>
              <li>
                Create{" "}
                <code className="rounded bg-surface px-1.5 py-1 font-mono text-xs text-foreground">
                  .env.local
                </code>{" "}
                in the{" "}
                <code className="rounded bg-surface px-1.5 py-1 font-mono text-xs text-foreground">
                  running-shoe-match
                </code>{" "}
                project folder.
              </li>
              <li>
                Paste the project URL as{" "}
                <code className="rounded bg-surface px-1.5 py-1 font-mono text-xs text-foreground">
                  NEXT_PUBLIC_SUPABASE_URL
                </code>
                .
              </li>
              <li>
                Paste the publishable key as{" "}
                <code className="rounded bg-surface px-1.5 py-1 font-mono text-xs text-foreground">
                  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
                </code>
                .
              </li>
              <li>Restart the development server, then reload this page.</li>
            </ol>
          </CardContent>
        </Card>
      ) : null}

      <div className="mt-6 flex gap-4 rounded-lg border border-border bg-surface p-5">
        <ShieldCheck
          className="mt-0.5 h-5 w-5 shrink-0 text-accent"
          aria-hidden="true"
        />
        <p className="text-sm leading-6 text-muted-foreground">
          The optional server-only secret key is not used by this check. It
          remains reserved for future authenticated admin and trusted import
          operations.
        </p>
      </div>
    </Container>
  );
}

export default function DatabaseDiagnosticsPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return (
    <main>
      <PageHero
        eyebrow="Development only"
        title="Database Diagnostics"
        description="A server-side health check for the configured Supabase project. Credentials are never rendered or returned to the browser."
      />
      <Suspense fallback={<DiagnosticsLoading />}>
        <DatabaseStatus />
      </Suspense>
    </main>
  );
}