import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { settingsQuery } from "@/lib/admin/queries";
import { businessRules } from "@/lib/admin/constants";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { useAdminAuth, roleLabel } from "@/components/admin/AdminAuth";
import { site, paymentMethods } from "@/content/site";
import { assertWrite } from "@/lib/admin/write";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/settings")({
  component: SettingsPage,
});

const field =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-ring";

type Group = "property" | "booking" | "payments" | "notifications" | "account";

const groups: { id: Group; label: string }[] = [
  { id: "property", label: "Property" },
  { id: "booking", label: "Booking" },
  { id: "payments", label: "Payments" },
  { id: "notifications", label: "Notifications" },
  { id: "account", label: "Account" },
];

/** Defaults seed the form the first time a settings group is saved. */
const defaults: Record<Group, Record<string, string>> = {
  property: {
    name: site.name,
    address: `${site.address.street}, ${site.address.city}, ${site.address.country}`,
    email: site.email,
  },
  booking: {
    check_in_window: businessRules.checkInWindow,
    check_out_window: businessRules.checkOutWindow,
    currency: businessRules.currency,
  },
  payments: {
    mtn_name: paymentMethods[0].accountName,
    mtn_number: paymentMethods[0].number,
    airtel_name: paymentMethods[1].accountName,
    airtel_number: paymentMethods[1].number,
  },
  notifications: {
    enquiry_email: site.email,
    booking_alert_email: site.email,
  },
  account: {},
};

const labels: Record<string, string> = {
  name: "Property name",
  address: "Address",
  email: "Contact email",
  check_in_window: "Check-in window",
  check_out_window: "Check-out window",
  currency: "Currency symbol",
  mtn_name: "MTN Send Cash — account name",
  mtn_number: "MTN Send Cash — number",
  airtel_name: "Airtel Send Cash — account name",
  airtel_number: "Airtel Send Cash — number",
  enquiry_email: "Enquiries go to",
  booking_alert_email: "Booking alerts go to",
};

function SettingsPage() {
  const { canManage, email, fullName, primaryRole, roles } = useAdminAuth();
  const settings = useQuery(settingsQuery);
  const [tab, setTab] = useState<Group>("property");

  const stored = useMemo(() => {
    const map: Record<string, Record<string, string>> = {};
    for (const row of settings.data ?? []) {
      map[row.key] = (row.value ?? {}) as Record<string, string>;
    }
    return map;
  }, [settings.data]);

  return (
    <>
      <AdminPageHeader
        title="Settings"
        description="Property, booking, payment and notification configuration."
      />

      <div className="mb-5 flex flex-wrap gap-1.5">
        {groups.map((g) => (
          <button
            key={g.id}
            onClick={() => setTab(g.id)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs transition-colors",
              tab === g.id
                ? "border-transparent bg-foreground text-background"
                : "border-hairline text-muted-foreground hover:bg-secondary",
            )}
          >
            {g.label}
          </button>
        ))}
      </div>

      {settings.isError && (
        <p className="rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {(settings.error as Error).message}
        </p>
      )}

      {tab === "account" ? (
        <section className="max-w-xl rounded-xl border border-hairline bg-card p-5 shadow-[var(--shadow-soft)]">
          <h2 className="font-display text-xl font-light">Your account</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="Name" value={fullName ?? "—"} />
            <Row label="Email" value={email ?? "—"} />
            <Row
              label="Role"
              value={primaryRole ? roleLabel[primaryRole] : "No role assigned"}
            />
            <Row
              label="Permissions"
              value={
                canManage
                  ? "Can manage content, pricing and inventory"
                  : "Read-only for content, pricing and inventory"
              }
            />
            <Row label="All roles" value={roles.join(", ") || "—"} />
          </dl>
          <p className="mt-4 text-xs text-muted-foreground">
            Staff accounts and role assignments are managed by an administrator. There is
            no public registration.
          </p>
        </section>
      ) : (
        <SettingsGroupForm
          key={tab}
          group={tab}
          initial={{ ...defaults[tab], ...(stored[tab] ?? {}) }}
          canManage={canManage}
          persisted={Boolean(stored[tab])}
        />
      )}
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-hairline pb-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

function SettingsGroupForm({
  group,
  initial,
  canManage,
  persisted,
}: {
  group: Group;
  initial: Record<string, string>;
  canManage: boolean;
  persisted: boolean;
}) {
  const [values, setValues] = useState(initial);
  const queryClient = useQueryClient();

  const save = useMutation({
    mutationFn: async () => {
      assertWrite(
        await supabase
          .from("app_settings")
          .upsert({ key: group, value: values } as never, { onConflict: "key" })
          .select(),
        `Saving ${group} settings`,
      );
    },
    onSuccess: () => {
      toast.success("Settings saved");
      void queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });


  return (
    <section className="max-w-xl rounded-xl border border-hairline bg-card p-5 shadow-[var(--shadow-soft)]">
      <div className="grid gap-4">
        {Object.keys(initial).map((k) => (
          <div key={k}>
            <label className="mb-1.5 block text-xs font-medium">{labels[k] ?? k}</label>
            <input
              className={field}
              value={values[k] ?? ""}
              disabled={!canManage}
              onChange={(e) => setValues((v) => ({ ...v, [k]: e.target.value }))}
            />
          </div>
        ))}
      </div>

      {!persisted && (
        <p className="mt-4 text-xs text-muted-foreground">
          Showing the current values used by the website. Saving stores them in the
          database so they can be edited here from now on.
        </p>
      )}

      {canManage && (
        <button
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-gold px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {save.isPending && <Loader2 className="size-4 animate-spin" />}
          Save {group}
        </button>
      )}
    </section>
  );
}
