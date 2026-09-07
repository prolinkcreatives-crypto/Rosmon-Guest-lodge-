import { Section } from "@/components/ui-kit/Section";
import { Reveal } from "@/components/ui-kit/Reveal";
import { MoreLink } from "@/components/ui-kit/MoreLink";

export function Intro() {
  return (
    <Section tone="charcoal" className="py-24 sm:py-32">
      <Reveal className="mx-auto max-w-3xl text-center">
        <span className="eyebrow text-gold">Rosmon</span>
        <p className="mt-6 font-display text-[1.75rem] leading-[1.25] font-light tracking-[-0.01em] text-balance sm:text-4xl lg:text-[2.75rem]">
          Affordable accommodation, without sacrificing quality. That is the whole
          idea behind Rosmon — a lodge that stays{" "}
          <span className="text-gold italic">honest about price</span> and
          particular about everything else.
        </p>
        <div className="mt-9">
          <MoreLink to="/about">Our story</MoreLink>
        </div>
      </Reveal>
      <Reveal delay={120} className="mx-auto mt-10 h-px w-40 gold-rule opacity-60">
        <span className="sr-only">·</span>
      </Reveal>
    </Section>
  );
}
