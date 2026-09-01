import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  inventoryBlocksQuery,
  roomTypesQuery,
  roomUnitsQuery,
  unitStatusLabel,
  unitStatusOn,
  unitStatusTone,
  unitStatuses,
  type BookingRow,
  type InventoryBlockRow,
  type RoomTypeRow,
  type RoomUnitRow,
  type UnitStatus,
} from "@/lib/admin/queries";
import { bookingsQuery } from "@/lib/admin/queries";
import { businessRules, formatMoney } from "@/lib/admin/constants";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { useAdminAuth } from "@/components/admin/AdminAuth";
import { assertWrite } from "@/lib/admin/write";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/rooms")({
  component: RoomsPage,
});

const field =
  "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-ring";

const iso = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (date: string, n: number) => {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + n);
  return iso(d);
};

function RoomsPage() {
  const { canManage } = useAdminAuth();
  const roomTypes = useQuery(roomTypesQuery);
  const units = useQuery(roomUnitsQuery);
  const bookings = useQuery(bookingsQuery);
  const blocks = useQuery(inventoryBlocksQuery);
  const [date, setDate] = useState(iso(new Date()));

  const activeUnits = (units.data ?? []).filter((u) => u.is_active);
  const statuses = activeUnits.map((unit) => ({
    unit,
    ...unitStatusOn({
      unit,
      bookings: bookings.data ?? [],
      blocks: blocks.data ?? [],
      date,
    }),
  }));

  const counts = unitStatuses.reduce(
    (acc, s) => {
      acc[s] = statuses.filter((x) => x.status === s).length;
      return acc;
    },
    {} as Record<UnitStatus, number>,
  );

  const loading = units.isLoading || bookings.isLoading || blocks.isLoading;
  const error = (units.error ?? bookings.error ?? blocks.error ?? roomTypes.error) as
    | Error
    | null;

  return (
    <>
      <AdminPageHeader
        title="Rooms & inventory"
        description={`Check-in ${businessRules.checkInWindow} · Check-out ${businessRules.checkOutWindow}`}
        actions={
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Status on</span>
            <input
              type="date"
              className={cn(field, "w-auto")}
              value={date}
              onChange={(e) => setDate(e.target.value || iso(new Date()))}
            />
          </label>
        }
      />

      {error && (
        <p className="mb-4 rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error.message}
        </p>
      )}

      {!canManage && (
        <p className="mb-4 rounded-xl border border-hairline bg-secondary/50 px-4 py-3 text-sm text-muted-foreground">
          Your role can view pricing and inventory. Changes require a manager or
          administrator.
        </p>
      )}

      {/* Occupancy overview — derived from live bookings and blocks */}
      <section className="mb-8">
        <h2 className="mb-3 text-xs tracking-[0.14em] text-muted-foreground uppercase">
          Occupancy overview
        </h2>
        {loading ? (
          <div className="h-20 animate-pulse rounded-xl bg-secondary/50" />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
            <Stat label="Total inventory" value={activeUnits.length} />
            {unitStatuses.map((s) => (
              <Stat key={s} label={unitStatusLabel[s]} value={counts[s]} tone={s} />
            ))}
          </div>
        )}
      </section>

      {/* Pricing */}
      <section className="mb-8">
        <h2 className="mb-3 text-xs tracking-[0.14em] text-muted-foreground uppercase">
          Pricing & room types
        </h2>
        {roomTypes.isLoading ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-64 animate-pulse rounded-xl bg-secondary/50" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {(roomTypes.data ?? []).map((room) => (
              <RoomCard key={room.id} room={room} canManage={canManage} />
            ))}
          </div>
        )}
      </section>

      {/* Internal inventory units */}
      <section className="mb-8">
        <h2 className="mb-1 text-xs tracking-[0.14em] text-muted-foreground uppercase">
          Internal inventory units
        </h2>
        <p className="mb-3 text-xs text-muted-foreground">
          Unit identifiers are staff-only and never shown on the public website.
        </p>
        {loading ? (
          <div className="h-40 animate-pulse rounded-xl bg-secondary/50" />
        ) : (
          <div className="space-y-5">
            {(roomTypes.data ?? []).map((room) => {
              const rows = statuses.filter((s) => s.unit.room_type_id === room.id);
              if (rows.length === 0) return null;
              return (
                <div key={room.id}>
                  <p className="mb-2 text-sm font-medium">
                    {room.name}{" "}
                    <span className="text-muted-foreground">
                      · {rows.length} units
                    </span>
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {rows.map(({ unit, status, booking, block }) => (
                      <UnitCard
                        key={unit.id}
                        unit={unit}
                        status={status}
                        booking={booking}
                        block={block}
                        date={date}
                        canManage={canManage}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <BlocksSection canManage={canManage} />
    </>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: UnitStatus;
}) {
  return (
    <div className="rounded-xl border border-hairline bg-card p-3 shadow-[var(--shadow-soft)]">
      <p
        className={cn(
          "font-display text-2xl font-light",
          tone ? "" : "text-gold",
        )}
      >
        {value}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

/**
 * A unit's status is fully derived from inventory_blocks + bookings
 * (see unitStatusOn) and never from room_units.is_active — that column
 * only means "this physical unit still exists in the system," so a unit
 * can correctly be active AND under maintenance at once. Previously the
 * only way to affect that derived status was the separate "Inventory
 * blocks" form below, disconnected from this card. This adds the direct
 * action staff expect: mark/clear maintenance for the unit on the date
 * currently being viewed.
 */
function UnitCard({
  unit,
  status,
  booking,
  block,
  date,
  canManage,
}: {
  unit: RoomUnitRow;
  status: UnitStatus;
  booking?: BookingRow;
  block?: InventoryBlockRow;
  date: string;
  canManage: boolean;
}) {
  const queryClient = useQueryClient();
  // Only a block scoped to exactly this unit is safe to toggle from here —
  // a room-type-wide block (room_unit_id null) can cover this unit without
  // belonging to it, and clearing it here would silently affect every other
  // unit of that type. Those remain manageable only from Inventory blocks.
  const unitBlock = block && block.room_unit_id === unit.id ? block : undefined;

  const toggle = useMutation({
    mutationFn: async () => {
      if (unitBlock) {
        assertWrite(
          await supabase.from("inventory_blocks").delete().eq("id", unitBlock.id).select(),
          "Clearing maintenance",
        );
        return;
      }
      assertWrite(
        await supabase
          .from("inventory_blocks")
          .insert({
            room_unit_id: unit.id,
            room_type_id: null,
            start_date: date,
            end_date: addDays(date, 1),
            kind: "maintenance",
            reason: null,
          } as never)
          .select(),
        "Marking unit under maintenance",
      );
    },
    onSuccess: () => {
      toast.success(
        unitBlock
          ? `${unit.internal_label} cleared for ${date}`
          : `${unit.internal_label} marked under maintenance for ${date}`,
      );
      void queryClient.invalidateQueries({ queryKey: ["admin", "inventory-blocks"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="rounded-xl border border-hairline bg-card p-3 shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-sm">{unit.internal_label}</span>
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 text-[0.6875rem]",
            unitStatusTone[status],
          )}
        >
          {unitStatusLabel[status]}
        </span>
      </div>
      <p className="mt-1.5 truncate text-xs text-muted-foreground">
        {booking
          ? `${booking.guest_name} · ${booking.reference}`
          : block
            ? (block.reason ?? block.kind)
            : "No allocation"}
      </p>
      {canManage && (!block || unitBlock) && (
        <button
          onClick={() => toggle.mutate()}
          disabled={toggle.isPending}
          className="mt-2 text-[0.6875rem] text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground disabled:opacity-60"
        >
          {toggle.isPending
            ? "Saving…"
            : unitBlock
              ? `Clear ${unitBlock.kind === "maintenance" ? "maintenance" : "block"}`
              : `Mark maintenance for ${date}`}
        </button>
      )}
    </div>
  );
}

function RoomCard({ room, canManage }: { room: RoomTypeRow; canManage: boolean }) {
  const queryClient = useQueryClient();
  const [price, setPrice] = useState(String(room.price_per_night));
  const [maxGuests, setMaxGuests] = useState(String(room.max_guests));
  const [active, setActive] = useState(room.is_active);

  const save = useMutation({
    mutationFn: async () => {
      const nextPrice = Number(price);
      const nextGuests = Number(maxGuests);
      if (!Number.isFinite(nextPrice) || nextPrice <= 0) {
        throw new Error("Enter a rate greater than zero");
      }
      if (!Number.isInteger(nextGuests) || nextGuests < 1) {
        throw new Error("Max guests must be at least 1");
      }
      assertWrite(
        await supabase
          .from("room_types")
          .update({
            price_per_night: nextPrice,
            max_guests: nextGuests,
            is_active: active,
          } as never)
          .eq("id", room.id)
          .select(),
        `Updating ${room.name}`,
      );
    },
    onSuccess: () => {
      toast.success(`${room.name} updated`);
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });


  return (
    <section className="rounded-xl border border-hairline bg-card p-5 shadow-[var(--shadow-soft)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-2xl font-light">{room.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{room.descriptor}</p>
        </div>
        <span className="font-display text-xl text-gold">
          {formatMoney(room.price_per_night)}
        </span>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium">Rate per night (K)</label>
          <input
            type="number"
            min={0}
            className={field}
            value={price}
            disabled={!canManage}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium">Max guests</label>
          <input
            type="number"
            min={1}
            className={field}
            value={maxGuests}
            disabled={!canManage}
            onChange={(e) => setMaxGuests(e.target.value)}
          />
        </div>
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={active}
          disabled={!canManage}
          onChange={(e) => setActive(e.target.checked)}
          className="size-4 accent-[var(--gold)]"
        />
        Bookable
      </label>

      <ul className="mt-4 flex flex-wrap gap-1.5">
        {room.amenities.map((a) => (
          <li
            key={a}
            className="rounded-full border border-hairline px-2.5 py-1 text-xs text-muted-foreground"
          >
            {a}
          </li>
        ))}
      </ul>

      {canManage && (
        <button
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-gold px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {save.isPending && <Loader2 className="size-4 animate-spin" />}
          Save changes
        </button>
      )}
    </section>
  );
}

const blockKinds = [
  { id: "maintenance", label: "Maintenance" },
  { id: "private_use", label: "Private use" },
  { id: "closure", label: "Temporary closure" },
  { id: "block", label: "Other block" },
] as const;

function BlocksSection({ canManage }: { canManage: boolean }) {
  const queryClient = useQueryClient();
  const units = useQuery(roomUnitsQuery);
  const roomTypes = useQuery(roomTypesQuery);
  const blocks = useQuery(inventoryBlocksQuery);

  const today = iso(new Date());
  const [scope, setScope] = useState("");
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(addDays(today, 1));
  const [kind, setKind] = useState<string>("maintenance");
  const [reason, setReason] = useState("");

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "inventory-blocks"] });

  const create = useMutation({
    mutationFn: async () => {
      if (!scope) throw new Error("Choose a unit or a room type");
      if (end <= start) throw new Error("End date must be after the start date");
      const isType = scope.startsWith("type:");
      assertWrite(
        await supabase
          .from("inventory_blocks")
          .insert({
            room_unit_id: isType ? null : scope.replace("unit:", ""),
            room_type_id: isType ? scope.replace("type:", "") : null,
            start_date: start,
            end_date: end,
            kind,
            reason: reason.trim() || null,
          } as never)
          .select(),
        "Creating inventory block",
      );
    },
    onSuccess: () => {
      toast.success("Inventory block created");
      setReason("");
      void refresh();
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      assertWrite(
        await supabase.from("inventory_blocks").delete().eq("id", id).select(),
        "Removing inventory block",
      );
    },
    onSuccess: () => {
      toast.success("Block removed");
      void refresh();
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const unitLabel = (id: string | null) =>
    units.data?.find((u) => u.id === id)?.internal_label ?? null;
  const typeName = (id: string | null) =>
    roomTypes.data?.find((r) => r.id === id)?.name ?? null;

  return (
    <section className="mb-4">
      <h2 className="mb-1 text-xs tracking-[0.14em] text-muted-foreground uppercase">
        Inventory blocks
      </h2>
      <p className="mb-3 text-xs text-muted-foreground">
        Blocks remove inventory from sale. They will feed the availability engine in a
        later milestone.
      </p>

      {canManage && (
        <div className="mb-4 rounded-xl border border-hairline bg-card p-4 shadow-[var(--shadow-soft)]">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="sm:col-span-2 xl:col-span-1">
              <label className="mb-1.5 block text-xs font-medium">Room / unit</label>
              <select
                className={field}
                value={scope}
                onChange={(e) => setScope(e.target.value)}
              >
                <option value="">Select…</option>
                {(roomTypes.data ?? []).map((r) => (
                  <option key={r.id} value={`type:${r.id}`}>
                    All {r.name}
                  </option>
                ))}
                {(units.data ?? []).map((u) => (
                  <option key={u.id} value={`unit:${u.id}`}>
                    {u.internal_label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium">Start</label>
              <input
                type="date"
                className={field}
                value={start}
                onChange={(e) => {
                  const value = e.target.value;
                  setStart(value);
                  setEnd((prev) => (prev <= value ? addDays(value, 1) : prev));
                }}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium">End</label>
              <input
                type="date"
                className={field}
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
              <p className="mt-1 text-[0.6875rem] text-muted-foreground">
                Unit is free again on this date.
              </p>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium">Reason type</label>
              <select
                className={field}
                value={kind}
                onChange={(e) => setKind(e.target.value)}
              >
                {blockKinds.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium">Note</label>
              <input
                className={field}
                value={reason}
                maxLength={140}
                placeholder="Optional detail"
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>
          <button
            onClick={() => create.mutate()}
            disabled={create.isPending}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gold px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {create.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" strokeWidth={1.5} />
            )}
            Save block
          </button>
        </div>
      )}

      {blocks.isLoading ? (
        <div className="h-24 animate-pulse rounded-xl bg-secondary/50" />
      ) : (blocks.data ?? []).length === 0 ? (
        <p className="rounded-xl border border-hairline bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          No inventory blocks.
        </p>
      ) : (
        <ul className="space-y-2">
          {(blocks.data ?? []).map((b) => (
            <li
              key={b.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-hairline bg-card p-3 shadow-[var(--shadow-soft)]"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {unitLabel(b.room_unit_id) ??
                    (typeName(b.room_type_id)
                      ? `All ${typeName(b.room_type_id)}`
                      : "Unknown")}{" "}
                  <span className="text-muted-foreground">
                    · {blockKinds.find((k) => k.id === b.kind)?.label ?? b.kind}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {b.start_date} → {b.end_date}
                  {b.reason ? ` · ${b.reason}` : ""}
                </p>
              </div>
              {canManage && (
                <button
                  aria-label="Remove block"
                  onClick={() => remove.mutate(b.id)}
                  className="rounded-lg border border-hairline p-2 text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
