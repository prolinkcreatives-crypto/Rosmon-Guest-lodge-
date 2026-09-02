import { MapPin } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { photos } from "@/content/photos";
import { AvailabilityPanel } from "@/components/booking/AvailabilityPanel";
import { buttonStyles } from "@/components/ui-kit/RosmonButton";
import { site } from "@/content/site";
import { cn } from "@/lib/utils";

export function Hero() {
  return (
    <section
      id="top"
      className="tone-ink relative isolate min-h-[100svh] overflow-hidden"
    >
      <img
        src={photos.hero}
        alt="Rosmon Guest Lodge at dusk, warmly lit entrance and garden"
        width={1600}
        height={1200}
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 -z-20 size-full object-cover"
      />
      <div className="image-veil absolute inset-0 -z-10" />

      <div className="mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col justify-end px-5 pt-32 pb-8 sm:px-8 sm:pb-12">
        <div className="animate-fade-in">
          <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-2">
            <MapPin className="size-3.5 text-gold" strokeWidth={1.25} />
            <span className="text-[0.6875rem] tracking-[0.22em] uppercase">
              {site.address.street} · {site.address.city}, {site.address.country}
            </span>
          </span>

          <h1 className="mt-7 max-w-[10ch] font-display text-[3.25rem] leading-[0.95] font-normal tracking-[-0.02em] text-balance [text-shadow:0_2px_28px_oklch(0.12_0.01_52/55%)] sm:text-7xl lg:text-8xl">
            Rosmon
            <span className="block text-gold italic">Guest Lodge</span>
          </h1>

          <p className="mt-6 max-w-[26ch] text-[1.0625rem] leading-relaxed font-normal text-foreground [text-shadow:0_1px_16px_oklch(0.12_0.01_52/60%)] sm:max-w-md sm:text-lg">
            Comfortable rooms, warm hospitality, and a relaxed stay in Chipata.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/book" className={cn(buttonStyles({ size: "lg" }))}>
              Book Your Stay
            </Link>
            <Link
              to="/rooms"
              className={cn(buttonStyles({ size: "lg", variant: "glass" }))}
            >
              View Rooms
            </Link>
          </div>
        </div>

        <AvailabilityPanel className="mt-10 sm:mt-14" />
      </div>
    </section>
  );
}
