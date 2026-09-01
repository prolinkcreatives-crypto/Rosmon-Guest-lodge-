import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { GalleryImage } from "@/content/gallery";

interface PublicGalleryRow {
  id: string;
  storage_path: string;
  alt: string;
  category: string;
  is_featured: boolean;
}

/**
 * Published gallery photography, read live from Supabase. The `gallery`
 * bucket is private, so each row's src is a freshly signed URL rather
 * than a plain path — this only succeeds under the "Public read
 * published gallery objects" storage policy (20260831052141), which
 * only covers objects a published gallery_images row actually points to.
 *
 * Admin manages caption/category/publish/order/featured — not layout —
 * so `span` has no source column. It's derived here: the featured image
 * (if any) reads "wide", the rest alternate, matching the rhythm of the
 * original static curation without asking staff to think about layout.
 *
 * 6-hour signed URLs: this runs per request from a route loader (see
 * routes/gallery.tsx, routes/index.tsx), so it's always freshly signed
 * on render; the longer expiry is headroom in case a page is ever
 * served from a CDN/edge cache rather than rendered fresh every time.
 */
export const publicGalleryQuery = queryOptions({
  queryKey: ["public", "gallery"],
  queryFn: async (): Promise<GalleryImage[]> => {
    const { data, error } = (await supabase
      .from("gallery_images")
      .select("id, storage_path, alt, category, is_featured")
      .eq("is_published", true)
      .order("sort_order")
      .order("created_at")) as unknown as {
      data: PublicGalleryRow[] | null;
      error: { message: string } | null;
    };
    if (error) throw new Error(error.message);
    const rows = data ?? [];

    const signed = await Promise.all(
      rows.map((row) => supabase.storage.from("gallery").createSignedUrl(row.storage_path, 21_600)),
    );

    return rows
      .map((row, i) => ({
        src: signed[i].data?.signedUrl ?? "",
        alt: row.alt,
        category: row.category || "Details",
        span: (row.is_featured ? "wide" : i % 2 === 0 ? "tall" : "regular") as GalleryImage["span"],
      }))
      .filter((img) => img.src);
  },
  staleTime: 60_000,
});
