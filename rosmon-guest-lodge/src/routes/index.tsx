import { createFileRoute } from "@tanstack/react-router";

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

const title = "Rosmon Guest Lodge — Chipata, Zambia";
const description =
  "Comfortable, well-kept rooms on David Kuanda Road, Chipata. Air conditioning, hot water, DStv, Wi-Fi, restaurant, bar and secure parking. From K250 a night.";

export const Route = createFileRoute("/")({
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
  component: Index,
});

/**
 * Homepage = preview only. Each section hands off to a dedicated route.
 * Tonal rhythm: ink → charcoal → taupe → espresso → sand → ink → charcoal →
 * sand → espresso → ink.
 */
function Index() {
  return (
    <>
      <Hero />
      <Intro />
      <Rooms tone="taupe" />
      <WhyRosmon tone="espresso" />
      <Amenities tone="sand" />
      <Experience tone="ink" />
      <Gallery tone="charcoal" />
      <Testimonials tone="sand" />
      <Location tone="espresso" />
      <FinalCTA tone="ink" />
    </>
  );
}
