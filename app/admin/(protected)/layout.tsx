import Link from "next/link";

import { AdminLogoutButton } from "@/components/admin/admin-logout-button";
import { Container } from "@/components/layout/container";
import { requireAdmin } from "@/lib/admin/auth";

export const instant = false;

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/shoes", label: "Shoes" },
  { href: "/admin/rankings", label: "Rankings" },
  { href: "/admin/imports", label: "Imports" },
] as const;

export default async function ProtectedAdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { user } = await requireAdmin();

  return (
    <div className="min-h-svh bg-surface">
      <header className="border-b border-border bg-card">
        <Container size="wide" className="flex min-h-16 flex-wrap items-center justify-between gap-4 py-3">
          <div>
            <Link href="/admin" className="font-bold tracking-tight">Running Shoe Match Admin</Link>
            <p className="text-xs text-muted-foreground">{user.email ?? "Authorized administrator"}</p>
          </div>
          <AdminLogoutButton />
        </Container>
        <Container size="wide">
          <nav aria-label="Admin navigation" className="flex gap-1 overflow-x-auto pb-3">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                {link.label}
              </Link>
            ))}
          </nav>
        </Container>
      </header>
      <Container size="wide" className="py-10 sm:py-14">{children}</Container>
    </div>
  );
}
