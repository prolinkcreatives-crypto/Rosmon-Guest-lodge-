/**
 * Single source of truth for Rosmon content shown on the marketing site.
 * Milestone 1: static content. Later milestones can swap these for API data
 * without touching presentation components.
 */

export const site = {
  name: "Rosmon Guest Lodge",
  shortName: "Rosmon",
  tagline: "Affordable accommodation, without compromising on quality.",
  address: {
    street: "David Kuanda Road",
    city: "Chipata",
    country: "Zambia",
  },
  coordinates: { lat: -13.630879, lng: 32.639227 },
  email: "tongabulltradings@gmail.com",
  currency: "K",
} as const;

export const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${site.coordinates.lat},${site.coordinates.lng}`;
export const mapEmbedUrl = `https://www.google.com/maps?q=${site.coordinates.lat},${site.coordinates.lng}&z=16&output=embed`;

/** Primary navigation — every item resolves to a dedicated route. */
export const navLinks = [
  { label: "Home", to: "/" },
  { label: "Rooms", to: "/rooms" },
  { label: "Experience", to: "/experience" },
  { label: "Gallery", to: "/gallery" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
] as const;

/**
 * Mobile money details for the booking payment step. Verification is manual
 * and handled by Rosmon staff — no automated confirmation in this milestone.
 */
export const paymentMethods = [
  {
    id: "mtn",
    network: "MTN Send Cash",
    accountName: "Rosmon Guest Lodge",
    number: "0766237306",
  },
  {
    id: "airtel",
    network: "Airtel Send Cash",
    accountName: "Moono Ngoma",
    number: "0977386622",
  },
] as const;

export type PaymentMethodId = (typeof paymentMethods)[number]["id"];

export const pillars = [
  {
    title: "Comfort",
    body: "Air-conditioned rooms, hot water and quiet nights — the essentials, done properly.",
  },
  {
    title: "Quality",
    body: "Rooms are kept to a consistent standard, whether you book Standard or Executive.",
  },
  {
    title: "Value",
    body: "Fair, transparent rates. What you see is what you pay for the night.",
  },
  {
    title: "Convenience",
    body: "On David Kuanda Road in Chipata, with on-site parking, restaurant and bar.",
  },
] as const;

export const amenities = [
  { label: "Air conditioning", icon: "wind" },
  { label: "Hot water", icon: "droplets" },
  { label: "DStv", icon: "tv" },
  { label: "Wi-Fi", icon: "wifi" },
  { label: "Restaurant", icon: "utensils" },
  { label: "Bar", icon: "wine" },
  { label: "Parking", icon: "car" },
] as const;

export type AmenityIcon = (typeof amenities)[number]["icon"];
