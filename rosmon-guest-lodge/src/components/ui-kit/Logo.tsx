import logo from "@/assets/rosmon-logo.jpg";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <img
        src={logo}
        alt="Rosmon Guest Lodge"
        width={40}
        height={40}
        className="size-9 shrink-0 rounded-full object-cover ring-1 ring-hairline"
      />
      {showWordmark && (
        <span className="min-w-0 leading-none">
          <span className="block truncate font-display text-base tracking-[0.14em] text-gold uppercase">
            Rosmon
          </span>
          <span className="mt-1 block text-[0.5625rem] tracking-[0.3em] text-muted-foreground uppercase">
            Guest Lodge
          </span>
        </span>
      )}
    </span>
  );
}
