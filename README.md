# Alek Portfolio

Personal portfolio of **Aleksandar Aleksandrov** — a full-stack engineer building
with React / Next.js and Nest.js. Deployed on Vercel.

Built on the latest **Next.js 16 (App Router) · React 19 · Tailwind CSS v4 ·
shadcn/ui · Motion**.

## How it's organized

Pages render from typed **content modules** — editing content never means touching
component code:

- `content/site.ts` — name, tagline, resume URL, and the data-driven links
  (GitHub / LinkedIn are a one-line add).
- `content/projects.ts` — each project is one object. A project starts as
  `planned` / `in-progress` (status badge, no dead links) and flips to `live`
  with real links when it ships. `app/projects/[slug]` prerenders one page per
  project automatically.
- `content/experience.ts` — work history, skills, and bio for the About page.

Dark mode follows the OS setting (`prefers-color-scheme`) with no JavaScript.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Add your resume at `public/alek-resume.pdf` to wire up the Resume link.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run lint` — lint
