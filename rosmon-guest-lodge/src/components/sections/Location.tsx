import { MapPin, Navigation, Car } from "lucide-react";
import { Section, type Tone } from "@/components/ui-kit/Section";
import { SectionHeading } from "@/components/ui-kit/SectionHeading";
import { Reveal } from "@/components/ui-kit/Reveal";
import { RosmonLink } from "@/components/ui-kit/RosmonButton";
import { MoreLink } from "@/components/ui-kit/MoreLink";
import { directionsUrl, mapEmbedUrl, site } from "@/content/site";

const { lat, lng } = site.coordinates;

export function Location({
  tone = "espresso",
  withMoreLink = true,
}: {
  tone?: Tone;
  withMoreLink?: boolean;
}) {
  return (
    <Section id="location" tone={tone}>
      <SectionHeading
        eyebrow="Location"
        title={
          <>
            On David Kuanda Road, <span className="text-gold italic">Chipata</span>.
          </>
        }
      />

      <Reveal className="mt-12 grid gap-4 sm:mt-16 lg:grid-cols-[1fr_1.4fr]">
        <div className="surface rounded-4xl p-7 sm:p-9">
          <ul className="space-y-6">
            <Row
              icon={<MapPin className="size-4 text-gold" strokeWidth={1.25} />}
              label="Address"
            >
              {site.address.street}
              <br />
              {site.address.city}, {site.address.country}
            </Row>
            <Row
              icon={<Navigation className="size-4 text-gold" strokeWidth={1.25} />}
              label="Coordinates"
            >
              {lat}, {lng}
            </Row>
            <Row
              icon={<Car className="size-4 text-gold" strokeWidth={1.25} />}
              label="Parking"
            >
              Secure on-site parking for guests
            </Row>
          </ul>

          <RosmonLink
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            variant="outline"
            size="md"
            className="mt-8 w-full"
          >
            Get Directions
          </RosmonLink>

          {withMoreLink && (
            <div className="mt-6">
              <MoreLink to="/contact">Contact & directions</MoreLink>
            </div>
          )}
        </div>

        <div className="min-h-72 overflow-hidden rounded-4xl border border-hairline">
          <iframe
            title="Map showing Rosmon Guest Lodge, Chipata"
            src={mapEmbedUrl}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="size-full min-h-72 border-0"
          />
        </div>
      </Reveal>
    </Section>
  );
}

function Row({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <li className="grid grid-cols-[auto_minmax(0,1fr)] gap-4">
      <span className="mt-1 shrink-0">{icon}</span>
      <span className="min-w-0">
        <span className="eyebrow block">{label}</span>
        <span className="mt-1.5 block text-[0.9375rem] leading-relaxed">
          {children}
        </span>
      </span>
    </li>
  );
}
