import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/ui-kit/Section";
import { GalleryEditorial } from "@/components/gallery/GalleryEditorial";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { galleryImages } from "@/content/gallery";
import { publicGalleryQuery } from "@/lib/public/gallery";

const title = "Gallery — Rosmon Guest Lodge, Chipata";
const description =
  "Photography of Rosmon Guest Lodge in Chipata: the property, guest rooms, restaurant and bar, and the details in between.";

export const Route = createFileRoute("/gallery")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(publicGalleryQuery);
  },
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
  component: GalleryPage,
});

function GalleryPage() {
  const { data: liveGallery } = useQuery(publicGalleryQuery);
  const images = liveGallery && liveGallery.length > 0 ? liveGallery : galleryImages;
  return (
    <>
      <PageHeader
        tone="ink"
        eyebrow="Gallery"
        crumbs={[{ label: "Home", to: "/" }, { label: "Gallery" }]}
        title={
          <>
            The property, <span className="text-gold italic">in full</span>.
          </>
        }
        body="Reference photography while the final property shoot is arranged. Select any image to view it larger."
      />
      <Section tone="charcoal">
        <GalleryEditorial images={images} />
      </Section>
      <FinalCTA tone="ink" />
    </>
  );
}
