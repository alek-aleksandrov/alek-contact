import { FileText, Mail } from "lucide-react";

import { GithubIcon, LinkedinIcon } from "@/components/brand-icons";
import { buttonVariants } from "@/components/ui/button";
import { site } from "@repo/shared";
import { cn } from "@/lib/utils";

const iconMap = {
  "file-text": FileText,
  mail: Mail,
  github: GithubIcon,
  linkedin: LinkedinIcon,
} as const;

/** Renders the data-driven links from content/site.ts. */
export function SocialLinks({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {site.links.map((link) => {
        const Icon = link.icon ? iconMap[link.icon] : null;
        return (
          <a
            key={link.label}
            href={link.href}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            {...(link.external
              ? { target: "_blank", rel: "noreferrer" }
              : {})}
          >
            {Icon ? <Icon /> : null}
            {link.label}
          </a>
        );
      })}
    </div>
  );
}
