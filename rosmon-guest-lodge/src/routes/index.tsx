import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { Hero } from "@/components/sections/Hero";
import { Intro } from "@/components/sections/Intro";
import { Rooms } from "@/components/sections/Rooms";
import { WhyRosmon } from "@/components/sections/WhyRosmon";
import { Amenities } from "@/components/sections/Amenities";
import { Experience } from "@/components/sections/Experience";
import { Gallery } from "@/components/sections/Gallery";
import { Testimonials } from "@/components/sections/Testimonials";
import { Location } from "@/components/sections/Location";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { roomTypes, getRoom } from "@/content/rooms";
import { galleryImages } from "@/content/gallery";
import { publicRoomPricesQuery, withLivePrices } from "@/lib/public/pricing";
import { publicGalleryQuery } from "@/lib/public/gallery";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => ({
    prices: await context.queryClient.ensureQueryData(publicRoomPricesQuery),
  }),
  head: ({ loaderData }) => {
    const standard = withLivePrices([getRoom("standard")], loaderData?.prices)[0];
    const title = "Rosmon Guest Lodge — Chipata, Zambia";
    const description = `Comfortable, well-kept rooms on David Kuanda Road, Chipata. Air conditioning, hot water, DStv, Wi-Fi, restaurant, bar and secure parking. From K${standard.pricePerNight} a night.`;
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
  component: Index,
});

/**
 * Homepage = preview only. Each section hands off to a dedicated route.
 * Tonal rhythm: ink → charcoal → taupe → espresso → sand → ink → charcoal →
 * sand → espresso → ink.
 */
function Index() {
  const { data: prices } = useQuery(publicRoomPricesQuery);
  // Gallery is fetched client-side (not in the route loader) so a slow or
  // failed Storage sign-URL round trip can never delay first paint of the
  // homepage — it swaps in over the static preview when ready and falls
  // back to it otherwise.
  const { data: liveGallery } = useQuery(publicGalleryQuery);

  return (
    <>
      <Hero />
      <Intro />
      <Rooms tone="taupe" rooms={withLivePrices(roomTypes, prices)} />
      <WhyRosmon tone="espresso" />
      <Amenities tone="sand" />
      <Experience tone="ink" />
      <Gallery tone="charcoal" images={liveGallery && liveGallery.length > 0 ? liveGallery : galleryImages} />
      <Testimonials tone="sand" />
      <Location tone="espresso" />
      <FinalCTA tone="ink" />
    </>
  );
}
