import { useCallback, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { GalleryImage } from "@/content/gallery";

/** Minimal, keyboard-accessible lightbox — no dependency, no layout shift. */
export function GalleryLightbox({
  images,
  index,
  onClose,
  onIndexChange,
}: {
  images: GalleryImage[];
  index: number | null;
  onClose: () => void;
  onIndexChange: (next: number) => void;
}) {
  const open = index !== null;

  const step = useCallback(
    (delta: number) => {
      if (index === null) return;
      onIndexChange((index + delta + images.length) % images.length);
    },
    [index, images.length, onIndexChange],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose, step]);

  if (index === null) return null;
  const image = images[index];
  if (!image) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={image.alt}
      className="tone-ink animate-fade-in fixed inset-0 z-[60] flex flex-col bg-background/95 backdrop-blur-xl"
    >
      <div className="flex items-center justify-between px-5 py-4 sm:px-8">
        <span className="eyebrow">
          {index + 1} / {images.length} · {image.category}
        </span>
        <button
          onClick={onClose}
          aria-label="Close gallery"
          className="glass grid size-10 place-items-center rounded-full transition-colors duration-300 hover:text-gold"
        >
          <X className="size-5" strokeWidth={1.25} />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center px-4 pb-4 sm:px-8">
        <img
          key={image.src}
          src={image.src}
          alt={image.alt}
          className="animate-fade-in max-h-full max-w-full rounded-3xl object-contain"
        />
      </div>

      <div className="flex items-center justify-between gap-4 px-5 pb-8 sm:px-8">
        <button
          onClick={() => step(-1)}
          aria-label="Previous image"
          className="glass grid size-12 place-items-center rounded-full transition-colors duration-300 hover:text-gold"
        >
          <ChevronLeft className="size-5" strokeWidth={1.25} />
        </button>
        <p className="min-w-0 flex-1 truncate text-center text-sm text-muted-foreground">
          {image.alt}
        </p>
        <button
          onClick={() => step(1)}
          aria-label="Next image"
          className="glass grid size-12 place-items-center rounded-full transition-colors duration-300 hover:text-gold"
        >
          <ChevronRight className="size-5" strokeWidth={1.25} />
        </button>
      </div>
    </div>
  );
}
