"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Menu, X } from "lucide-react";

import { Container } from "@/components/section";
import { buttonVariants } from "@/components/ui/button";
import { site } from "@repo/shared";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/about", label: "About" },
  { href: "/tldr", label: "tl;dr" },
];

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // The mobile menu closes via each link's onClick (below).
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-md">
      <Container className="flex h-14 items-center justify-between gap-4">
        <Link
          href="/"
          className="font-heading text-sm font-semibold tracking-tight"
        >
          <span className="sm:hidden">{site.name}</span>
          <span className="hidden sm:inline">{site.fullName}</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-0.5 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm transition-colors",
                isActive(item.href)
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
          <a
            href={site.resumeUrl}
            target="_blank"
            rel="noreferrer"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "ml-2",
            )}
          >
            <FileText />
            Resume
          </a>
        </nav>

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground md:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </Container>

      {/* Mobile menu panel */}
      {open ? (
        <nav className="border-t border-border/60 bg-background/95 backdrop-blur-md md:hidden">
          <Container className="flex flex-col py-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-2.5 text-sm transition-colors",
                  isActive(item.href)
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
            <a
              href={site.resumeUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() => setOpen(false)}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "mt-2 justify-start",
              )}
            >
              <FileText />
              Resume
            </a>
          </Container>
        </nav>
      ) : null}
    </header>
  );
}
