import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { Rooms } from "@/components/sections/Rooms";
import { Amenities } from "@/components/sections/Amenities";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { roomTypes, getRoom } from "@/content/rooms";
import { publicRoomPricesQuery, withLivePrices } from "@/lib/public/pricing";

export const Route = createFileRoute("/rooms/")({
  loader: async ({ context }) => ({
    prices: await context.queryClient.ensureQueryData(publicRoomPricesQuery),
  }),
  head: ({ loaderData }) => {
    const standard = withLivePrices([getRoom("standard")], loaderData?.prices)[0];
    const executive = withLivePrices([getRoom("executive")], loaderData?.prices)[0];
    const title = "Rooms & Rates — Rosmon Guest Lodge, Chipata";
    const description = `Standard rooms from K${standard.pricePerNight} a night and Executive rooms from K${executive.pricePerNight} a night at Rosmon Guest Lodge, Chipata. Two guests per room, air conditioning, hot water, DStv and Wi-Fi.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: RoomsPage,
});

function RoomsPage() {
  const { data: prices } = useQuery(publicRoomPricesQuery);
  return (
    <>
      <PageHeader
        tone="ink"
        eyebrow="Accommodation"
        crumbs={[{ label: "Home", to: "/" }, { label: "Rooms" }]}
        title={
          <>
            Two room types, one <span className="text-gold italic">standard</span>.
          </>
        }
        body={`Fifteen rooms in total: eleven Standard and four Executive. Rates are per room per night for up to two guests.`}
      />
      <Rooms tone="taupe" withMoreLink={false} rooms={withLivePrices(roomTypes, prices)} />
      <Amenities tone="sand" />
      <FinalCTA tone="ink" />
    </>
  );
}
