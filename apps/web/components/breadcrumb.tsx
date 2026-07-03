import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type Crumb = { label: string; href?: string };

/**
 * A simple breadcrumb trail. Every item except the last is a link; the last is
 * rendered as the current page. Used to give the live project pages (/finance,
 * /multi-agent, /tldr) and the project detail pages a consistent way back to
 * the projects index.
 */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`} className="flex items-center gap-1.5">
            {i > 0 ? (
              <ChevronRight
                aria-hidden
                className="size-3.5 text-muted-foreground/40"
              />
            ) : null}
            {item.href ? (
              <Link
                href={item.href}
                className="transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-foreground/80" aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
