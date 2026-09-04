import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  CalendarDays,
  Users,
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  Smartphone,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { RosmonButton } from "@/components/ui-kit/RosmonButton";
import { Field } from "./AvailabilityPanel";
import { roomTypes, type RoomType } from "@/content/rooms";
import { paymentMethods, site, type PaymentMethodId } from "@/content/site";
import {
  roomAvailabilityQuery,
  createPublicBooking,
  explainUnavailable,
  type PublicBookingResult,
  type RoomTypeAvailability,
} from "@/lib/public/availability";
import { todayIso, addDaysIso, minCheckout, reconcileCheckout } from "@/lib/date-range";
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

export function BookingFlow({
  search,
  rooms = roomTypes,
}: {
  search: Search;
  rooms?: RoomType[];
}) {
  const initialRoomSlug = search.room ?? null;
  const hasInitialDates = Boolean(search.checkIn && search.checkOut);
  // Room chosen via a "Book Standard"/"Book Executive" CTA: never show the
  // generic multi-room list for this session unless the guest explicitly
  // backs out of that room (see onChooseDifferentRoom). Captured once so
  // the progress bar doesn't reshape itself mid-flow.
  const [cameFromRoomCta] = useState(Boolean(initialRoomSlug));
  // Dates already known (hero search) and no specific room requested:
  // go straight to room selection — step 0 already did its job on the
  // homepage, asking again would be the exact duplication being fixed.
  const [step, setStep] = useState<StepIndex>(
    !initialRoomSlug && hasInitialDates ? 1 : 0,
  );
  const [visitedRoomList, setVisitedRoomList] = useState(step === 1);
  const [dates, setDates] = useState({
    checkIn: search.checkIn ?? "",
    checkOut: search.checkOut ?? "",
    guests: search.guests ?? 2,
  });
  const [searched, setSearched] = useState(hasInitialDates);
  const [roomSlug, setRoomSlug] = useState<RoomType["slug"] | null>(initialRoomSlug);
  const [guest, setGuest] = useState<Guest>({
    name: "",
    phone: "",
    email: "",
    guests: search.guests ?? 2,
    request: "",
  });
  const [method, setMethod] = useState<PaymentMethodId | null>(null);
  const [reference, setReference] = useState("");

  const room = useMemo(
    () => rooms.find((r) => r.slug === roomSlug) ?? null,
    [rooms, roomSlug],
  );
  const nights = nightsBetween(dates.checkIn, dates.checkOut);
  const total = room ? room.pricePerNight * Math.max(nights, 1) : 0;

  // Live availability for a pre-selected room, checked inline on step 0 —
  // same RPC and same explainUnavailable() StepRooms uses, not a second
  // implementation. Only runs once a room and both dates are known.
  const preselectedAvailability = useQuery({
    ...roomAvailabilityQuery(dates.checkIn, dates.checkOut),
    enabled: Boolean(roomSlug && searched && dates.checkIn && dates.checkOut),
  });
  const preselectedBreakdown = room ? preselectedAvailability.data?.[room.id] : undefined;

  // The one inventory engine, called from the browser: create_booking()
  // atomically assigns a physical unit and returns the real reference —
  // there is no local "pretend it worked" state past this point.
  const submitBooking = useMutation({
    mutationFn: async () => {
      if (!room) throw new Error("Choose a room");
      if (!method) throw new Error("Choose a payment method");
      if (!reference.trim()) throw new Error("Enter your payment reference");
      return createPublicBooking({
        roomTypeId: room.id,
        checkIn: dates.checkIn,
        checkOut: dates.checkOut,
        guests: guest.guests,
        guestName: guest.name,
        guestPhone: guest.phone,
        guestEmail: guest.email,
        paymentMethod: method,
        paymentReference: reference,
      });
    },
    onSuccess: () => setStep(4),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      <div>
        <Progress step={step} hideRoom={cameFromRoomCta && !visitedRoomList} />

        <div className="surface mt-6 rounded-4xl p-5 sm:p-8">
          {step === 0 && (
            <StepDates
              dates={dates}
              setDates={setDates}
              searched={searched}
              preselectedRoom={room}
              availability={preselectedBreakdown}
              isCheckingAvailability={
                Boolean(roomSlug) && searched && preselectedAvailability.isLoading
              }
              availabilityError={
                preselectedAvailability.isError
                  ? (preselectedAvailability.error as Error).message
                  : null
              }
              onSearch={() => {
                setSearched(true);
                // No pre-selected room: this is what used to be the only
                // path — show the full room list next.
                if (!roomSlug) {
                  setVisitedRoomList(true);
                  setStep(1);
                }
                // A pre-selected room stays on step 0, which now renders
                // the inline availability result once `searched` is true.
              }}
              onContinueWithRoom={() => setStep(2)}
              onChooseDifferentRoom={() => {
                setRoomSlug(null);
                setVisitedRoomList(true);
                setStep(1);
              }}
            />
          )}

          {step === 1 && (
            <StepRooms
              rooms={rooms}
              searched={searched}
              checkIn={dates.checkIn}
              checkOut={dates.checkOut}
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
              onBack={() => setStep(visitedRoomList ? 1 : 0)}
              onContinue={() => setStep(3)}
            />
          )}

          {step === 3 && room && (
            <StepPayment
              method={method}
              setMethod={setMethod}
              reference={reference}
              setReference={setReference}
              total={total}
              onBack={() => setStep(2)}
              onSubmit={() => submitBooking.mutate()}
              isSubmitting={submitBooking.isPending}
              error={submitBooking.error as Error | null}
            />
          )}

          {step === 4 && room && submitBooking.data && (
            <StepConfirmation
              booking={submitBooking.data}
              room={room}
              dates={dates}
              nights={nights}
              guest={guest}
              method={method}
              reference={reference}
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

function Progress({ step, hideRoom }: { step: number; hideRoom: boolean }) {
  const labels = hideRoom ? steps.filter((_, i) => i !== 1) : steps;
  // step only ever takes {0,2,3,4} when hideRoom (step 1 is never
  // reached), so shifting by one collapses cleanly onto the filtered list.
  const displayStep = hideRoom && step > 0 ? step - 1 : step;
  return (
    <ol className="glass flex flex-wrap items-center gap-x-3 gap-y-2 rounded-full px-4 py-3 sm:px-5">
      {labels.map((label, i) => (
        <li key={label} className="flex items-center gap-3">
          <span
            className={cn(
              "flex items-center gap-2 text-[0.6875rem] tracking-[0.16em] uppercase transition-colors duration-500",
              i === displayStep
                ? "text-gold"
                : i < displayStep
                  ? "text-foreground/70"
                  : "text-muted-foreground/60",
            )}
          >
            <span
              className={cn(
                "grid size-5 place-items-center rounded-full border text-[0.625rem] transition-colors duration-500",
                i === displayStep
                  ? "border-gold/60 text-gold"
                  : i < displayStep
                    ? "border-gold/40 bg-gold/15 text-gold"
                    : "border-hairline",
              )}
            >
              {i < displayStep ? <Check className="size-3" strokeWidth={2} /> : i + 1}
            </span>
            {label}
          </span>
          {i < labels.length - 1 && (
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
  searched,
  preselectedRoom,
  availability,
  isCheckingAvailability,
  availabilityError,
  onSearch,
  onContinueWithRoom,
  onChooseDifferentRoom,
}: {
  dates: { checkIn: string; checkOut: string; guests: number };
  setDates: (v: { checkIn: string; checkOut: string; guests: number }) => void;
  searched: boolean;
  preselectedRoom: RoomType | null;
  availability?: RoomTypeAvailability;
  isCheckingAvailability: boolean;
  availabilityError: string | null;
  onSearch: () => void;
  onContinueWithRoom: () => void;
  onChooseDifferentRoom: () => void;
}) {
  const maxGuests = Math.max(...roomTypes.map((r) => r.maxGuests));
  const datesComplete = Boolean(dates.checkIn && dates.checkOut);
  const showResult = Boolean(preselectedRoom) && searched && datesComplete;
  const isAvailable = (availability?.available ?? 0) > 0;

  return (
    <div className="animate-fade-in">
      <StepHeading
        eyebrow={preselectedRoom ? "Step 1 — Your room & dates" : "Step 1 — Search"}
        title={preselectedRoom ? `${preselectedRoom.name} Room selected` : "When are you staying?"}
      />

      {preselectedRoom && (
        <div className="mt-5 flex items-center gap-4 rounded-3xl border border-gold/30 bg-gold/[0.05] p-4">
          <img
            src={preselectedRoom.image}
            alt={`${preselectedRoom.name} room`}
            className="h-16 w-20 shrink-0 rounded-xl object-cover"
          />
          <div className="min-w-0">
            <p className="font-display text-xl font-light">{preselectedRoom.name} Room</p>
            <p className="text-sm text-muted-foreground">
              {site.currency}
              {preselectedRoom.pricePerNight} / night · up to {preselectedRoom.maxGuests} guests
            </p>
          </div>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSearch();
        }}
      >
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Field
            id="book-in"
            label="Check-in"
            icon={<CalendarDays className="size-4" strokeWidth={1.25} />}
          >
            <input
              id="book-in"
              type="date"
              required
              min={todayIso()}
              value={dates.checkIn}
              onChange={(e) => {
                const checkIn = e.target.value;
                setDates({
                  ...dates,
                  checkIn,
                  checkOut: reconcileCheckout(checkIn, dates.checkOut),
                });
              }}
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
              min={minCheckout(dates.checkIn)}
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

        {!preselectedRoom && (
          <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
            Searching shows real availability for your dates from our live inventory.
          </p>
        )}

        {/* Once a pre-selected room's dates have been searched, the result
            panel below replaces this button — changing a date re-checks
            automatically, no re-click needed. */}
        {!showResult && (
          <RosmonButton type="submit" size="lg" className="mt-7 w-full sm:w-auto">
            Check Availability
            <ArrowRight className="size-4" strokeWidth={1.5} />
          </RosmonButton>
        )}
      </form>

      {showResult && (
        <div className="mt-2">
          {isCheckingAvailability ? (
            <p className="mt-5 text-sm text-muted-foreground">Checking availability…</p>
          ) : availabilityError ? (
            <p className="mt-5 text-sm text-destructive">
              Could not check live availability ({availabilityError}). Please try again.
            </p>
          ) : isAvailable ? (
            <div className="animate-fade-in mt-5 rounded-3xl border border-gold/30 bg-gold/[0.05] p-5">
              <p className="flex items-center gap-2 text-sm text-gold">
                <CheckCircle2 className="size-4 shrink-0" strokeWidth={1.5} />
                {preselectedRoom!.name} Room available for your selected dates.
              </p>
              <RosmonButton onClick={onContinueWithRoom} size="lg" className="mt-4">
                Continue
                <ArrowRight className="size-4" strokeWidth={1.5} />
              </RosmonButton>
            </div>
          ) : (
            <div className="animate-fade-in mt-5 rounded-3xl border border-hairline p-5">
              <p className="text-sm text-muted-foreground">
                {availability
                  ? explainUnavailable(availability)
                  : "Fully booked for these dates"}
              </p>
              <p className="mt-3 text-sm">
                Try different dates above, or{" "}
                <button
                  type="button"
                  onClick={onChooseDifferentRoom}
                  className="text-gold underline underline-offset-2 hover:no-underline"
                >
                  choose a different room
                </button>
                .
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StepRooms({
  rooms,
  searched,
  checkIn,
  checkOut,
  nights,
  selected,
  onSelect,
  onBack,
}: {
  rooms: RoomType[];
  searched: boolean;
  checkIn: string;
  checkOut: string;
  nights: number;
  selected: RoomType["slug"] | null;
  onSelect: (slug: RoomType["slug"]) => void;
  onBack: () => void;
}) {
  // Real counts once dates are known — see public.check_room_availability()
  // (20260831052141). Until a search has been made there are no dates to
  // check against, so availability is left unclaimed rather than guessed.
  const availability = useQuery(roomAvailabilityQuery(checkIn, checkOut));

  return (
    <div className="animate-fade-in">
      <StepHeading eyebrow="Step 2 — Available rooms" title="Choose your room" />

      {!searched && (
        <p className="mt-5 text-sm text-muted-foreground">
          Availability shown below is indicative until dates are searched.
        </p>
      )}

      {searched && availability.isError && (
        <p className="mt-5 text-sm text-destructive">
          Could not check live availability ({(availability.error as Error).message}).
          Please try again.
        </p>
      )}

      <div className="mt-8 grid gap-3">
        {rooms.map((room) => {
          const breakdown = availability.data?.[room.id];
          // Tri-state: unknown while not searched / still loading, or a
          // real breakdown once resolved. Never shown as "Available"
          // without having actually checked.
          const status: "unknown" | "checking" | "available" | "full" = !searched
            ? "unknown"
            : availability.isLoading
              ? "checking"
              : (breakdown?.available ?? 0) > 0
                ? "available"
                : "full";
          const selectable = status !== "full" && status !== "checking";
          const reason = breakdown ? explainUnavailable(breakdown) : "Fully booked for these dates";
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
                {status !== "unknown" && (
                  <p
                    className={cn(
                      "mt-2 text-[0.6875rem] tracking-[0.18em] uppercase",
                      status === "available" ? "text-gold" : "text-muted-foreground",
                    )}
                  >
                    {status === "checking"
                      ? "Checking availability…"
                      : status === "available"
                        ? `Available${typeof breakdown?.available === "number" ? ` · ${breakdown.available} left` : ""}`
                        : reason}
                  </p>
                )}
              </div>
              <RosmonButton
                variant={selectable ? "gold" : "glass"}
                disabled={!selectable}
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
  isSubmitting,
  error,
}: {
  method: PaymentMethodId | null;
  setMethod: (m: PaymentMethodId) => void;
  reference: string;
  setReference: (v: string) => void;
  total: number;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  error: Error | null;
}) {
  const chosen = paymentMethods.find((m) => m.id === method);
  const [attempted, setAttempted] = useState(false);
  return (
    <form
      className="animate-fade-in"
      onSubmit={(e) => {
        e.preventDefault();
        setAttempted(true);
        if (method && reference.trim() && !isSubmitting) onSubmit();
      }}
    >
      <StepHeading eyebrow="Step 4 — Payment" title="Pay by mobile money" />

      <ol className="mt-4 grid gap-1.5 text-xs text-muted-foreground sm:grid-cols-2">
        <li>1. Select your payment method below.</li>
        <li>2. Send the payment to that number.</li>
        <li>3. Enter the transaction reference you receive.</li>
        <li>4. Submit — Rosmon verifies it by hand.</li>
      </ol>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {paymentMethods.map((m) => (
          <button
            type="button"
            key={m.id}
            aria-pressed={method === m.id}
            onClick={() => setMethod(m.id)}
            className={cn(
              "rounded-3xl border p-5 text-left transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
              method === m.id
                ? "border-gold/50 bg-gold/[0.07] ring-1 ring-gold/30"
                : "border-hairline hover:border-gold/25",
            )}
          >
            <span className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-gold">
                <Smartphone className="size-4" strokeWidth={1.25} />
                <span className="text-[0.6875rem] tracking-[0.18em] uppercase">
                  {m.network}
                </span>
              </span>
              {method === m.id && (
                <CheckCircle2 className="size-4 text-gold" strokeWidth={1.75} />
              )}
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

      {chosen ? (
        <p className="animate-fade-in mt-6 rounded-3xl border border-hairline p-5 text-sm leading-relaxed text-muted-foreground">
          Send {site.currency}
          {total.toLocaleString()} using {chosen.network} to{" "}
          <span className="text-gold">{chosen.number}</span> ({chosen.accountName}),
          then enter the transaction reference below. Rosmon verifies every payment
          manually — it is not confirmed automatically.
        </p>
      ) : (
        attempted && (
          <p className="animate-fade-in mt-4 rounded-2xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Select a payment method above to continue.
          </p>
        )
      )}

      <div className="mt-4">
        <Field id="p-ref" label="Payment / transaction reference">
          <input
            id="p-ref"
            required
            disabled={!method}
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            className="w-full bg-transparent text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50"
            placeholder={method ? "e.g. MP260824.1432.A12345" : "Select a payment method first"}
          />
        </Field>
        {method && attempted && !reference.trim() && (
          <p className="animate-fade-in mt-2 text-xs text-destructive">
            Enter the transaction reference from your payment.
          </p>
        )}
      </div>

      {error && (
        <p className="animate-fade-in mt-4 rounded-2xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error.message}
        </p>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <RosmonButton
          type="submit"
          size="lg"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Submitting…
            </>
          ) : (
            "Submit Payment"
          )}
        </RosmonButton>
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors duration-300 hover:text-gold disabled:opacity-60"
        >
          <ArrowLeft className="size-4" strokeWidth={1.25} /> Back to details
        </button>
      </div>
    </form>
  );
}

function StepConfirmation({
  booking,
  room,
  dates,
  nights,
  guest,
  method,
  reference,
}: {
  booking: PublicBookingResult;
  room: RoomType;
  dates: { checkIn: string; checkOut: string };
  nights: number;
  guest: Guest;
  method: PaymentMethodId | null;
  reference: string;
}) {
  const chosen = paymentMethods.find((m) => m.id === method);
  const rows: [string, string][] = [
    ["Booking reference", booking.reference],
    ["Guest", guest.name || "—"],
    ["Room", `${room.name} room`],
    ["Dates", `${formatDate(dates.checkIn)} → ${formatDate(dates.checkOut)}`],
    ["Nights", String(Math.max(nights, 1))],
    ["Guests", String(guest.guests)],
    ["Total", `${site.currency}${booking.total.toLocaleString()}`],
    ["Payment method", chosen?.network ?? "—"],
    ["Payment reference", reference || "—"],
  ];

  return (
    <div className="animate-fade-in">
      <span className="inline-flex items-center gap-2 rounded-full border border-hairline px-4 py-2 text-[0.6875rem] tracking-[0.18em] text-muted-foreground uppercase">
        <Clock className="size-3.5" strokeWidth={1.5} />
        Awaiting verification
      </span>

      <h2 className="mt-5 font-display text-4xl leading-none font-light tracking-[-0.01em] sm:text-5xl">
        Payment submitted
      </h2>
      <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">
        Your reservation is held while Rosmon Guest Lodge verifies your payment
        reference. Keep your booking reference — our team will confirm by phone or
        email.
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
