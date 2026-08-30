import { Link } from "@tanstack/react-router";
import { Section, type Tone } from "@/components/ui-kit/Section";
import { Reveal } from "@/components/ui-kit/Reveal";
import { buttonStyles } from "@/components/ui-kit/RosmonButton";
import { site } from "@/content/site";
import { cn } from "@/lib/utils";

export function FinalCTA({ tone = "ink" }: { tone?: Tone }) {
  return (
    <Section tone={tone}>
      <Reveal className="glass-strong lift relative overflow-hidden rounded-4xl px-6 py-16 text-center sm:px-12 sm:py-24">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -top-40 mx-auto h-72 w-72 rounded-full bg-gold/12 blur-3xl"
        />
        <span className="eyebrow text-gold">Reservations</span>
        <h2 className="mx-auto mt-5 max-w-2xl font-display text-[2.5rem] leading-[1] font-light tracking-[-0.02em] text-balance sm:text-6xl">
          Your stay starts <span className="text-gold italic">here</span>.
        </h2>
        <p className="mx-auto mt-5 max-w-md text-[0.95rem] leading-relaxed text-muted-foreground">
          Rooms from {site.currency}250 a night, two guests per room.
        </p>
        <div className="mx-auto mt-9 flex max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
          <Link to="/book" className={cn(buttonStyles({ size: "lg" }))}>
            Book Now
          </Link>
          <Link
            to="/contact"
            className={cn(buttonStyles({ size: "lg", variant: "glass" }))}
          >
            Contact Rosmon
          </Link>
        </div>
      </Reveal>
    </Section>
  );
}
