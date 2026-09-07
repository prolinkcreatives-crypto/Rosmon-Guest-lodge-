import { BedDouble, Users } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { RoomType } from "@/content/rooms";
import { site } from "@/content/site";
import { buttonStyles } from "@/components/ui-kit/RosmonButton";
import { cn } from "@/lib/utils";

export function RoomCard({ room }: { room: RoomType }) {
  return (
    <article className="tone-ink group relative isolate overflow-hidden rounded-4xl border border-hairline lift transition-[transform,border-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-gold/30">
      <div className="relative aspect-[4/5] w-full overflow-hidden sm:aspect-[3/4]">
        <img
          src={room.image}
          alt={`${room.name} room at Rosmon Guest Lodge`}
          width={room.imageWidth}
          height={room.imageHeight}
          loading="lazy"
          decoding="async"
          className="size-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
        />
        <div className="image-veil absolute inset-0" />
      </div>

      <span className="glass absolute top-4 right-4 rounded-full px-3.5 py-2 text-[0.8125rem] font-medium text-gold">
        {site.currency}
        {room.pricePerNight}
        <span className="text-muted-foreground"> / night</span>
      </span>

      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
        <span className="eyebrow text-gold/90">{room.name}</span>
        <h3 className="mt-2 font-display text-3xl leading-none font-light tracking-[-0.01em] sm:text-4xl">
          {room.name} Room
        </h3>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-foreground/75">
          {room.descriptor}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.75rem] text-foreground/70">
          <span className="inline-flex items-center gap-2">
            <Users className="size-3.5 text-gold" strokeWidth={1.25} />
            {room.maxGuests} guests
          </span>
          <span className="inline-flex items-center gap-2">
            <BedDouble className="size-3.5 text-gold" strokeWidth={1.25} />
            {room.units} units
          </span>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            to={`/rooms/${room.slug}`}
            className={cn(buttonStyles({ size: "sm", variant: "glass" }))}
          >
            View Room
          </Link>
          <Link
            to="/book"
            search={{ room: room.slug }}
            className={cn(buttonStyles({ size: "sm" }))}
          >
            Book {room.name}
          </Link>
        </div>
      </div>
    </article>
  );
}
