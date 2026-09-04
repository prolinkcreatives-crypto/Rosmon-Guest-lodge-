import { ChevronLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { toneClass, type Tone } from "@/components/ui-kit/Section";

export interface Crumb {
  label: string;
  to?: string;
}

/**
 * Consistent page masthead: breadcrumbs, back link, title and standfirst.
 * Sits directly under the floating navigation on every non-home route.
 */
export function PageHeader({
  eyebrow,
  title,
  body,
  crumbs = [],
  back,
  tone = "ink",
  children,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  body?: ReactNode;
  crumbs?: Crumb[];
  back?: { label: string; to: string };
  tone?: Tone;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        toneClass[tone],
        "px-5 pt-32 pb-16 sm:px-8 sm:pt-40 sm:pb-20",
        className,
      )}
    >
      <div className="mx-auto w-full max-w-6xl">
        {crumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.6875rem] tracking-[0.18em] uppercase">
              {crumbs.map((crumb, i) => (
                <li key={crumb.label} className="flex items-center gap-2">
                  {crumb.to ? (
                    <Link
                      to={crumb.to}
                      className="text-muted-foreground transition-colors duration-300 hover:text-gold"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-gold">{crumb.label}</span>
                  )}
                  {i < crumbs.length - 1 && (
                    <span aria-hidden="true" className="text-muted-foreground/60">
                      /
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        {back && (
          <Link
            to={back.to}
            className="glass mb-7 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[0.8125rem] transition-colors duration-300 hover:text-gold"
          >
            <ChevronLeft className="size-4" strokeWidth={1.25} />
            {back.label}
          </Link>
        )}

        {eyebrow && <span className="eyebrow block text-gold">{eyebrow}</span>}
        <h1 className="mt-4 max-w-3xl font-display text-[2.75rem] leading-[0.98] font-light tracking-[-0.02em] text-balance sm:text-6xl lg:text-7xl">
          {title}
        </h1>
        {body && (
          <p className="mt-6 max-w-xl text-[0.95rem] leading-relaxed text-muted-foreground sm:text-base">
            {body}
          </p>
        )}
        {children}
      </div>
    </header>
  );
}
