import { Section, type Tone } from "@/components/ui-kit/Section";
import { SectionHeading } from "@/components/ui-kit/SectionHeading";
import { Reveal } from "@/components/ui-kit/Reveal";
import { MoreLink } from "@/components/ui-kit/MoreLink";
import { GalleryEditorial } from "@/components/gallery/GalleryEditorial";
import { galleryImages, type GalleryImage } from "@/content/gallery";

/** Homepage preview — a selection only. The full set lives at /gallery. */
export function Gallery({
  tone = "charcoal",
  images = galleryImages,
}: {
  tone?: Tone;
  images?: GalleryImage[];
}) {
  return (
    <Section id="gallery" tone={tone}>
      <SectionHeading
        eyebrow="Gallery"
        title={
          <>
            The lodge, <span className="text-gold italic">unhurried</span>.
          </>
        }
      />

      <div className="mt-12 sm:mt-16">
        <GalleryEditorial images={images.slice(0, 4)} withFilters={false} />
      </div>

      <Reveal className="mt-10">
        <MoreLink to="/gallery">View full gallery</MoreLink>
      </Reveal>
    </Section>
  );
}
