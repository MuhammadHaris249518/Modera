import type { ReactNode } from "react";
import { Surface } from "@/components/app-shell";

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-screen bg-canvas text-ink lg:grid-cols-[1.1fr_0.9fr]">
      <div className="flex items-center justify-center px-6 py-12 lg:px-20 lg:py-24">
        <div className="w-full max-w-2xl">
          <Surface className="border-border/70 bg-surface/95 p-10 shadow-card-raised sm:p-12">
            <div className="mb-10">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                AI moderation
              </p>
              <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
                {title}
              </h1>
              <p className="mt-3 text-base leading-7 text-ink-muted sm:text-lg">
                {description}
              </p>
            </div>
            {children}
          </Surface>
        </div>
      </div>

      <div className="hidden border-l border-border bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.12),transparent_30%),linear-gradient(180deg,var(--nav-deep)_0%,#111827_100%)] lg:flex lg:flex-col lg:justify-center lg:px-12 lg:py-16">
        <div className="max-w-lg px-4">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-nav-ink">
            Modera Ai
          </p>
          <h2 className="mt-6 font-display text-6xl font-semibold leading-tight tracking-tight text-white sm:text-7xl">
            Modera Ai
          </h2>
          <p className="mt-6 text-base leading-7 text-nav-ink sm:text-lg">
            Streamline content review, ban unsafe uploads, and keep your moderation workflow fast and consistent.
          </p>
        </div>
      </div>
    </div>
  );
}
