import { Container } from "@/components/section";
import { SocialLinks } from "@/components/social-links";
import { site } from "@/content/site";

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
        </div>
        <SocialLinks />
      </Container>
    </footer>
  );
}
