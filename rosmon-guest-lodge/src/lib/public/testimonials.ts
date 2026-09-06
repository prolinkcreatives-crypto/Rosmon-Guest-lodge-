import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PublicTestimonial {
  id: string;
  guestName: string;
  quote: string;
}

interface TestimonialRow {
  id: string;
  guest_name: string;
  quote: string;
}

/**
 * Published testimonials only, in admin's chosen order. Requires no new
 * migration — "Public read published testimonials" (FOR SELECT TO anon
 * USING (is_published)) already existed; the public site simply never
 * queried it and showed static skeleton placeholders instead.
 */
export const publicTestimonialsQuery = queryOptions({
  queryKey: ["public", "testimonials"],
  queryFn: async (): Promise<PublicTestimonial[]> => {
    const { data, error } = (await supabase
      .from("testimonials")
      .select("id, guest_name, quote")
      .eq("is_published", true)
      .order("sort_order")
      .order("created_at")) as unknown as {
      data: TestimonialRow[] | null;
      error: { message: string } | null;
    };
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({ id: r.id, guestName: r.guest_name, quote: r.quote }));
  },
  staleTime: 30_000,
});
