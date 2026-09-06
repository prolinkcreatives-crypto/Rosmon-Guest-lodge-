import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/ui-kit/Logo";
import { navLinks, site } from "@/content/site";

export function Footer() {
  return (
    <footer className="tone-ink">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-14 sm:px-8 sm:py-16 lg:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted-foreground">
            {site.address.street}, {site.address.city}, {site.address.country}
          </p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
            {site.tagline}
          </p>
        </div>

        <nav aria-label="Footer">
          <span className="eyebrow">Explore</span>
          <ul className="mt-4 space-y-2.5">
            {[...navLinks, { label: "Book", to: "/book" }].map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="text-sm text-foreground/75 transition-colors duration-300 hover:text-gold"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <span className="eyebrow">Contact</span>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <a
                href={`mailto:${site.email}`}
                className="break-all text-foreground/75 transition-colors duration-300 hover:text-gold"
              >
                {site.email}
              </a>
            </li>
            <li className="text-muted-foreground">Reception open daily</li>
          </ul>
        </div>
      </div>

      <div className="hairline-t">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-5 py-6 text-[0.6875rem] tracking-[0.14em] text-muted-foreground uppercase sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span>
            © {new Date().getFullYear()} {site.name}
          </span>
          <span>Chipata · Zambia</span>
        </div>
      </div>
    </footer>
  );
}
