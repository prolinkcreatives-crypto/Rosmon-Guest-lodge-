import { ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

/** "Explore all rooms →" style link that pushes visitors to a dedicated page. */
export function MoreLink({
  to,
  children,
  className,
}: {
  to: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "group inline-flex items-center gap-2 text-sm text-gold transition-colors duration-300",
        className,
      )}
    >
      {children}
      <ArrowRight
        className="size-4 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1"
        strokeWidth={1.5}
      />
    </Link>
  );
}
