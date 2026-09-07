import { useId, useState } from "react";
import { CalendarDays, Users, ArrowRight } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { RosmonButton } from "@/components/ui-kit/RosmonButton";
import { roomTypes } from "@/content/rooms";
import { todayIso, minCheckout, reconcileCheckout } from "@/lib/date-range";
import { cn } from "@/lib/utils";

export interface AvailabilityQuery {
  checkIn: string;
  checkOut: string;
  guests: number;
}

/**
 * Search entry point. It only captures a query and hands the visitor to the
 * dedicated /book flow — no inventory or pricing logic lives here.
 */
export function AvailabilityPanel({ className }: { className?: string }) {
  const uid = useId();
  const navigate = useNavigate();
  const [query, setQuery] = useState<AvailabilityQuery>({
    checkIn: "",
    checkOut: "",
    guests: 2,
  });

  const maxGuests = Math.max(...roomTypes.map((r) => r.maxGuests));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        navigate({
          to: "/book",
          search: {
            ...(query.checkIn ? { checkIn: query.checkIn } : {}),
            ...(query.checkOut ? { checkOut: query.checkOut } : {}),
            guests: query.guests,
          },
        });
      }}
      className={cn("glass-strong lift rounded-4xl p-3 sm:p-4", className)}
    >
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_0.8fr_auto]">
        <Field
          id={`${uid}-in`}
          label="Check-in"
          icon={<CalendarDays className="size-4" strokeWidth={1.25} />}
        >
          <input
            id={`${uid}-in`}
            type="date"
            min={todayIso()}
            value={query.checkIn}
            onChange={(e) => {
              const checkIn = e.target.value;
              setQuery((q) => ({
                ...q,
                checkIn,
                checkOut: reconcileCheckout(checkIn, q.checkOut),
              }));
            }}
            className="w-full bg-transparent text-sm text-foreground outline-none"
          />
        </Field>

        <Field
          id={`${uid}-out`}
          label="Check-out"
          icon={<CalendarDays className="size-4" strokeWidth={1.25} />}
        >
          <input
            id={`${uid}-out`}
            type="date"
            value={query.checkOut}
            min={minCheckout(query.checkIn)}
            onChange={(e) => setQuery((q) => ({ ...q, checkOut: e.target.value }))}
            className="w-full bg-transparent text-sm text-foreground outline-none"
          />
        </Field>

        <Field
          id={`${uid}-guests`}
          label="Guests"
          icon={<Users className="size-4" strokeWidth={1.25} />}
        >
          <select
            id={`${uid}-guests`}
            value={query.guests}
            onChange={(e) =>
              setQuery((q) => ({ ...q, guests: Number(e.target.value) }))
            }
            className="w-full appearance-none bg-transparent text-sm text-foreground outline-none"
          >
            {Array.from({ length: maxGuests }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n} className="bg-card text-foreground">
                {n} {n === 1 ? "guest" : "guests"}
              </option>
            ))}
          </select>
        </Field>

        <RosmonButton type="submit" size="lg" className="w-full rounded-3xl lg:w-auto">
          Check Availability
          <ArrowRight className="size-4" strokeWidth={1.5} />
        </RosmonButton>
      </div>
    </form>
  );
}

export function Field({
  id,
  label,
  icon,
  children,
}: {
  id: string;
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={id}
      className="group flex min-w-0 items-center gap-3 rounded-3xl border border-hairline bg-[var(--hover-wash)] px-4 py-3 transition-colors duration-300 focus-within:border-gold/40 hover:border-gold/25"
    >
      {icon && <span className="shrink-0 text-gold">{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="eyebrow block text-[0.5625rem]">{label}</span>
        <span className="mt-1 block">{children}</span>
      </span>
    </label>
  );
}
