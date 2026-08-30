import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  CalendarDays,
  Users,
  Check,
  Clock,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { RosmonButton } from "@/components/ui-kit/RosmonButton";
import { Field } from "./AvailabilityPanel";
import { roomTypes, type RoomType } from "@/content/rooms";
import { paymentMethods, site, type PaymentMethodId } from "@/content/site";
import { cn } from "@/lib/utils";

const steps = ["Dates", "Room", "Details", "Payment", "Confirmation"] as const;
type StepIndex = 0 | 1 | 2 | 3 | 4;

interface Search {
  room?: RoomType["slug"] | undefined;
  checkIn?: string | undefined;
  checkOut?: string | undefined;
  guests?: number | undefined;
}

interface Guest {
  name: string;
  phone: string;
  email: string;
  guests: number;
  request: string;
}

function nightsBetween(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut) return 0;
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return ms > 0 ? Math.round(ms / 86_400_000) : 0;
}

function formatDate(value: string) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function BookingFlow({ search }: { search: Search }) {
  const [step, setStep] = useState<StepIndex>(search.room ? 1 : 0);
  const [dates, setDates] = useState({
    checkIn: search.checkIn ?? "",
    checkOut: search.checkOut ?? "",
    guests: search.guests ?? 2,
  });
  const [searched, setSearched] = useState(
    Boolean(search.checkIn && search.checkOut),
  );
  const [roomSlug, setRoomSlug] = useState<RoomType["slug"] | null>(
    search.room ?? null,
  );
  const [guest, setGuest] = useState<Guest>({
    name: "",
    phone: "",
    email: "",
    guests: search.guests ?? 2,
    request: "",
  });
  const [method, setMethod] = useState<PaymentMethodId | null>(null);
  const [reference, setReference] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const room = useMemo(
    () => roomTypes.find((r) => r.slug === roomSlug) ?? null,
    [roomSlug],
  );
  const nights = nightsBetween(dates.checkIn, dates.checkOut);
  const total = room ? room.pricePerNight * Math.max(nights, 1) : 0;
  const bookingRef = useMemo(
    () => `RGL-${String(Math.floor(Math.random() * 90000) + 10000)}`,
    [],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      <div>
        <Progress step={step} />

        <div className="surface mt-6 rounded-4xl p-5 sm:p-8">
          {step === 0 && (
            <StepDates
              dates={dates}
              setDates={setDates}
              onSearch={() => {
                setSearched(true);
                setStep(1);
              }}
            />
          )}

          {step === 1 && (
            <StepRooms
              searched={searched}
              nights={nights}
              selected={roomSlug}
              onSelect={(slug) => {
                setRoomSlug(slug);
                setStep(2);
              }}
              onBack={() => setStep(0)}
            />
          )}

          {step === 2 && room && (
            <StepDetails
              room={room}
              guest={guest}
              setGuest={setGuest}
              onBack={() => setStep(1)}
              onContinue={() => setStep(3)}
            />
          )}

          {step === 3 && room && !submitted && (
            <StepPayment
              method={method}
              setMethod={setMethod}
              reference={reference}
              setReference={setReference}
              total={total}
              onBack={() => setStep(2)}
              onSubmit={() => {
                setSubmitted(true);
                setStep(4);
              }}
            />
          )}

          {step === 4 && room && (
            <StepConfirmation
              confirmed={confirmed}
              onSimulateConfirm={() => setConfirmed(true)}
              bookingRef={bookingRef}
              room={room}
              dates={dates}
              nights={nights}
              guest={guest}
              method={method}
              reference={reference}
              total={total}
            />
          )}
        </div>
      </div>

      <Summary
        room={room}
        dates={dates}
        nights={nights}
        total={total}
        guests={guest.guests}
      />
    </div>
  );
}

/* ---------------------------------------------------------------- pieces */

function Progress({ step }: { step: number }) {
  return (
    <ol className="glass flex flex-wrap items-center gap-x-3 gap-y-2 rounded-full px-4 py-3 sm:px-5">
      {steps.map((label, i) => (
        <li key={label} className="flex items-center gap-3">
          <span
            className={cn(
              "flex items-center gap-2 text-[0.6875rem] tracking-[0.16em] uppercase transition-colors duration-500",
              i === step
                ? "text-gold"
                : i < step
                  ? "text-foreground/70"
                  : "text-muted-foreground/60",
            )}
          >
            <span
              className={cn(
                "grid size-5 place-items-center rounded-full border text-[0.625rem] transition-colors duration-500",
                i === step
                  ? "border-gold/60 text-gold"
                  : i < step
                    ? "border-gold/40 bg-gold/15 text-gold"
                    : "border-hairline",
              )}
            >
              {i < step ? <Check className="size-3" strokeWidth={2} /> : i + 1}
            </span>
            {label}
          </span>
          {i < steps.length - 1 && (
            <span aria-hidden="true" className="h-px w-4 bg-[var(--hairline)]" />
          )}
        </li>
      ))}
    </ol>
  );
}

function StepHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <span className="eyebrow text-gold">{eyebrow}</span>
      <h2 className="mt-3 font-display text-3xl leading-none font-light tracking-[-0.01em] sm:text-4xl">
        {title}
      </h2>
    </div>
  );
}

function StepDates({
  dates,
  setDates,
  onSearch,
}: {
  dates: { checkIn: string; checkOut: string; guests: number };
  setDates: (v: { checkIn: string; checkOut: string; guests: number }) => void;
  onSearch: () => void;
}) {
  const maxGuests = Math.max(...roomTypes.map((r) => r.maxGuests));
  return (
    <form
      className="animate-fade-in"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch();
      }}
    >
      <StepHeading eyebrow="Step 1 — Search" title="When are you staying?" />

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <Field
          id="book-in"
          label="Check-in"
          icon={<CalendarDays className="size-4" strokeWidth={1.25} />}
        >
          <input
            id="book-in"
            type="date"
            required
            value={dates.checkIn}
            onChange={(e) => setDates({ ...dates, checkIn: e.target.value })}
            className="w-full bg-transparent text-sm outline-none"
          />
        </Field>
        <Field
          id="book-out"
          label="Check-out"
          icon={<CalendarDays className="size-4" strokeWidth={1.25} />}
        >
          <input
            id="book-out"
            type="date"
            required
            min={dates.checkIn || undefined}
            value={dates.checkOut}
            onChange={(e) => setDates({ ...dates, checkOut: e.target.value })}
            className="w-full bg-transparent text-sm outline-none"
          />
        </Field>
        <Field
          id="book-guests"
          label="Guests"
          icon={<Users className="size-4" strokeWidth={1.25} />}
        >
          <select
            id="book-guests"
            value={dates.guests}
            onChange={(e) => setDates({ ...dates, guests: Number(e.target.value) })}
            className="w-full appearance-none bg-transparent text-sm outline-none"
          >
            {Array.from({ length: maxGuests }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n} className="bg-card text-foreground">
                {n} {n === 1 ? "guest" : "guests"}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
        Searching shows room categories for your dates. Live availability is
        connected in a later stage — nothing is reserved at this point.
      </p>

      <RosmonButton type="submit" size="lg" className="mt-7 w-full sm:w-auto">
        Check Availability
        <ArrowRight className="size-4" strokeWidth={1.5} />
      </RosmonButton>
    </form>
  );
}

function StepRooms({
  searched,
  nights,
  selected,
  onSelect,
  onBack,
}: {
  searched: boolean;
  nights: number;
  selected: RoomType["slug"] | null;
  onSelect: (slug: RoomType["slug"]) => void;
  onBack: () => void;
}) {
  return (
    <div className="animate-fade-in">
      <StepHeading eyebrow="Step 2 — Available rooms" title="Choose your room" />

      {!searched && (
        <p className="mt-5 text-sm text-muted-foreground">
          Availability shown below is indicative until dates are searched.
        </p>
      )}

      <div className="mt-8 grid gap-3">
        {roomTypes.map((room) => {
          // Placeholder availability. Real inventory arrives in a later stage.
          const available = room.units > 0;
          return (
            <div
              key={room.id}
              className={cn(
                "grid gap-4 rounded-3xl border p-4 transition-colors duration-500 sm:grid-cols-[7rem_minmax(0,1fr)_auto] sm:items-center sm:p-5",
                selected === room.slug ? "border-gold/45" : "border-hairline",
              )}
            >
              <img
                src={room.image}
                alt={`${room.name} room`}
                loading="lazy"
                className="h-24 w-full rounded-2xl object-cover sm:h-20"
              />
              <div className="min-w-0">
                <h3 className="font-display text-2xl font-light">{room.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {site.currency}
                  {room.pricePerNight} / night · up to {room.maxGuests} guests
                </p>
                <p
                  className={cn(
                    "mt-2 text-[0.6875rem] tracking-[0.18em] uppercase",
                    available ? "text-gold" : "text-muted-foreground",
                  )}
                >
                  {available ? "Available" : "Unavailable for these dates"}
                </p>
              </div>
              <RosmonButton
                variant={available ? "gold" : "glass"}
                disabled={!available}
                onClick={() => onSelect(room.slug)}
                className="w-full sm:w-auto"
              >
                Select Room
              </RosmonButton>
            </div>
          );
        })}
      </div>

      {nights > 0 && (
        <p className="mt-5 text-xs text-muted-foreground">
          {nights} {nights === 1 ? "night" : "nights"} selected.
        </p>
      )}

      <button
        onClick={onBack}
        className="mt-7 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors duration-300 hover:text-gold"
      >
        <ArrowLeft className="size-4" strokeWidth={1.25} /> Change dates
      </button>
    </div>
  );
}

function StepDetails({
  room,
  guest,
  setGuest,
  onBack,
  onContinue,
}: {
  room: RoomType;
  guest: Guest;
  setGuest: (g: Guest) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <form
      className="animate-fade-in"
      onSubmit={(e) => {
        e.preventDefault();
        onContinue();
      }}
    >
      <StepHeading eyebrow="Step 3 — Guest details" title="Who is staying?" />

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <Field id="g-name" label="Full name">
          <input
            id="g-name"
            required
            value={guest.name}
            onChange={(e) => setGuest({ ...guest, name: e.target.value })}
            className="w-full bg-transparent text-sm outline-none"
            placeholder="Your name"
          />
        </Field>
        <Field id="g-phone" label="Phone number">
          <input
            id="g-phone"
            required
            type="tel"
            value={guest.phone}
            onChange={(e) => setGuest({ ...guest, phone: e.target.value })}
            className="w-full bg-transparent text-sm outline-none"
            placeholder="09xx xxx xxx"
          />
        </Field>
        <Field id="g-email" label="Email">
          <input
            id="g-email"
            required
            type="email"
            value={guest.email}
            onChange={(e) => setGuest({ ...guest, email: e.target.value })}
            className="w-full bg-transparent text-sm outline-none"
            placeholder="you@example.com"
          />
        </Field>
        <Field id="g-count" label="Number of guests">
          <select
            id="g-count"
            value={guest.guests}
            onChange={(e) => setGuest({ ...guest, guests: Number(e.target.value) })}
            className="w-full appearance-none bg-transparent text-sm outline-none"
          >
            {Array.from({ length: room.maxGuests }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n} className="bg-card text-foreground">
                {n} {n === 1 ? "guest" : "guests"}
              </option>
            ))}
          </select>
        </Field>
        <div className="sm:col-span-2">
          <Field id="g-request" label="Special request (optional)">
            <textarea
              id="g-request"
              rows={3}
              value={guest.request}
              onChange={(e) => setGuest({ ...guest, request: e.target.value })}
              className="w-full resize-none bg-transparent text-sm outline-none"
              placeholder="Late arrival, quiet room, anything else"
            />
          </Field>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <RosmonButton type="submit" size="lg">
          Continue to Payment
          <ArrowRight className="size-4" strokeWidth={1.5} />
        </RosmonButton>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors duration-300 hover:text-gold"
        >
          <ArrowLeft className="size-4" strokeWidth={1.25} /> Back to rooms
        </button>
      </div>
    </form>
  );
}

function StepPayment({
  method,
  setMethod,
  reference,
  setReference,
  total,
  onBack,
  onSubmit,
}: {
  method: PaymentMethodId | null;
  setMethod: (m: PaymentMethodId) => void;
  reference: string;
  setReference: (v: string) => void;
  total: number;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const chosen = paymentMethods.find((m) => m.id === method);
  return (
    <form
      className="animate-fade-in"
      onSubmit={(e) => {
        e.preventDefault();
        if (method && reference.trim()) onSubmit();
      }}
    >
      <StepHeading eyebrow="Step 4 — Payment" title="Pay by mobile money" />

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {paymentMethods.map((m) => (
          <button
            type="button"
            key={m.id}
            onClick={() => setMethod(m.id)}
            className={cn(
              "rounded-3xl border p-5 text-left transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
              method === m.id
                ? "border-gold/50 bg-gold/[0.07]"
                : "border-hairline hover:border-gold/25",
            )}
          >
            <span className="flex items-center gap-2 text-gold">
              <Smartphone className="size-4" strokeWidth={1.25} />
              <span className="text-[0.6875rem] tracking-[0.18em] uppercase">
                {m.network}
              </span>
            </span>
            <span className="mt-3 block font-display text-2xl font-light">
              {m.number}
            </span>
            <span className="mt-1 block text-sm text-muted-foreground">
              {m.accountName}
            </span>
          </button>
        ))}
      </div>

      {chosen && (
        <p className="animate-fade-in mt-6 rounded-3xl border border-hairline p-5 text-sm leading-relaxed text-muted-foreground">
          Send {site.currency}
          {total.toLocaleString()} using {chosen.network} to{" "}
          <span className="text-gold">{chosen.number}</span> ({chosen.accountName}),
          then enter the transaction reference below. Rosmon verifies every payment
          manually — it is not confirmed automatically.
        </p>
      )}

      <div className="mt-4">
        <Field id="p-ref" label="Payment / transaction reference">
          <input
            id="p-ref"
            required
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            className="w-full bg-transparent text-sm outline-none"
            placeholder="e.g. MP260824.1432.A12345"
          />
        </Field>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <RosmonButton type="submit" size="lg" disabled={!method || !reference.trim()}>
          Submit Payment
        </RosmonButton>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors duration-300 hover:text-gold"
        >
          <ArrowLeft className="size-4" strokeWidth={1.25} /> Back to details
        </button>
      </div>
    </form>
  );
}

function StepConfirmation({
  confirmed,
  onSimulateConfirm,
  bookingRef,
  room,
  dates,
  nights,
  guest,
  method,
  reference,
  total,
}: {
  confirmed: boolean;
  onSimulateConfirm: () => void;
  bookingRef: string;
  room: RoomType;
  dates: { checkIn: string; checkOut: string };
  nights: number;
  guest: Guest;
  method: PaymentMethodId | null;
  reference: string;
  total: number;
}) {
  const chosen = paymentMethods.find((m) => m.id === method);
  const rows: [string, string][] = [
    ["Booking reference", bookingRef],
    ["Guest", guest.name || "—"],
    ["Room", `${room.name} room`],
    ["Dates", `${formatDate(dates.checkIn)} → ${formatDate(dates.checkOut)}`],
    ["Nights", String(Math.max(nights, 1))],
    ["Guests", String(guest.guests)],
    ["Total", `${site.currency}${total.toLocaleString()}`],
    ["Payment method", chosen?.network ?? "—"],
    ["Payment reference", reference || "—"],
  ];

  return (
    <div className="animate-fade-in">
      <span
        className={cn(
          "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[0.6875rem] tracking-[0.18em] uppercase",
          confirmed ? "border-gold/50 text-gold" : "border-hairline text-muted-foreground",
        )}
      >
        {confirmed ? (
          <ShieldCheck className="size-3.5" strokeWidth={1.5} />
        ) : (
          <Clock className="size-3.5" strokeWidth={1.5} />
        )}
        {confirmed ? "Confirmed" : "Awaiting verification"}
      </span>

      <h2 className="mt-5 font-display text-4xl leading-none font-light tracking-[-0.01em] sm:text-5xl">
        {confirmed ? "Booking confirmed" : "Payment submitted"}
      </h2>
      <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">
        {confirmed
          ? "Your reservation is confirmed. Please bring your booking reference and an ID when you arrive."
          : "Your reservation is temporarily held while Rosmon Guest Lodge verifies your payment. Reservation hold: 1 hour."}
      </p>

      <dl className="mt-8 divide-y divide-[var(--hairline)] overflow-hidden rounded-3xl border border-hairline">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 px-5 py-3.5"
          >
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="text-right text-sm">{value}</dd>
          </div>
        ))}
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 px-5 py-3.5">
          <dt className="text-sm text-muted-foreground">
            {confirmed ? "Check-in / check-out" : "Hold expires"}
          </dt>
          <dd className="text-right text-sm">
            {confirmed
              ? "From 14:00 / by 10:00 (to be confirmed)"
              : new Date(Date.now() + 3_600_000).toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
          </dd>
        </div>
      </dl>

      <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
        Staff notification and email confirmation are connected in a later stage.
        For anything urgent, email{" "}
        <a href={`mailto:${site.email}`} className="text-gold">
          {site.email}
        </a>
        .
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          to="/"
          className="inline-flex h-12 items-center justify-center rounded-full border border-gold/45 px-6 text-sm text-gold transition-colors duration-300 hover:bg-gold/10"
        >
          Back to homepage
        </Link>
        {!confirmed && (
          <button
            type="button"
            onClick={onSimulateConfirm}
            className="text-sm text-muted-foreground underline-offset-4 transition-colors duration-300 hover:text-gold hover:underline"
          >
            Preview the confirmed state
          </button>
        )}
      </div>
    </div>
  );
}

function Summary({
  room,
  dates,
  nights,
  total,
  guests,
}: {
  room: RoomType | null;
  dates: { checkIn: string; checkOut: string };
  nights: number;
  total: number;
  guests: number;
}) {
  return (
    <aside className="tone-charcoal surface rounded-4xl p-6 lg:sticky lg:top-28">
      <span className="eyebrow text-gold">Your stay</span>
      <p className="mt-4 font-display text-3xl leading-none font-light">
        {room ? `${room.name} room` : "No room selected"}
      </p>

      <dl className="mt-6 space-y-3 text-sm">
        <Line label="Check-in" value={formatDate(dates.checkIn)} />
        <Line label="Check-out" value={formatDate(dates.checkOut)} />
        <Line label="Nights" value={nights ? String(nights) : "—"} />
        <Line label="Guests" value={String(guests)} />
        <Line
          label="Per night"
          value={room ? `${site.currency}${room.pricePerNight}` : "—"}
        />
      </dl>

      <div className="hairline-t mt-6 flex items-baseline justify-between pt-5">
        <span className="text-sm text-muted-foreground">Total</span>
        <span className="font-display text-3xl font-light text-gold">
          {room ? `${site.currency}${total.toLocaleString()}` : "—"}
        </span>
      </div>

      <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
        Rates are per room per night for up to two guests.
      </p>
    </aside>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  );
}
