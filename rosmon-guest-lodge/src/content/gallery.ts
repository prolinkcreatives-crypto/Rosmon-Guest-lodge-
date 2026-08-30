import { photos } from "@/content/photos";

export const galleryCategories = [
  "All",
  "Property",
  "Rooms",
  "Dining",
  "Details",
] as const;

export type GalleryCategory = (typeof galleryCategories)[number];

export interface GalleryImage {
  src: string;
  alt: string;
  category: Exclude<GalleryCategory, "All">;
  /** Editorial span — drives the non-uniform layout. */
  span: "wide" | "tall" | "regular";
}

export const galleryImages: GalleryImage[] = [
  {
    src: photos.hero,
    alt: "Rosmon Guest Lodge courtyard lit up at night",
    category: "Property",
    span: "wide",
  },
  {
    src: photos.standard,
    alt: "Standard room at Rosmon Guest Lodge",
    category: "Rooms",
    span: "tall",
  },
  {
    src: photos.exteriorDay,
    alt: "The lodge buildings and paved courtyard by day",
    category: "Property",
    span: "regular",
  },
  {
    src: photos.dining,
    alt: "The restaurant and bar seating area",
    category: "Dining",
    span: "wide",
  },
  {
    src: photos.executive,
    alt: "Executive room at Rosmon Guest Lodge",
    category: "Rooms",
    span: "tall",
  },
  {
    src: photos.courtyard,
    alt: "Planted courtyard and stairs to the upper rooms",
    category: "Property",
    span: "regular",
  },
  {
    src: photos.roomView,
    alt: "Morning view over the hills from a guest room",
    category: "Details",
    span: "regular",
  },
  {
    src: photos.corridor,
    alt: "Bright interior corridor leading to the guest rooms",
    category: "Details",
    span: "regular",
  },
  {
    src: photos.entrance,
    alt: "Interior entrance landing at Rosmon Guest Lodge",
    category: "Property",
    span: "regular",
  },
  {
    src: photos.roomComfort,
    alt: "Air conditioning and curtains in a guest room",
    category: "Details",
    span: "regular",
  },
];
