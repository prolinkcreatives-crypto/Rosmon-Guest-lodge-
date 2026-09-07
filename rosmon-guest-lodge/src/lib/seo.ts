import { siteUrl } from "@/content/site";

/** A canonical <link> entry for a route's head(). Pass the bare path — never include query strings, so parameterized URL variations (e.g. /book?checkIn=...) all consolidate to one canonical entry. */
export function canonicalLink(path: string) {
  return { rel: "canonical", href: `${siteUrl}${path}` } as const;
}

/** Absolute URL of the site's Open Graph / Twitter share image (public/og-image.jpg — 1200×630 JPEG). One place to change it. */
export const ogImageUrl = `${siteUrl}/og-image.jpg`;

/**
 * Open Graph + Twitter card tags for a page's head(). Reuses the same
 * title/description already used for <title>/meta[name=description] —
 * social copy intentionally matches SEO copy unless a page has a strong
 * reason to diverge (none currently do). Every page shares one og:image;
 * only og:url (and title/description) vary per page.
 */
export function socialMeta({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}) {
  return [
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:url", content: `${siteUrl}${path}` },
    { property: "og:image", content: ogImageUrl },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:image:type", content: "image/jpeg" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: ogImageUrl },
  ] as const;
}
