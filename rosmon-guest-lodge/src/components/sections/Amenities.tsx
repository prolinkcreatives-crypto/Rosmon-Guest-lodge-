import { Wind, Droplets, Tv, Wifi, UtensilsCrossed, Wine, Car } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Section, type Tone } from "@/components/ui-kit/Section";
import { SectionHeading } from "@/components/ui-kit/SectionHeading";
import { Reveal } from "@/components/ui-kit/Reveal";
import { amenities, type AmenityIcon } from "@/content/site";

const iconMap: Record<AmenityIcon, LucideIcon> = {
  wind: Wind,
  droplets: Droplets,
  tv: Tv,
  wifi: Wifi,
  utensils: UtensilsCrossed,
  wine: Wine,
  car: Car,
};

export function Amenities({ tone = "sand" }: { tone?: Tone }) {
  return (
    <Section id="amenities" tone={tone}>
      <SectionHeading
        eyebrow="Amenities"
        title={
          <>
            Everything you need, <span className="text-gold italic">nothing loud</span>.
          </>
        }
      />

      <Reveal className="mt-12 sm:mt-16">
        <ul className="surface divide-y divide-[var(--hairline)] overflow-hidden rounded-4xl">
          {amenities.map((amenity) => {
            const Icon = iconMap[amenity.icon];
            return (
              <li
                key={amenity.label}
                className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 px-6 py-5 transition-colors duration-300 hover:bg-[var(--hover-wash)] sm:px-8"
              >
                <Icon
                  className="size-[1.125rem] shrink-0 text-gold"
                  strokeWidth={1.25}
                />
                <span className="min-w-0 truncate text-[0.9375rem] tracking-tight">
                  {amenity.label}
                </span>
                <span className="text-[0.625rem] tracking-[0.2em] text-muted-foreground uppercase">
                  Included
                </span>
              </li>
            );
          })}
        </ul>
      </Reveal>
    </Section>
  );
}
