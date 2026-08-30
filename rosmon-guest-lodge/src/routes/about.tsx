import { createFileRoute } from "@tanstack/react-router";
import { CircleDashed } from "lucide-react";
import { photos } from "@/content/photos";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/ui-kit/Section";
import { SectionHeading } from "@/components/ui-kit/SectionHeading";
import { Reveal } from "@/components/ui-kit/Reveal";
import { Testimonials } from "@/components/sections/Testimonials";
import { Location } from "@/components/sections/Location";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { site } from "@/content/site";

const title = "About Rosmon Guest Lodge — Chipata, Zambia";
const description =
  "Rosmon Guest Lodge on David Kuanda Road, Chipata: affordable accommodation without compromising on quality, with fifteen rooms, a restaurant, bar and secure parking.";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

const pending = [
  "When Rosmon opened and who founded it",
  "The story behind the name",
  "Management and team introduction",
  "Any awards, affiliations or partnerships",
];

function AboutPage() {
  return (
    <>
      <PageHeader
        tone="ink"
        eyebrow="About"
        crumbs={[{ label: "Home", to: "/" }, { label: "About" }]}
        title={
          <>
            A lodge built around <span className="text-gold italic">value</span>.
          </>
        }
        body={site.tagline}
      />

      <Section tone="taupe">
        <div className="grid items-center gap-6 lg:grid-cols-[1fr_1.1fr]">
          <Reveal className="overflow-hidden rounded-4xl border border-hairline lift">
            <img
              src={photos.courtyard}
              alt="Planted courtyard at Rosmon Guest Lodge"
              width={1400}
              height={1000}
              loading="lazy"
              decoding="async"
              className="aspect-[4/3] w-full object-cover"
            />
          </Reveal>
          <Reveal delay={120}>
            <span className="eyebrow text-gold">Hospitality philosophy</span>
            <p className="mt-5 font-display text-[1.6rem] leading-[1.3] font-light text-balance sm:text-3xl">
              Rosmon exists to prove that affordable and well-kept are not opposites.
            </p>
            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
              Fifteen rooms — eleven Standard and four Executive — are maintained to
              the same standard, with air conditioning, hot water, DStv and Wi-Fi in
              every one. A restaurant, bar and secure parking sit on the same
              property, so a stay stays simple.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              The lodge is on {site.address.street} in {site.address.city},{" "}
              {site.address.country}.
            </p>
          </Reveal>
        </div>
      </Section>

      <Section tone="espresso">
        <SectionHeading
          eyebrow="Our story"
          title={
            <>
              Written by Rosmon, <span className="text-gold italic">not for it</span>.
            </>
          }
          body="This page will carry the lodge's own history once it has been supplied. Nothing below has been invented."
        />
        <Reveal className="surface mt-12 rounded-4xl p-7 sm:p-10">
          <span className="eyebrow text-gold">Awaiting information</span>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {pending.map((p) => (
              <li key={p} className="flex items-start gap-3 text-[0.9375rem]">
                <CircleDashed
                  className="mt-0.5 size-4 shrink-0 text-gold"
                  strokeWidth={1.25}
                />
                <span className="text-muted-foreground">{p}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </Section>

      <Testimonials tone="sand" withMoreLink={false} />
      <Location tone="charcoal" />
      <FinalCTA tone="ink" />
    </>
  );
}
