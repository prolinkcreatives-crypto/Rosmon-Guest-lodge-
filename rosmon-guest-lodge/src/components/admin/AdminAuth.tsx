import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AdminRole = "admin" | "manager" | "receptionist";

interface AdminAuthValue {
  session: Session | null;
  email: string | null;
  fullName: string | null;
  roles: AdminRole[];
  primaryRole: AdminRole | null;
  /** Managers and admins may change content, pricing and inventory blocks. */
  canManage: boolean;
  loading: boolean;
}

const AdminAuthContext = createContext<AdminAuthValue>({
  session: null,
  email: null,
  fullName: null,
  roles: [],
  primaryRole: null,
  canManage: false,
  loading: true,
});

const rolePriority: AdminRole[] = ["admin", "manager", "receptionist"];

export function AdminAuthProvider({
  session,
  children,
}: {
  session: Session | null;
  children: ReactNode;
}) {
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [fullName, setFullName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const userId = session?.user.id;
    if (!userId) {
      setRoles([]);
      setFullName(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    void (async () => {
      const [{ data: roleRows }, { data: profile }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", userId),
        supabase
          .from("staff_profiles")
          .select("full_name")
          .eq("id", userId)
          .maybeSingle(),
      ]);
      if (cancelled) return;
      setRoles(((roleRows ?? []) as { role: AdminRole }[]).map((r) => r.role));
      setFullName((profile as { full_name: string | null } | null)?.full_name ?? null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.user.id]);

  const primaryRole = rolePriority.find((r) => roles.includes(r)) ?? null;

  return (
    <AdminAuthContext.Provider
      value={{
        session,
        email: session?.user.email ?? null,
        fullName,
        roles,
        primaryRole,
        canManage: roles.includes("admin") || roles.includes("manager"),
        loading,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export const useAdminAuth = () => useContext(AdminAuthContext);

export const roleLabel: Record<AdminRole, string> = {
  admin: "Administrator",
  manager: "Manager",
  receptionist: "Receptionist",
};
