import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";

interface SectionHeadingProps {
  index?: string;
  eyebrow?: string;
  title: ReactNode;
  body?: ReactNode;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeading({
  index,
  eyebrow,
  title,
  body,
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <Reveal
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {(index || eyebrow) && (
        <div
          className={cn(
            "flex items-center gap-3",
            align === "center" && "justify-center",
          )}
        >
          {index && <span className="eyebrow text-gold">{index}</span>}
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        </div>
      )}
      <h2 className="mt-4 font-display text-[2.25rem] leading-[1.05] font-light tracking-[-0.01em] text-balance sm:text-5xl lg:text-[3.5rem]">
        {title}
      </h2>
      {body && (
        <p className="mt-5 max-w-xl text-[0.95rem] leading-relaxed text-muted-foreground sm:text-base">
          {body}
        </p>
      )}
    </Reveal>
  );
}
