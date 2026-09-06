import { Quote } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Section, type Tone } from "@/components/ui-kit/Section";
import { SectionHeading } from "@/components/ui-kit/SectionHeading";
import { Reveal } from "@/components/ui-kit/Reveal";
import { MoreLink } from "@/components/ui-kit/MoreLink";
import { publicTestimonialsQuery } from "@/lib/public/testimonials";

/** Shown only when there are zero published testimonials — a real empty state, not a placeholder for fake content. */
const emptySlots = [0, 1, 2];

export function Testimonials({
  tone = "sand",
  withMoreLink = true,
}: {
  tone?: Tone;
  withMoreLink?: boolean;
}) {
  const { data: testimonials } = useQuery(publicTestimonialsQuery);
  const published = testimonials ?? [];

  return (
    <Section tone={tone}>
      <SectionHeading
        eyebrow="Guest voices"
        title={
          <>
            Reviews from <span className="text-gold italic">real stays</span>.
          </>
        }
        body="Verified guest reviews will appear here once collected. Nothing is written on our guests' behalf."
      />

      <div className="mt-12 grid gap-4 sm:mt-16 lg:grid-cols-3">
        {published.length > 0
          ? published.map((t, i) => (
              <Reveal key={t.id} delay={i * 90}>
                <div className="surface flex h-full flex-col rounded-4xl p-7 sm:p-8">
                  <Quote className="size-5 text-gold/60" strokeWidth={1.25} />
                  <p className="mt-6 flex-1 text-sm leading-relaxed">{t.quote}</p>
                  <p className="mt-8 text-[0.6875rem] tracking-[0.2em] text-muted-foreground uppercase">
                    {t.guestName}
                  </p>
                </div>
              </Reveal>
            ))
          : emptySlots.map((i) => (
              <Reveal key={i} delay={i * 90}>
                <div className="surface flex h-full flex-col rounded-4xl p-7 sm:p-8">
                  <Quote className="size-5 text-gold/60" strokeWidth={1.25} />
                  <div className="mt-6 space-y-3" aria-hidden="true">
                    <span className="block h-2.5 w-full rounded-full bg-[var(--hover-wash)]" />
                    <span className="block h-2.5 w-11/12 rounded-full bg-[var(--hover-wash)]" />
                    <span className="block h-2.5 w-8/12 rounded-full bg-[var(--hover-wash)]" />
                  </div>
                  <p className="mt-8 text-[0.6875rem] tracking-[0.2em] text-muted-foreground uppercase">
                    Awaiting guest review
                  </p>
                </div>
              </Reveal>
            ))}
      </div>

      {withMoreLink && (
        <Reveal className="mt-10">
          <MoreLink to="/about">More guest experiences</MoreLink>
        </Reveal>
      )}
    </Section>
  );
}
