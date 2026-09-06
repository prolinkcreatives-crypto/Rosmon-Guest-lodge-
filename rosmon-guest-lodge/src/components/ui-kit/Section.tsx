import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Tonal chapters. Each one re-themes every design token inside it. */
export type Tone = "sand" | "taupe" | "charcoal" | "espresso" | "ink";

export const toneClass: Record<Tone, string> = {
  sand: "tone-sand",
  taupe: "tone-taupe",
  charcoal: "tone-charcoal",
  espresso: "tone-espresso",
  ink: "tone-ink",
};

export function Section({
  id,
  children,
  className,
  bleed = false,
  tone = "sand",
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  bleed?: boolean;
  tone?: Tone;
}) {
  return (
    <section
      id={id}
      className={cn(
        toneClass[tone],
        "scroll-mt-28 py-20 sm:py-28 lg:py-32",
        className,
      )}
    >
      <div className={cn(!bleed && "mx-auto w-full max-w-6xl px-5 sm:px-8")}>
        {children}
      </div>
    </section>
  );
}
