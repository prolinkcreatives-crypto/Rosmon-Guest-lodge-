/**
 * Shared vocabulary for the Rosmon admin panel.
 * Booking status and payment status are deliberately independent.
 */

export const bookingStatuses = [
  "pending_payment",
  "payment_submitted",
  "confirmed",
  "checked_in",
  "checked_out",
  "cancelled",
  "expired",
] as const;
export type BookingStatus = (typeof bookingStatuses)[number];

export const paymentStatuses = [
  "unpaid",
  "submitted",
  "verified",
  "failed",
  "refunded",
] as const;
export type PaymentStatus = (typeof paymentStatuses)[number];

export const bookingStatusLabel: Record<BookingStatus, string> = {
  pending_payment: "Pending payment",
  payment_submitted: "Payment submitted",
  confirmed: "Confirmed",
  checked_in: "Checked in",
  checked_out: "Checked out",
  cancelled: "Cancelled",
  expired: "Expired",
};

export const paymentStatusLabel: Record<PaymentStatus, string> = {
  unpaid: "Unpaid",
  submitted: "Submitted",
  verified: "Verified",
  failed: "Failed",
  refunded: "Refunded",
};

/** Tone keys map to badge styling in StatusPill. */
export type StatusTone = "neutral" | "warning" | "positive" | "critical" | "info";

export const bookingStatusTone: Record<BookingStatus, StatusTone> = {
  pending_payment: "warning",
  payment_submitted: "info",
  confirmed: "positive",
  checked_in: "positive",
  checked_out: "neutral",
  cancelled: "critical",
  expired: "critical",
};

export const paymentStatusTone: Record<PaymentStatus, StatusTone> = {
  unpaid: "warning",
  submitted: "info",
  verified: "positive",
  failed: "critical",
  refunded: "neutral",
};

/** Statuses that occupy inventory for a stay. */
export const occupyingStatuses: BookingStatus[] = [
  "pending_payment",
  "payment_submitted",
  "confirmed",
  "checked_in",
];

/** Current front-desk business rules (Milestone 2A). */
export const businessRules = {
  checkInWindow: "07:00 – 12:00",
  checkOutWindow: "05:00 – 10:00",
  currency: "K",
  amenities: [
    "Self-contained",
    "Hot water",
    "Air conditioning",
    "DStv",
    "Wi-Fi",
  ],
} as const;

export function formatMoney(value: number | string | null | undefined) {
  const n = typeof value === "string" ? Number(value) : (value ?? 0);
  return `${businessRules.currency}${n.toLocaleString("en-ZM", { maximumFractionDigits: 2 })}`;
}

export function nightsBetween(checkIn: string, checkOut: string) {
  const a = new Date(`${checkIn}T00:00:00`);
  const b = new Date(`${checkOut}T00:00:00`);
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86_400_000));
}
