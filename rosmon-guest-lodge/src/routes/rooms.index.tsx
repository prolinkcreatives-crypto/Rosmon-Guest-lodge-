import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { Rooms } from "@/components/sections/Rooms";
import { Amenities } from "@/components/sections/Amenities";
import { FinalCTA } from "@/components/sections/FinalCTA";

const title = "Rooms & Rates — Rosmon Guest Lodge, Chipata";
const description =
  "Standard rooms from K250 a night and Executive rooms from K450 a night at Rosmon Guest Lodge, Chipata. Two guests per room, air conditioning, hot water, DStv and Wi-Fi.";

export const Route = createFileRoute("/rooms/")({
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
  component: RoomsPage,
});

function RoomsPage() {
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
      <Rooms tone="taupe" withMoreLink={false} />
      <Amenities tone="sand" />
      <FinalCTA tone="ink" />
    </>
  );
}
