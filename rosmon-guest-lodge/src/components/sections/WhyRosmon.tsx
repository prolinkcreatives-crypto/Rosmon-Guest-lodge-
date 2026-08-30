import { Section, toneClass, type Tone } from "@/components/ui-kit/Section";
import { SectionHeading } from "@/components/ui-kit/SectionHeading";
import { Reveal } from "@/components/ui-kit/Reveal";
import { MoreLink } from "@/components/ui-kit/MoreLink";
import { pillars } from "@/content/site";
import { cn } from "@/lib/utils";

/** Cards alternate surfaces so the grid never reads as one dark block. */
const cardTones: Tone[] = ["ink", "taupe", "charcoal", "sand"];

export function WhyRosmon({
  tone = "espresso",
  withMoreLink = true,
}: {
  tone?: Tone;
  withMoreLink?: boolean;
}) {
  return (
    <Section tone={tone}>
      <SectionHeading
        eyebrow="Why Rosmon"
        title={
          <>
            Considered where it <span className="text-gold italic">counts</span>.
          </>
        }
      />

      <div className="mt-12 grid gap-4 sm:mt-16 sm:grid-cols-2">
        {pillars.map((pillar, i) => (
          <Reveal key={pillar.title} delay={i * 90}>
            <div
              className={cn(
                toneClass[cardTones[i % cardTones.length]!],
                "surface h-full rounded-4xl p-7 transition-colors duration-500 hover:border-gold/25 sm:p-9",
              )}
            >
              <span className="eyebrow text-gold">0{i + 1}</span>
              <h3 className="mt-4 font-display text-3xl font-light tracking-[-0.01em]">
                {pillar.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {pillar.body}
              </p>
            </div>
          </Reveal>
        ))}
      </div>

      {withMoreLink && (
        <Reveal className="mt-10">
          <MoreLink to="/experience">Discover Rosmon</MoreLink>
        </Reveal>
      )}
    </Section>
  );
}
