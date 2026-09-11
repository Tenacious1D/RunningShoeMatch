import Link from "next/link";

import { Container } from "@/components/layout/container";

const footerLinks = [
  { href: "/about", label: "About" },
  { href: "/methodology", label: "Methodology" },
  { href: "/blog", label: "Blog" },
  { href: "/affiliate-disclosure", label: "Affiliate Disclosure" },
  { href: "/privacy", label: "Privacy" },
  { href: "/contact", label: "Contact" },
] as const;

function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <Container size="wide" className="py-10 sm:py-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-start">
          <div className="max-w-xl">
            <Link href="/" className="inline-flex items-center gap-3 font-bold tracking-tight">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-md bg-foreground text-[0.56rem] font-black tracking-[0.08em] text-background"
                aria-hidden="true"
              >
                RSM
              </span>
              Running Shoe Match
            </Link>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Objective shoe comparisons and practical matching guidance for runners.
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Running Shoe Match may earn a commission when you purchase through links on this site.
            </p>
          </div>

          <nav aria-label="Footer navigation">
            <ul className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-3 lg:text-right">
              {footerLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-muted-foreground transition-colors hover:text-foreground hover:underline hover:underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-xs text-muted-foreground">
          © 2026 Running Shoe Match. All rights reserved.
        </div>
      </Container>
    </footer>
  );
}

export { Footer };