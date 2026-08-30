import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, Loader2, Star, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  galleryCategories,
  galleryQuery,
  signedGalleryUrl,
  type GalleryImageRow,
} from "@/lib/admin/queries";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { useAdminAuth } from "@/components/admin/AdminAuth";
import { assertStorage, assertWrite } from "@/lib/admin/write";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/gallery")({
  component: GalleryAdminPage,
});

const field =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-ring";

function GalleryThumb({ path, alt }: { path: string; alt: string }) {
  const signed = useQuery({
    queryKey: ["admin", "gallery-url", path],
    queryFn: () => signedGalleryUrl(path),
    staleTime: 50 * 60 * 1000,
  });
  if (!signed.data) {
    return <div className="aspect-[4/3] w-full animate-pulse bg-secondary" />;
  }
  return (
    <img
      src={signed.data}
      alt={alt || "Gallery image"}
      loading="lazy"
      className="aspect-[4/3] w-full object-cover"
    />
  );
}

function GalleryAdminPage() {
  const { canManage } = useAdminAuth();
  const images = useQuery(galleryQuery);
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState<string>("All");
  const [category, setCategory] = useState<string>("Property");

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin", "gallery"] });

  const upload = useMutation({
    mutationFn: async (files: File[]) => {
      if (files.length === 0) throw new Error("No files were selected");
      const rows = images.data ?? [];
      let order = rows.length ? Math.max(...rows.map((r) => r.sort_order)) + 1 : 0;
      for (const file of files) {
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${crypto.randomUUID()}.${ext}`;
        const up = await supabase.storage.from("gallery").upload(path, file, {
          contentType: file.type,
          upsert: false,
        });
        assertStorage(up, `Uploading ${file.name}`);
        try {
          assertWrite(
            await supabase
              .from("gallery_images")
              .insert({
                storage_path: path,
                url: "",
                alt: file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
                category,
                sort_order: order++,
              } as never)
              .select(),
            `Saving ${file.name}`,
          );
        } catch (e) {
          // Never leave an orphaned file behind when the row could not be written.
          await supabase.storage.from("gallery").remove([path]);
          throw e;
        }
      }
    },
    onSuccess: () => {
      toast.success("Images uploaded");
      void refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<GalleryImageRow> }) => {
      assertWrite(
        await supabase
          .from("gallery_images")
          .update(patch as never)
          .eq("id", id)
          .select(),
        "Updating image",
      );
    },
    onSuccess: () => {
      toast.success("Image updated");
      void refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setFeatured = useMutation({
    mutationFn: async (id: string) => {
      const current = (images.data ?? []).find((i) => i.is_featured);
      if (current && current.id !== id) {
        assertWrite(
          await supabase
            .from("gallery_images")
            .update({ is_featured: false } as never)
            .eq("id", current.id)
            .select(),
          "Clearing previous featured image",
        );
      }
      assertWrite(
        await supabase
          .from("gallery_images")
          .update({ is_featured: true } as never)
          .eq("id", id)
          .select(),
        "Setting featured image",
      );
    },
    onSuccess: () => {
      toast.success("Featured image set");
      void refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (row: GalleryImageRow) => {
      // Delete the row first: if the database refuses, the file is still intact.
      assertWrite(
        await supabase.from("gallery_images").delete().eq("id", row.id).select(),
        "Deleting image",
      );
      assertStorage(
        await supabase.storage.from("gallery").remove([row.storage_path]),
        "Deleting stored file",
      );
    },
    onSuccess: () => {
      toast.success("Image deleted");
      void refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reorder = useMutation({
    mutationFn: async ({ row, dir }: { row: GalleryImageRow; dir: -1 | 1 }) => {
      const rows = [...(images.data ?? [])];
      const i = rows.findIndex((r) => r.id === row.id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= rows.length) return;
      const a = rows[i]!;
      const b = rows[j]!;
      assertWrite(
        await supabase
          .from("gallery_images")
          .update({ sort_order: b.sort_order } as never)
          .eq("id", a.id)
          .select(),
        "Reordering image",
      );
      assertWrite(
        await supabase
          .from("gallery_images")
          .update({ sort_order: a.sort_order } as never)
          .eq("id", b.id)
          .select(),
        "Reordering image",
      );
    },
    onSuccess: () => void refresh(),
    onError: (e: Error) => toast.error(e.message),
  });


  const rows = (images.data ?? []).filter(
    (r) => filter === "All" || r.category === filter,
  );

  return (
    <>
      <AdminPageHeader
        title="Gallery"
        description="Property photography used across the website."
        actions={
          canManage ? (
            <div className="flex flex-wrap items-center gap-2">
              <select
                className={cn(field, "w-auto")}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {galleryCategories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => {
                  // Copy the files out before clearing the input: resetting
                  // `value` empties the live FileList, and the mutation runs
                  // asynchronously — reading it later would find nothing.
                  const picked = Array.from(e.target.files ?? []);
                  e.target.value = "";
                  if (picked.length) upload.mutate(picked);
                }}
              />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={upload.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-gold px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
              >
                {upload.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Upload className="size-4" strokeWidth={1.5} />
                )}
                Upload
              </button>
            </div>
          ) : null
        }
      />

      {!canManage && (
        <p className="mb-4 rounded-xl border border-hairline bg-secondary/50 px-4 py-3 text-sm text-muted-foreground">
          Your role has read-only access to content. Ask a manager or administrator to
          make changes.
        </p>
      )}

      <div className="mb-5 flex flex-wrap gap-1.5">
        {["All", ...galleryCategories].map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs transition-colors",
              filter === c
                ? "border-transparent bg-foreground text-background"
                : "border-hairline text-muted-foreground hover:bg-secondary",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {images.isError && (
        <p className="rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {(images.error as Error).message}
        </p>
      )}

      {images.isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl bg-secondary/50" />
          ))}
        </div>
      )}

      {!images.isLoading && rows.length === 0 && (
        <p className="rounded-xl border border-hairline bg-card px-4 py-10 text-center text-sm text-muted-foreground">
          No images yet. Upload property photography to build the gallery.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => (
          <figure
            key={row.id}
            className="overflow-hidden rounded-xl border border-hairline bg-card shadow-[var(--shadow-soft)]"
          >
            <div className="relative">
              <GalleryThumb path={row.storage_path} alt={row.alt} />
              {row.is_featured && (
                <span className="absolute top-2 left-2 rounded-full bg-gold px-2.5 py-1 text-[0.625rem] tracking-[0.12em] text-primary-foreground uppercase">
                  Featured
                </span>
              )}
            </div>
            <figcaption className="space-y-3 p-3">
              <input
                className={field}
                defaultValue={row.alt}
                disabled={!canManage}
                placeholder="Caption / alt text"
                onBlur={(e) =>
                  e.target.value !== row.alt &&
                  update.mutate({ id: row.id, patch: { alt: e.target.value } })
                }
              />
              <div className="flex flex-wrap items-center gap-2">
                <select
                  className={cn(field, "w-auto")}
                  value={row.category}
                  disabled={!canManage}
                  onChange={(e) =>
                    update.mutate({ id: row.id, patch: { category: e.target.value } })
                  }
                >
                  {galleryCategories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <label className="flex items-center gap-1.5 text-xs">
                  <input
                    type="checkbox"
                    className="size-4 accent-[var(--gold)]"
                    checked={row.is_published}
                    disabled={!canManage}
                    onChange={(e) =>
                      update.mutate({
                        id: row.id,
                        patch: { is_published: e.target.checked },
                      })
                    }
                  />
                  Published
                </label>
              </div>
              {canManage && (
                <div className="flex flex-wrap gap-1.5">
                  <IconBtn
                    label="Move up"
                    onClick={() => reorder.mutate({ row, dir: -1 })}
                  >
                    <ArrowUp className="size-3.5" />
                  </IconBtn>
                  <IconBtn
                    label="Move down"
                    onClick={() => reorder.mutate({ row, dir: 1 })}
                  >
                    <ArrowDown className="size-3.5" />
                  </IconBtn>
                  <IconBtn label="Set featured" onClick={() => setFeatured.mutate(row.id)}>
                    <Star className="size-3.5" />
                  </IconBtn>
                  <IconBtn
                    label="Delete"
                    destructive
                    onClick={() => {
                      if (confirm("Delete this image permanently?")) remove.mutate(row);
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </IconBtn>
                </div>
              )}
            </figcaption>
          </figure>
        ))}
      </div>
    </>
  );
}

function IconBtn({
  children,
  label,
  onClick,
  destructive,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "rounded-lg border border-hairline p-2 transition-colors hover:bg-secondary",
        destructive && "text-destructive hover:bg-destructive/10",
      )}
    >
      {children}
    </button>
  );
}
