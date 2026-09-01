import { Users, BedDouble, CircleDashed, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Section } from "@/components/ui-kit/Section";
import { Reveal } from "@/components/ui-kit/Reveal";
import { SectionHeading } from "@/components/ui-kit/SectionHeading";
import { buttonStyles } from "@/components/ui-kit/RosmonButton";
import { MoreLink } from "@/components/ui-kit/MoreLink";
import { GalleryEditorial } from "@/components/gallery/GalleryEditorial";
import type { RoomType } from "@/content/rooms";
import { site } from "@/content/site";
import { cn } from "@/lib/utils";

export function RoomDetail({ room, other }: { room: RoomType; other: RoomType }) {
  return (
    <>
      {/* Hero photography */}
      <section className="tone-ink relative isolate overflow-hidden">
        <img
          src={room.image}
          alt={`${room.name} room at Rosmon Guest Lodge`}
          width={room.imageWidth}
          height={room.imageHeight}
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 -z-20 size-full object-cover"
        />
        <div className="image-veil absolute inset-0 -z-10" />
        <div className="mx-auto flex min-h-[72svh] w-full max-w-6xl flex-col justify-end px-5 pt-32 pb-12 sm:px-8">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 text-[0.6875rem] tracking-[0.18em] uppercase">
              <li>
                <Link
                  to="/"
                  className="text-foreground/70 transition-colors hover:text-gold"
                >
                  Home
                </Link>
              </li>
              <li aria-hidden="true" className="text-foreground/40">
                /
              </li>
              <li>
                <Link
                  to="/rooms"
                  className="text-foreground/70 transition-colors hover:text-gold"
                >
                  Rooms
                </Link>
              </li>
              <li aria-hidden="true" className="text-foreground/40">
                /
              </li>
              <li className="text-gold">{room.name}</li>
            </ol>
          </nav>

          <h1 className="mt-6 font-display text-[3rem] leading-[0.95] font-light tracking-[-0.02em] sm:text-7xl">
            {room.name}
            <span className="block text-gold italic">Room</span>
          </h1>

          <div className="mt-7 flex flex-wrap items-center gap-2">
            <Chip>
              {site.currency}
              {room.pricePerNight} / night
            </Chip>
            <Chip>
              <Users className="size-3.5 text-gold" strokeWidth={1.25} />
              Up to {room.maxGuests} guests
            </Chip>
            <Chip>
              <BedDouble className="size-3.5 text-gold" strokeWidth={1.25} />
              {room.units} rooms of this type
            </Chip>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/book"
              search={{ room: room.slug }}
              className={cn(buttonStyles({ size: "lg" }))}
            >
              Book {room.name}
            </Link>
            <Link
              to="/book"
              className={cn(buttonStyles({ size: "lg", variant: "glass" }))}
            >
              Check Availability
            </Link>
          </div>
        </div>
      </section>

      {/* Description + amenities */}
      <Section tone="taupe">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <Reveal>
            <span className="eyebrow text-gold">The room</span>
            <p className="mt-5 font-display text-[1.6rem] leading-[1.3] font-light text-balance sm:text-3xl">
              {room.description}
            </p>
            <p className="mt-6 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {room.descriptor} Housekeeping keeps every room to the same standard,
              and reception can help with anything you need during your stay.
            </p>
          </Reveal>

          <Reveal delay={120} className="tone-charcoal surface rounded-4xl p-7 sm:p-8">
            <span className="eyebrow text-gold">Included</span>
            <ul className="mt-5 space-y-3">
              {room.features.map((f) => (
                <li key={f} className="flex items-center gap-3 text-[0.9375rem]">
                  <span className="size-1.5 rounded-full bg-gold" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="hairline-t mt-7 flex items-baseline justify-between pt-6">
              <span className="text-sm text-muted-foreground">Per night</span>
              <span className="font-display text-3xl font-light text-gold">
                {site.currency}
                {room.pricePerNight}
              </span>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* Gallery */}
      <Section tone="charcoal">
        <SectionHeading
          eyebrow="Gallery"
          title={
            <>
              Inside the <span className="text-gold italic">{room.name}</span>.
            </>
          }
          body="Reference photography. Photographs of the actual rooms are being produced."
        />
        <div className="mt-12">
          <GalleryEditorial
            withFilters={false}
            images={room.gallery.map((g, i) => ({
              ...g,
              category: "Rooms" as const,
              span: i === 0 ? ("wide" as const) : ("regular" as const),
            }))}
          />
        </div>
      </Section>

      {/* Pending details + related */}
      <Section tone="sand">
        <div className="grid gap-6 lg:grid-cols-2">
          <Reveal className="surface rounded-4xl p-7 sm:p-9">
            <span className="eyebrow text-gold">Still to be confirmed</span>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Rosmon has not supplied the following yet, so nothing has been
              invented in its place:
            </p>
            <ul className="mt-5 space-y-3">
              {room.pendingDetails.map((d) => (
                <li key={d} className="flex items-start gap-3 text-[0.9375rem]">
                  <CircleDashed
                    className="mt-0.5 size-4 shrink-0 text-gold"
                    strokeWidth={1.25}
                  />
                  <span className="text-muted-foreground">{d}</span>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={120} className="tone-espresso surface rounded-4xl p-7 sm:p-9">
            <span className="eyebrow text-gold">Also available</span>
            <h3 className="mt-4 font-display text-4xl font-light">
              {other.name} Room
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {other.descriptor}
            </p>
            <p className="mt-5 font-display text-2xl font-light text-gold">
              {site.currency}
              {other.pricePerNight}
              <span className="text-sm text-muted-foreground"> / night</span>
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to={other.slug === "standard" ? "/rooms/standard" : "/rooms/executive"}
                className={cn(buttonStyles({ size: "sm", variant: "glass" }))}
              >
                View {other.name}
                <ArrowRight className="size-4" strokeWidth={1.5} />
              </Link>
              <MoreLink to="/rooms" className="self-center">
                All rooms
              </MoreLink>
            </div>
          </Reveal>
        </div>
      </Section>
    </>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-[0.75rem] tracking-wide">
      {children}
    </span>
  );
}
