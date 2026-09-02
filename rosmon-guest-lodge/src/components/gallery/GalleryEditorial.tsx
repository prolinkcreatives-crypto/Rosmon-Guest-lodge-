import { useMemo, useState } from "react";
import { Reveal } from "@/components/ui-kit/Reveal";
import { GalleryLightbox } from "./GalleryLightbox";
import { galleryImages, type GalleryImage } from "@/content/gallery";
import { cn } from "@/lib/utils";

const spanClass: Record<GalleryImage["span"], string> = {
  wide: "sm:col-span-2 aspect-[4/3] sm:aspect-[2/1]",
  tall: "aspect-[4/5]",
  regular: "aspect-[4/3]",
};

export function GalleryEditorial({
  images = galleryImages,
  withFilters = true,
}: {
  images?: GalleryImage[];
  withFilters?: boolean;
}) {
  const [category, setCategory] = useState<string>("All");
  const [active, setActive] = useState<number | null>(null);

  // Categories are whatever is actually present in this image set (in
  // first-appearance order), not a fixed list — live CMS-managed images
  // can carry categories the original static curation never used.
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(images.map((i) => i.category)))],
    [images],
  );

  const visible = useMemo(
    () =>
      category === "All" ? images : images.filter((i) => i.category === category),
    [images, category],
  );

  return (
    <>
      {withFilters && (
        <Reveal className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                "rounded-full border px-4 py-2 text-[0.8125rem] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                c === category
                  ? "border-gold/50 bg-gold/10 text-gold"
                  : "border-hairline text-muted-foreground hover:border-gold/30 hover:text-foreground",
              )}
            >
              {c}
            </button>
          ))}
        </Reveal>
      )}

      <div className={cn("grid gap-4 sm:grid-cols-2", withFilters && "mt-10")}>
        {visible.map((image, i) => (
          <Reveal
            key={image.src + i}
            delay={(i % 2) * 90}
            className={cn("group", image.span === "wide" && "sm:col-span-2")}
          >
            <button
              onClick={() => setActive(images.indexOf(image))}
              aria-label={`View ${image.alt}`}
              className="block w-full overflow-hidden rounded-4xl border border-hairline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <img
                src={image.src}
                alt={image.alt}
                loading="lazy"
                decoding="async"
                className={cn(
                  "w-full object-cover transition-transform duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]",
                  spanClass[image.span],
                )}
              />
            </button>
          </Reveal>
        ))}
      </div>

      <GalleryLightbox
        images={images}
        index={active}
        onClose={() => setActive(null)}
        onIndexChange={setActive}
      />
    </>
  );
}
