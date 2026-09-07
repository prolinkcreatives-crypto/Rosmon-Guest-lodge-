import { createFileRoute, Outlet, redirect, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { AdminAuthProvider } from "@/components/admin/AdminAuth";
import { AdminShell } from "@/components/admin/AdminShell";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Rosmon Admin — Front desk operations" },
      { name: "robots", content: "noindex, nofollow" },
      {
        name: "description",
        content: "Staff-only operations panel for Rosmon Guest Lodge.",
      },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/admin/login" });
    return { session: data.session };
  },
  component: AdminLayout,
  errorComponent: AdminError,
});

function AdminLayout() {
  const { session: initial } = Route.useRouteContext();
  const [session, setSession] = useState<Session | null>(initial);
  const router = useRouter();

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED")
        return;
      setSession(next);
      router.invalidate();
    });
    return () => data.subscription.unsubscribe();
  }, [router]);

  return (
    <AdminAuthProvider session={session}>
      <AdminShell>
        <Outlet />
      </AdminShell>
      <Toaster />
    </AdminAuthProvider>
  );
}

function AdminError({ error }: { error: Error }) {
  return (
    <div className="tone-admin flex min-h-screen items-center justify-center p-6">
      <div className="max-w-md rounded-2xl border border-hairline bg-card p-6 text-center">
        <h1 className="text-lg font-medium">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-5 rounded-lg bg-gold px-4 py-2 text-sm text-primary-foreground"
        >
          Reload
        </button>
      </div>
    </div>
  );
}
