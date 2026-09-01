import { Section } from "@/components/ui-kit/Section";
import { SectionHeading } from "@/components/ui-kit/SectionHeading";
import { Reveal } from "@/components/ui-kit/Reveal";
import { MoreLink } from "@/components/ui-kit/MoreLink";
import { roomTypes, type RoomType } from "@/content/rooms";
import { RoomCard } from "./RoomCard";
import type { Tone } from "@/components/ui-kit/Section";

export function Rooms({
  tone = "taupe",
  withMoreLink = true,
  rooms = roomTypes,
}: {
  tone?: Tone;
  withMoreLink?: boolean;
  rooms?: RoomType[];
}) {
  return (
    <Section id="rooms" tone={tone}>
      <SectionHeading
        eyebrow="Rooms"
        title={
          <>
            Two ways to <span className="text-gold italic">stay</span>.
          </>
        }
        body="Every room sleeps up to two guests and comes with air conditioning, hot water, DStv and Wi-Fi."
      />

      <div className="mt-12 grid gap-5 sm:mt-16 lg:grid-cols-2 lg:gap-6">
        {rooms.map((room, i) => (
          <Reveal key={room.id} delay={i * 120}>
            <RoomCard room={room} />
          </Reveal>
        ))}
      </div>

      {withMoreLink && (
        <Reveal className="mt-10">
          <MoreLink to="/rooms">Explore all rooms</MoreLink>
        </Reveal>
      )}
    </Section>
  );
}
