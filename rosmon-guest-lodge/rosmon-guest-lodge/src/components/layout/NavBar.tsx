import { useEffect, useState } from "react";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Logo } from "@/components/ui-kit/Logo";
import { RosmonButton, buttonStyles } from "@/components/ui-kit/RosmonButton";
import { navLinks } from "@/content/site";
import { cn } from "@/lib/utils";

export function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-5">
        <nav
          className={cn(
            "tone-ink mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-full bg-transparent px-3 py-2 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:px-4",
            scrolled ? "glass-strong lift" : "glass",
          )}
        >
          <Link to="/" className="min-w-0" aria-label="Rosmon Guest Lodge — home">
            <Logo />
          </Link>

          <div className="flex items-center gap-1 sm:gap-2">
            <ul className="hidden items-center gap-0.5 lg:flex">
              {navLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    activeOptions={{ exact: link.to === "/" }}
                    activeProps={{ className: "text-gold" }}
                    inactiveProps={{ className: "text-foreground/75" }}
                    className="rounded-full px-3.5 py-2 text-sm transition-colors duration-300 hover:text-gold"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <Link
              to="/book"
              className={cn(buttonStyles({ size: "sm" }), "hidden sm:inline-flex")}
            >
              Book Now
            </Link>
            <Link to="/book" className={cn(buttonStyles({ size: "sm" }), "sm:hidden")}>
              Book
            </Link>

            <RosmonButton
              variant="glass"
              size="sm"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="size-10 !px-0 lg:hidden"
            >
              {open ? (
                <X className="size-5" strokeWidth={1.25} />
              ) : (
                <Menu className="size-5" strokeWidth={1.25} />
              )}
            </RosmonButton>
          </div>
        </nav>
      </header>

      {/* Full-screen premium mobile navigation */}
      {open && (
        <div className="tone-ink animate-fade-in fixed inset-0 z-40 flex flex-col overflow-y-auto px-5 pt-28 pb-10 lg:hidden">
          <ul className="grid gap-1">
            {navLinks.map((link, i) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  onClick={() => setOpen(false)}
                  style={{ animationDelay: `${i * 40}ms` }}
                  className="animate-fade-in flex items-center justify-between border-b border-hairline py-5 font-display text-4xl font-light tracking-[-0.01em] transition-colors duration-300 hover:text-gold"
                >
                  {link.label}
                  <ArrowUpRight
                    className="size-5 text-gold/70"
                    strokeWidth={1.25}
                  />
                </Link>
              </li>
            ))}
          </ul>

          <Link
            to="/book"
            onClick={() => setOpen(false)}
            className={cn(buttonStyles({ size: "lg" }), "mt-10 w-full")}
          >
            Book Your Stay
          </Link>
        </div>
      )}
    </>
  );
}
