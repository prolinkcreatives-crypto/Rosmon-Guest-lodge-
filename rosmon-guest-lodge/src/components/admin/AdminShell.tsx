import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  BedDouble,
  Images,
  MessageSquareQuote,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui-kit/Logo";
import { useAdminAuth, roleLabel } from "./AdminAuth";

const nav: {
  to:
    | "/admin"
    | "/admin/bookings"
    | "/admin/calendar"
    | "/admin/rooms"
    | "/admin/gallery"
    | "/admin/testimonials"
    | "/admin/settings";
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
}[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/bookings", label: "Bookings", icon: ClipboardList },
  { to: "/admin/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/admin/rooms", label: "Rooms & inventory", icon: BedDouble },
  { to: "/admin/gallery", label: "Gallery", icon: Images },
  { to: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { email, fullName, primaryRole } = useAdminAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/admin/login", replace: true });
  }

  const sidebar = (
    <div className="flex h-full flex-col gap-6 p-4">
      <Link to="/admin" className="px-1 py-2" onClick={() => setOpen(false)}>
        <Logo />
      </Link>

      <nav className="flex-1">
        <ul className="space-y-1">
          {nav.map((item) => {
            const active = item.exact
              ? pathname === item.to
              : pathname.startsWith(item.to);
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-200",
                    active
                      ? "bg-card text-foreground shadow-[var(--shadow-soft)]"
                      : "text-muted-foreground hover:bg-card/70 hover:text-foreground",
                  )}
                >
                  <item.icon
                    className={cn("size-4", active && "text-gold")}
                    strokeWidth={1.5}
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="rounded-xl border border-hairline bg-card p-3">
        <p className="truncate text-sm font-medium">{fullName ?? "Rosmon staff"}</p>
        <p className="truncate text-xs text-muted-foreground">{email}</p>
        {primaryRole && (
          <p className="mt-1 text-[0.625rem] tracking-[0.14em] text-gold uppercase">
            {roleLabel[primaryRole]}
          </p>
        )}
        <button
          onClick={signOut}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-hairline px-3 py-2 text-xs transition-colors hover:bg-secondary"
        >
          <LogOut className="size-3.5" strokeWidth={1.5} />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="tone-admin min-h-screen">
      {/* Mobile bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-hairline bg-glass-strong px-4 py-3 backdrop-blur lg:hidden">
        <Logo showWordmark={false} />
        <span className="text-sm font-medium">Rosmon Admin</span>
        <button
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg border border-hairline p-2"
        >
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85%] border-r border-hairline bg-background">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:flex">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-hairline bg-secondary/40 lg:block">
          {sidebar}
        </aside>
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-light tracking-[-0.01em] sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
