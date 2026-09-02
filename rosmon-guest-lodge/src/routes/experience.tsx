import { createFileRoute } from "@tanstack/react-router";
import {
  Wind,
  Droplets,
  Wifi,
  UtensilsCrossed,
  Wine,
  Car,
  Tv,
  CircleDashed,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section, toneClass, type Tone } from "@/components/ui-kit/Section";
import { SectionHeading } from "@/components/ui-kit/SectionHeading";
import { Reveal } from "@/components/ui-kit/Reveal";
import { Experience } from "@/components/sections/Experience";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { pillars } from "@/content/site";
import { cn } from "@/lib/utils";

const title = "The Rosmon Experience — Chipata, Zambia";
const description =
  "Comfort, quality and fair value at Rosmon Guest Lodge: air-conditioned rooms, hot water, DStv, Wi-Fi, an on-site restaurant and bar, and secure parking.";

export const Route = createFileRoute("/experience")({
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
  component: ExperiencePage,
});

const facilities = [
  {
    icon: UtensilsCrossed,
    title: "Restaurant",
    body: "An on-site restaurant a few steps from the rooms.",
    tone: "taupe" as Tone,
  },
  {
    icon: Wine,
    title: "Bar",
    body: "A bar for an unhurried drink at the end of the day.",
    tone: "espresso" as Tone,
  },
  {
    icon: Car,
    title: "Parking",
    body: "Secure on-site parking, with the gate attended.",
    tone: "charcoal" as Tone,
  },
  {
    icon: Wifi,
    title: "Wi-Fi",
    body: "Wi-Fi throughout, included with every room.",
    tone: "sand" as Tone,
  },
  {
    icon: Wind,
    title: "Air conditioning",
    body: "Every room is air conditioned, Standard and Executive alike.",
    tone: "sand" as Tone,
  },
  {
    icon: Droplets,
    title: "Hot water",
    body: "Hot water in every bathroom, morning and evening.",
    tone: "charcoal" as Tone,
  },
  {
    icon: Tv,
    title: "DStv",
    body: "DStv in every room.",
    tone: "espresso" as Tone,
  },
];

const pending = [
  "Restaurant menu and serving hours",
  "Bar opening hours",
  "Breakfast arrangements and whether it is included",
  "Conference or events facilities, if offered",
];

function ExperiencePage() {
  return (
    <>
      <PageHeader
        tone="ink"
        eyebrow="Experience"
        crumbs={[{ label: "Home", to: "/" }, { label: "Experience" }]}
        title={
          <>
            Comfort, quality, <span className="text-gold italic">fair value</span>.
          </>
        }
        body="What a stay at Rosmon actually involves — described only from what the lodge has confirmed."
      />

      <Section tone="taupe">
        <SectionHeading
          eyebrow="What we stand for"
          title={
            <>
              The idea behind <span className="text-gold italic">Rosmon</span>.
            </>
          }
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {pillars.map((p, i) => (
            <Reveal key={p.title} delay={i * 90}>
              <div
                className={cn(
                  toneClass[(["ink", "sand", "espresso", "charcoal"] as Tone[])[i % 4]!],
                  "surface h-full rounded-4xl p-7 sm:p-9",
                )}
              >
                <span className="eyebrow text-gold">0{i + 1}</span>
                <h2 className="mt-4 font-display text-3xl font-light">{p.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {p.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <Experience tone="ink" withMoreLink={false} />

      <Section tone="sand">
        <SectionHeading
          eyebrow="Facilities"
          title={
            <>
              On the <span className="text-gold italic">property</span>.
            </>
          }
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {facilities.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 80}>
              <div
                className={cn(
                  toneClass[f.tone],
                  "surface h-full rounded-4xl p-6 transition-colors duration-500 hover:border-gold/25 sm:p-7",
                )}
              >
                <f.icon className="size-5 text-gold" strokeWidth={1.25} />
                <h3 className="mt-5 font-display text-2xl font-light">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {f.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section tone="espresso">
        <Reveal className="surface rounded-4xl p-7 sm:p-10">
          <span className="eyebrow text-gold">To be supplied by Rosmon</span>
          <h2 className="mt-4 font-display text-3xl font-light sm:text-4xl">
            Details we have not confirmed yet
          </h2>
          <ul className="mt-7 grid gap-3 sm:grid-cols-2">
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

      <FinalCTA tone="ink" />
    </>
  );
}
