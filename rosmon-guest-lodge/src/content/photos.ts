/**
 * Real Rosmon Guest Lodge photography, bundled locally by Vite.
 * Single source of truth so pages and content files share the same set.
 *
 * These are imported directly from the JPG files in src/assets so Vite
 * fingerprints and bundles them into the production build (dist/assets/...).
 * They previously went through Lovable's *.jpg.asset.json pointers, which
 * resolve to Lovable's own /__l5e/assets-v1/ preview CDN and are not served
 * by a standalone Cloudflare deployment. Do not switch these back to
 * "*.jpg.asset.json" imports.
 */
import heroImage from "@/assets/hero.jpg";
import standardImage from "@/assets/standard.jpg";
import executiveImage from "@/assets/executive.jpg";
import diningImage from "@/assets/dinning.jpg";
import exteriorDayImage from "@/assets/property.jpg";
import courtyardImage from "@/assets/property1.jpg";
import roomViewImage from "@/assets/property_3.jpg";
import corridorImage from "@/assets/property_4.jpg";
import entranceImage from "@/assets/property_8.jpg";
import roomComfortImage from "@/assets/rooms.jpg";

export const photos = {
  hero: heroImage,
  standard: standardImage,
  executive: executiveImage,
  dining: diningImage,
  exteriorDay: exteriorDayImage,
  courtyard: courtyardImage,
  roomView: roomViewImage,
  corridor: corridorImage,
  entrance: entranceImage,
  roomComfort: roomComfortImage,
} as const;
