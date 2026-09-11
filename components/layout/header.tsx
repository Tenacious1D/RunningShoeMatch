"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/quiz", label: "Find My Shoe" },
  { href: "/rankings", label: "Rankings" },
  { href: "/shoes", label: "Shoes" },
  { href: "/blog", label: "Blog" },
  { href: "/methodology", label: "Methodology" },
] as const;

function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <Container size="wide">
        <div className="flex h-16 items-center justify-between gap-4 lg:h-[4.5rem]">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            onClick={() => setMenuOpen(false)}
          >
            <span
              className="flex h-9 w-9 items-center justify-center rounded-md bg-foreground text-[0.62rem] font-black tracking-[0.08em] text-background"
              aria-hidden="true"
            >
              RSM
            </span>
            <span className="text-sm font-bold tracking-tight sm:text-base">
              Running Shoe Match
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
            {navigation.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active && "bg-muted text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/quiz"
              className={cn(buttonVariants({ size: "sm" }), "hidden sm:inline-flex")}
            >
              Find My Shoe
            </Link>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-card text-foreground shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 lg:hidden"
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
            </button>
          </div>
        </div>
      </Container>

      {menuOpen ? (
        <div id="mobile-navigation" className="border-t border-border bg-background lg:hidden">
          <Container size="wide" className="py-4">
            <nav className="grid gap-1" aria-label="Mobile navigation">
              {navigation.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "rounded-md px-3 py-3 text-base font-medium text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      active && "bg-muted text-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <Link
                href="/quiz"
                onClick={() => setMenuOpen(false)}
                className={cn(buttonVariants({ size: "lg" }), "mt-3 sm:hidden")}
              >
                Find My Shoe
              </Link>
            </nav>
          </Container>
        </div>
      ) : null}
    </header>
  );
}

export { Header };