import { ArrowUpRight } from "lucide-react";

import { Container } from "@/components/section";
import { SocialLinks } from "@/components/social-links";
import { site } from "@repo/shared";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border/60 py-10">
      <Container className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <div>
          <p className="font-heading text-sm font-semibold">{site.fullName}</p>
          <p className="text-sm text-muted-foreground">
            {site.role} · © {year}
          </p>
          <a
            href={site.repoUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            Source on GitHub
            <ArrowUpRight className="size-3.5" />
          </a>
        </div>
        <SocialLinks />
      </Container>
    </footer>
  );
}
