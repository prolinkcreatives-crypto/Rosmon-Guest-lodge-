import { createFileRoute } from "@tanstack/react-router";
import { RoomDetail } from "@/components/rooms/RoomDetail";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { getRoom } from "@/content/rooms";

const title = "Executive Room — K450 a night | Rosmon Guest Lodge";
const description =
  "The Executive room at Rosmon Guest Lodge, Chipata: K450 a night for up to two guests, with more space, air conditioning, hot water, DStv and Wi-Fi.";

export const Route = createFileRoute("/rooms/executive")({
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
  component: ExecutiveRoomPage,
});

function ExecutiveRoomPage() {
  return (
    <>
      <RoomDetail room={getRoom("executive")} other={getRoom("standard")} />
      <FinalCTA tone="ink" />
    </>
  );
}
