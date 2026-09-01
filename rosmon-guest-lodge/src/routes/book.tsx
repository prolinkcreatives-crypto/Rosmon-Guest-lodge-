import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/ui-kit/Section";
import { BookingFlow } from "@/components/booking/BookingFlow";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { roomTypes, type RoomType } from "@/content/rooms";
import { publicRoomPricesQuery, withLivePrices } from "@/lib/public/pricing";

const title = "Book a Room — Rosmon Guest Lodge, Chipata";
const description =
  "Check dates, choose a Standard or Executive room and reserve your stay at Rosmon Guest Lodge on David Kuanda Road, Chipata.";

export interface BookSearch {
  room?: RoomType["slug"] | undefined;
  checkIn?: string | undefined;
  checkOut?: string | undefined;
  guests?: number | undefined;
}

/** Hand-rolled search validation keeps the route free of extra dependencies. */
function validateSearch(search: Record<string, unknown>): BookSearch {
  const room =
    search["room"] === "standard" || search["room"] === "executive"
      ? (search["room"] as RoomType["slug"])
      : undefined;

  const asDate = (value: unknown) =>
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? value
      : undefined;

  const guestsRaw = Number(search["guests"]);
  const guests =
    Number.isFinite(guestsRaw) && guestsRaw >= 1 && guestsRaw <= 6
      ? Math.round(guestsRaw)
      : undefined;

  return {
    ...(room ? { room } : {}),
    ...(asDate(search["checkIn"]) ? { checkIn: asDate(search["checkIn"]) } : {}),
    ...(asDate(search["checkOut"]) ? { checkOut: asDate(search["checkOut"]) } : {}),
    ...(guests ? { guests } : {}),
  };
}

export const Route = createFileRoute("/book")({
  validateSearch,
  loader: async ({ context }) => ({
    prices: await context.queryClient.ensureQueryData(publicRoomPricesQuery),
  }),
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BookPage,
});

function BookPage() {
  const search = Route.useSearch();
  const { data: prices } = useQuery(publicRoomPricesQuery);

  return (
    <>
      <PageHeader
        tone="ink"
        eyebrow="Booking"
        crumbs={[{ label: "Home", to: "/" }, { label: "Book" }]}
        title={
          <>
            Reserve your <span className="text-gold italic">stay</span>.
          </>
        }
        body="Five short steps: dates, room, your details, mobile money payment and confirmation. Reception verifies every payment by hand."
      />

      <Section tone="taupe">
        <BookingFlow search={search} rooms={withLivePrices(roomTypes, prices)} />
      </Section>

      <FinalCTA />
    </>
  );
}
