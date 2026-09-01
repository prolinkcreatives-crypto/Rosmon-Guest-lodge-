import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { RoomDetail } from "@/components/rooms/RoomDetail";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { getRoom } from "@/content/rooms";
import { publicRoomPricesQuery, withLivePrices } from "@/lib/public/pricing";

export const Route = createFileRoute("/rooms/standard")({
  loader: async ({ context }) => ({
    prices: await context.queryClient.ensureQueryData(publicRoomPricesQuery),
  }),
  head: ({ loaderData }) => {
    const price = loaderData?.prices.standard ?? getRoom("standard").pricePerNight;
    const title = `Standard Room — K${price} a night | Rosmon Guest Lodge`;
    const description = `The Standard room at Rosmon Guest Lodge, Chipata: K${price} a night for up to two guests, with air conditioning, hot water, DStv and Wi-Fi.`;
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
  component: StandardRoomPage,
});

function StandardRoomPage() {
  const { data: prices } = useQuery(publicRoomPricesQuery);
  const [room, other] = withLivePrices([getRoom("standard"), getRoom("executive")], prices);
  return (
    <>
      <RoomDetail room={room} other={other} />
      <FinalCTA tone="ink" />
    </>
  );
}
