import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { testimonialsQuery, type TestimonialRow } from "@/lib/admin/queries";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { useAdminAuth } from "@/components/admin/AdminAuth";
import { assertWrite } from "@/lib/admin/write";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/testimonials")({
  component: TestimonialsPage,
});

const field =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-ring";

function TestimonialsPage() {
  const { canManage } = useAdminAuth();
  const list = useQuery(testimonialsQuery);
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [quote, setQuote] = useState("");

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "testimonials"] });

  const add = useMutation({
    mutationFn: async () => {
      const rows = list.data ?? [];
      const sort = rows.length ? Math.max(...rows.map((r) => r.sort_order)) + 1 : 0;
      assertWrite(
        await supabase
          .from("testimonials")
          .insert({
            guest_name: name.trim(),
            quote: quote.trim(),
            sort_order: sort,
            is_published: false,
          } as never)
          .select(),
        "Saving testimonial",
      );
    },
    onSuccess: () => {
      setName("");
      setQuote("");
      toast.success("Testimonial saved as unpublished");
      void refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<TestimonialRow> }) => {
      assertWrite(
        await supabase
          .from("testimonials")
          .update(patch as never)
          .eq("id", id)
          .select(),
        "Updating testimonial",
      );
    },
    onSuccess: () => {
      toast.success("Testimonial updated");
      void refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      assertWrite(
        await supabase.from("testimonials").delete().eq("id", id).select(),
        "Deleting testimonial",
      );
    },
    onSuccess: () => {
      toast.success("Testimonial deleted");
      void refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reorder = useMutation({
    mutationFn: async ({ row, dir }: { row: TestimonialRow; dir: -1 | 1 }) => {
      const rows = [...(list.data ?? [])];
      const i = rows.findIndex((r) => r.id === row.id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= rows.length) return;
      const a = rows[i]!;
      const b = rows[j]!;
      assertWrite(
        await supabase
          .from("testimonials")
          .update({ sort_order: b.sort_order } as never)
          .eq("id", a.id)
          .select(),
        "Reordering testimonial",
      );
      assertWrite(
        await supabase
          .from("testimonials")
          .update({ sort_order: a.sort_order } as never)
          .eq("id", b.id)
          .select(),
        "Reordering testimonial",
      );
    },
    onSuccess: () => void refresh(),
    onError: (e: Error) => toast.error(e.message),
  });


  const rows = list.data ?? [];

  return (
    <>
      <AdminPageHeader
        title="Testimonials"
        description="Only publish words a guest actually gave you."
      />

      {!canManage && (
        <p className="mb-4 rounded-xl border border-hairline bg-secondary/50 px-4 py-3 text-sm text-muted-foreground">
          Your role has read-only access to content.
        </p>
      )}

      {canManage && (
        <section className="mb-6 rounded-xl border border-hairline bg-card p-5 shadow-[var(--shadow-soft)]">
          <h2 className="font-display text-xl font-light">Add a testimonial</h2>
          <div className="mt-4 grid gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium">Guest name</label>
              <input
                className={field}
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                placeholder="As the guest would like to be credited"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium">Testimonial</label>
              <textarea
                className={cn(field, "min-h-28 resize-y")}
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
                maxLength={600}
                placeholder="Paste the guest's own words"
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                {quote.trim().length < 10
                  ? `At least 10 characters required (${quote.trim().length}/10).`
                  : !name.trim()
                    ? "Guest name is required."
                    : "Saves as unpublished — publish it from the list below when ready."}
              </p>
            </div>
            <button
              onClick={() => add.mutate()}
              disabled={add.isPending || !name.trim() || quote.trim().length < 10}
              className="inline-flex w-fit items-center gap-2 rounded-lg bg-gold px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              {add.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" strokeWidth={1.5} />
              )}
              Save testimonial
            </button>
          </div>
        </section>
      )}

      {list.isError && (
        <p className="rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {(list.error as Error).message}
        </p>
      )}

      {list.isLoading && (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-secondary/50" />
          ))}
        </div>
      )}

      {!list.isLoading && rows.length === 0 && (
        <p className="rounded-xl border border-hairline bg-card px-4 py-10 text-center text-sm text-muted-foreground">
          No testimonials yet.
        </p>
      )}

      <div className="space-y-3">
        {rows.map((row) => (
          <article
            key={row.id}
            className="rounded-xl border border-hairline bg-card p-4 shadow-[var(--shadow-soft)]"
          >
            <div className="grid gap-3">
              <input
                className={field}
                defaultValue={row.guest_name}
                disabled={!canManage}
                onBlur={(e) =>
                  e.target.value.trim() &&
                  e.target.value !== row.guest_name &&
                  update.mutate({
                    id: row.id,
                    patch: { guest_name: e.target.value.trim() },
                  })
                }
              />
              <textarea
                className={cn(field, "min-h-24 resize-y")}
                defaultValue={row.quote}
                disabled={!canManage}
                onBlur={(e) =>
                  e.target.value.trim() &&
                  e.target.value !== row.quote &&
                  update.mutate({ id: row.id, patch: { quote: e.target.value.trim() } })
                }
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm">
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
                {row.is_published ? "Published" : "Unpublished"}
              </label>
              {canManage && (
                <div className="flex gap-1.5">
                  <button
                    aria-label="Move up"
                    onClick={() => reorder.mutate({ row, dir: -1 })}
                    className="rounded-lg border border-hairline p-2 hover:bg-secondary"
                  >
                    <ArrowUp className="size-3.5" />
                  </button>
                  <button
                    aria-label="Move down"
                    onClick={() => reorder.mutate({ row, dir: 1 })}
                    className="rounded-lg border border-hairline p-2 hover:bg-secondary"
                  >
                    <ArrowDown className="size-3.5" />
                  </button>
                  <button
                    aria-label="Delete"
                    onClick={() => {
                      if (confirm("Delete this testimonial?")) remove.mutate(row.id);
                    }}
                    className="rounded-lg border border-hairline p-2 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
