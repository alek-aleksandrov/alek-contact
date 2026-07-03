"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

/** Terminal-flavored renderers: tight spacing, monospace, emerald accents. */
const COMPONENTS: Components = {
  p: ({ children }) => (
    <p className="mb-2 leading-relaxed last:mb-0">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-white">{children}</strong>
  ),
  em: ({ children }) => <em className="text-zinc-300 italic">{children}</em>,
  ul: ({ children }) => (
    <ul className="mb-2 ml-4 list-disc space-y-1 last:mb-0 marker:text-emerald-400/60">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-2 ml-4 list-decimal space-y-1 last:mb-0 marker:text-emerald-400/60">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="pl-1 leading-relaxed">{children}</li>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-emerald-400 underline underline-offset-2 hover:text-emerald-300"
    >
      {children}
    </a>
  ),
  code: ({ children }) => (
    <code className="rounded bg-white/10 px-1 py-0.5 text-[0.85em] text-emerald-200">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="mb-2 overflow-x-auto rounded bg-white/10 p-2 text-[0.85em] last:mb-0">
      {children}
    </pre>
  ),
  h1: ({ children }) => (
    <p className="mb-2 font-semibold text-white last:mb-0">{children}</p>
  ),
  h2: ({ children }) => (
    <p className="mb-2 font-semibold text-white last:mb-0">{children}</p>
  ),
  h3: ({ children }) => (
    <p className="mb-2 font-semibold text-white last:mb-0">{children}</p>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mb-2 border-l-2 border-white/20 pl-3 text-zinc-300 last:mb-0">
      {children}
    </blockquote>
  ),
};

/**
 * Renders assistant markdown, styled to match the terminal. Raw HTML is NOT
 * enabled (no rehype-raw), so untrusted model output can't inject markup. The
 * wrapper neutralizes double-styling of `code` nested inside a `pre` block.
 */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-zinc-100">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={COMPONENTS}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
