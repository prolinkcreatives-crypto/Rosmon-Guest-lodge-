import { cn } from "@/lib/utils";
import {
  bookingStatusLabel,
  bookingStatusTone,
  paymentStatusLabel,
  paymentStatusTone,
  type BookingStatus,
  type PaymentStatus,
  type StatusTone,
} from "@/lib/admin/constants";

const toneClass: Record<StatusTone, string> = {
  neutral: "bg-secondary text-muted-foreground border-hairline",
  warning: "bg-gold/12 text-gold-deep border-gold/30",
  positive: "bg-emerald-500/12 text-emerald-700 border-emerald-600/25",
  critical: "bg-destructive/10 text-destructive border-destructive/25",
  info: "bg-sky-500/12 text-sky-700 border-sky-600/25",
};

export function StatusPill({
  tone,
  children,
  className,
}: {
  tone: StatusTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.6875rem] font-medium tracking-[0.06em] whitespace-nowrap uppercase",
        toneClass[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export const BookingStatusPill = ({ status }: { status: BookingStatus }) => (
  <StatusPill tone={bookingStatusTone[status]}>{bookingStatusLabel[status]}</StatusPill>
);

export const PaymentStatusPill = ({ status }: { status: PaymentStatus }) => (
  <StatusPill tone={paymentStatusTone[status]}>{paymentStatusLabel[status]}</StatusPill>
);
