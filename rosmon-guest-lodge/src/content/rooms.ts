import { photos } from "@/content/photos";


/**
 * Room type catalogue. Shape mirrors the future backend record so booking
 * milestones can replace this array with live inventory data.
 */
export interface RoomType {
  id: "standard" | "executive";
  /** URL slug — matches /rooms/$slug routes. */
  slug: "standard" | "executive";
  name: string;
  descriptor: string;
  /** Longer copy. Final wording is still to be supplied by Rosmon. */
  description: string;
  pricePerNight: number;
  maxGuests: number;
  /** Physical units of this type — used by future inventory logic. */
  units: number;
  features: string[];
  image: string;
  imageWidth: number;
  imageHeight: number;
  gallery: { src: string; alt: string }[];
  /** Details Rosmon has not confirmed yet — rendered as clear placeholders. */
  pendingDetails: string[];
}

export const roomTypes: RoomType[] = [
  {
    id: "standard",
    slug: "standard",
    name: "Standard",
    descriptor: "A calm, well-kept room with everything a good night needs.",
    description:
      "The Standard room covers the essentials properly: air conditioning, hot water, DStv and Wi-Fi, in a quiet, carefully maintained space for up to two guests.",
    pricePerNight: 250,
    maxGuests: 2,
    units: 11,
    features: ["Air conditioning", "Hot water", "DStv", "Wi-Fi"],
    image: photos.standard,
    imageWidth: 1200,
    imageHeight: 1600,
    gallery: [
      { src: photos.standard, alt: "Standard room at Rosmon Guest Lodge" },
      { src: photos.roomComfort, alt: "Air conditioning and curtains in a guest room" },
      { src: photos.corridor, alt: "Corridor leading to the guest rooms" },
    ],
    pendingDetails: [
      "Room size and exact bed configuration",
      "Breakfast arrangement and rate inclusions",
    ],

  },
  {
    id: "executive",
    slug: "executive",
    name: "Executive",
    descriptor: "More space, warmer finishes and a quieter corner of the lodge.",
    description:
      "The Executive room offers more space and warmer finishes while keeping the same standard of upkeep, with air conditioning, hot water, DStv and Wi-Fi for up to two guests.",
    pricePerNight: 450,
    maxGuests: 2,
    units: 4,
    features: ["Air conditioning", "Hot water", "DStv", "Wi-Fi"],
    image: photos.executive,
    imageWidth: 1600,
    imageHeight: 1200,
    gallery: [
      { src: photos.executive, alt: "Executive room at Rosmon Guest Lodge" },
      { src: photos.roomView, alt: "Morning view over the hills from a guest room" },
      { src: photos.entrance, alt: "Interior entrance landing at Rosmon Guest Lodge" },
    ],
    pendingDetails: [
      "Room size and exact bed configuration",
      "What distinguishes Executive from Standard in Rosmon's own words",
    ],

  },
];

export function getRoom(slug: RoomType["slug"]): RoomType {
  const room = roomTypes.find((r) => r.slug === slug);
  if (!room) throw new Error(`Unknown room slug: ${slug}`);
  return room;
}
