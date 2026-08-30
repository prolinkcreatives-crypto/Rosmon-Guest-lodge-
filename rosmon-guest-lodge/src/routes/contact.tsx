import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, Navigation, Car, Clock, Check } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/ui-kit/Section";
import { Reveal } from "@/components/ui-kit/Reveal";
import { SectionHeading } from "@/components/ui-kit/SectionHeading";
import { RosmonButton, RosmonLink } from "@/components/ui-kit/RosmonButton";
import { Field } from "@/components/booking/AvailabilityPanel";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { directionsUrl, mapEmbedUrl, site } from "@/content/site";

const title = "Contact Rosmon Guest Lodge — Chipata, Zambia";
const description =
  "Reach Rosmon Guest Lodge on David Kuanda Road, Chipata: email, directions, secure parking and an enquiry form for stays, events and group bookings.";

export const Route = createFileRoute("/contact")({
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
  component: ContactPage,
});

function ContactPage() {
  return (
    <>
      <PageHeader
        tone="ink"
        eyebrow="Contact"
        crumbs={[{ label: "Home", to: "/" }, { label: "Contact" }]}
        title={
          <>
            Talk to <span className="text-gold italic">reception</span>.
          </>
        }
        body="Questions about a stay, a group booking or directions to the lodge — send a note and Rosmon will come back to you."
      />

      <Section tone="taupe">
        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal className="tone-charcoal surface rounded-4xl p-7 sm:p-9">
            <span className="eyebrow text-gold">Details</span>
            <ul className="mt-7 space-y-6">
              <Row icon={<MapPin className="size-4 text-gold" strokeWidth={1.25} />} label="Address">
                {site.address.street}
                <br />
                {site.address.city}, {site.address.country}
              </Row>
              <Row icon={<Mail className="size-4 text-gold" strokeWidth={1.25} />} label="Email">
                <a
                  href={`mailto:${site.email}`}
                  className="break-all transition-colors duration-300 hover:text-gold"
                >
                  {site.email}
                </a>
              </Row>
              <Row icon={<Clock className="size-4 text-gold" strokeWidth={1.25} />} label="Reception">
                Staffed daily. Exact hours are still to be confirmed by Rosmon.
              </Row>
              <Row icon={<Car className="size-4 text-gold" strokeWidth={1.25} />} label="Parking">
                Secure on-site parking for guests
              </Row>
              <Row
                icon={<Navigation className="size-4 text-gold" strokeWidth={1.25} />}
                label="Coordinates"
              >
                {site.coordinates.lat}, {site.coordinates.lng}
              </Row>
            </ul>

            <RosmonLink
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="outline"
              size="md"
              className="mt-8 w-full"
            >
              Get Directions
            </RosmonLink>
          </Reveal>

          <Reveal delay={120} className="surface overflow-hidden rounded-4xl">
            <iframe
              title="Map showing Rosmon Guest Lodge, Chipata"
              src={mapEmbedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="size-full min-h-[26rem] border-0"
            />
          </Reveal>
        </div>
      </Section>

      <Section tone="espresso">
        <SectionHeading
          eyebrow="Enquiry"
          title={
            <>
              Send a <span className="text-gold italic">message</span>.
            </>
          }
          body="Messages are not yet wired to a mailbox — until then, email reception directly and it will reach the same team."
        />
        <div className="mt-12">
          <EnquiryForm />
        </div>
      </Section>

      <FinalCTA />
    </>
  );
}

function EnquiryForm() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });

  if (sent) {
    return (
      <Reveal className="tone-sand surface mx-auto max-w-xl rounded-4xl p-9 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-gold/12 text-gold">
          <Check className="size-5" strokeWidth={1.5} />
        </span>
        <h3 className="mt-6 font-display text-3xl font-light">Noted, {form.name || "friend"}.</h3>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          This form is a placeholder until Rosmon confirms a destination mailbox. For
          anything urgent, email{" "}
          <a href={`mailto:${site.email}`} className="text-gold">
            {site.email}
          </a>
          .
        </p>
        <RosmonButton
          variant="glass"
          size="md"
          className="mt-7"
          onClick={() => setSent(false)}
        >
          Write another
        </RosmonButton>
      </Reveal>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
      className="glass-strong lift mx-auto max-w-2xl rounded-4xl p-5 sm:p-7"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="contact-name" label="Name">
          <input
            id="contact-name"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full bg-transparent text-sm text-foreground outline-none"
            placeholder="Your name"
          />
        </Field>
        <Field id="contact-email" label="Email">
          <input
            id="contact-email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="w-full bg-transparent text-sm text-foreground outline-none"
            placeholder="you@example.com"
          />
        </Field>
        <div className="sm:col-span-2">
        <Field id="contact-phone" label="Phone">
          <input
            id="contact-phone"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className="w-full bg-transparent text-sm text-foreground outline-none"
            placeholder="Optional"
          />
        </Field>
        </div>
        <div className="sm:col-span-2">
        <Field id="contact-message" label="Message">
          <textarea
            id="contact-message"
            required
            rows={4}
            value={form.message}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            className="w-full resize-none bg-transparent text-sm text-foreground outline-none"
            placeholder="Dates, number of guests, or anything you'd like to ask."
          />
        </Field>
        </div>
      </div>

      <RosmonButton type="submit" size="lg" className="mt-4 w-full">
        Send Enquiry
      </RosmonButton>
    </form>
  );
}

function Row({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <li className="grid grid-cols-[auto_minmax(0,1fr)] gap-4">
      <span className="mt-1 shrink-0">{icon}</span>
      <span className="min-w-0">
        <span className="eyebrow block">{label}</span>
        <span className="mt-1.5 block text-[0.9375rem] leading-relaxed">{children}</span>
      </span>
    </li>
  );
}
