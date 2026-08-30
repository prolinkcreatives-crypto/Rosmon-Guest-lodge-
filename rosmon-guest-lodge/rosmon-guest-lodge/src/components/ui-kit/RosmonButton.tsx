import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export const buttonStyles = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-tight whitespace-nowrap transition-[background-color,color,border-color,transform,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        gold: "bg-gold text-primary-foreground hover:bg-gold-soft shadow-[0_14px_40px_-18px_var(--gold)]",
        glass: "glass text-foreground hover:border-gold/40 hover:bg-white/5",
        ghost: "text-foreground/80 hover:text-gold",
        outline: "border border-gold/45 text-gold hover:bg-gold/10",
      },
      size: {
        sm: "h-10 px-4 text-[0.8125rem]",
        md: "h-12 px-6 text-sm",
        lg: "h-14 px-8 text-[0.9375rem]",
      },
    },
    defaultVariants: { variant: "gold", size: "md" },
  },
);

type Styles = VariantProps<typeof buttonStyles>;

export function RosmonButton({
  className,
  variant,
  size,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & Styles) {
  return <button className={cn(buttonStyles({ variant, size }), className)} {...props} />;
}

export function RosmonLink({
  className,
  variant,
  size,
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & Styles & { children: ReactNode }) {
  return (
    <a className={cn(buttonStyles({ variant, size }), className)} {...props}>
      {children}
    </a>
  );
}
