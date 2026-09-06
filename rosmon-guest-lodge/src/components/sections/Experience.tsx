import { photos } from "@/content/photos";
import { Section, type Tone } from "@/components/ui-kit/Section";
import { Reveal } from "@/components/ui-kit/Reveal";
import { MoreLink } from "@/components/ui-kit/MoreLink";

export function Experience({
  tone = "ink",
  withMoreLink = true,
}: {
  tone?: Tone;
  withMoreLink?: boolean;
}) {
  return (
    <Section tone={tone}>
      <div className="grid items-end gap-5 lg:grid-cols-[1.35fr_1fr] lg:gap-6">
        <Reveal className="relative overflow-hidden rounded-4xl border border-hairline lift">
          <img
            src={photos.dining}
            alt="The restaurant and bar at Rosmon Guest Lodge in the evening"
            width={1600}
            height={1104}
            loading="lazy"
            decoding="async"
            className="aspect-[4/3] w-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.04] sm:aspect-[16/10]"
          />
          <div className="image-veil pointer-events-none absolute inset-0" />
          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-9">
            <span className="eyebrow text-gold">The property</span>
            <h2 className="mt-3 max-w-md font-display text-[2rem] leading-[1.05] font-light tracking-[-0.01em] text-balance sm:text-5xl">
              Dinner, a drink, and an early night.
            </h2>
          </div>
        </Reveal>

        <Reveal delay={140} className="grid gap-5">
          <div className="tone-espresso surface rounded-4xl p-7 sm:p-9">
            <p className="text-[0.95rem] leading-relaxed text-muted-foreground">
              The restaurant and bar sit a few steps from the rooms, so an evening
              at Rosmon can be as simple as walking downstairs. Parking is on site,
              and the gate stays attended.
            </p>
            {withMoreLink && (
              <div className="mt-7">
                <MoreLink to="/experience">The Rosmon experience</MoreLink>
              </div>
            )}
          </div>
          <div className="relative overflow-hidden rounded-4xl border border-hairline">
            <img
              src={photos.entrance}
              alt="Interior entrance landing at Rosmon Guest Lodge"
              width={1400}
              height={1000}
              loading="lazy"
              decoding="async"
              className="aspect-[16/10] w-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.04]"
            />
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
