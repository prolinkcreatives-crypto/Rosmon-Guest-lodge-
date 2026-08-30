import { createFileRoute } from "@tanstack/react-router";
import { RoomDetail } from "@/components/rooms/RoomDetail";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { getRoom } from "@/content/rooms";

const title = "Standard Room — K250 a night | Rosmon Guest Lodge";
const description =
  "The Standard room at Rosmon Guest Lodge, Chipata: K250 a night for up to two guests, with air conditioning, hot water, DStv and Wi-Fi.";

export const Route = createFileRoute("/rooms/standard")({
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
  component: StandardRoomPage,
});

function StandardRoomPage() {
  return (
    <>
      <RoomDetail room={getRoom("standard")} other={getRoom("executive")} />
      <FinalCTA tone="ink" />
    </>
  );
}
