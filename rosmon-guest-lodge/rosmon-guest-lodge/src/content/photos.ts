/**
 * Real Rosmon Guest Lodge photography, served from the CDN.
 * Single source of truth so pages and content files share the same set.
 */
import heroAsset from "@/assets/hero.jpg.asset.json";
import standardAsset from "@/assets/standard.jpg.asset.json";
import executiveAsset from "@/assets/executive.jpg.asset.json";
import diningAsset from "@/assets/dinning.jpg.asset.json";
import exteriorDayAsset from "@/assets/property.jpg.asset.json";
import courtyardAsset from "@/assets/property1.jpg.asset.json";
import roomViewAsset from "@/assets/property_3.jpg.asset.json";
import corridorAsset from "@/assets/property_4.jpg.asset.json";
import entranceAsset from "@/assets/property_8.jpg.asset.json";
import roomComfortAsset from "@/assets/rooms.jpg.asset.json";

export const photos = {
  hero: heroAsset.url,
  standard: standardAsset.url,
  executive: executiveAsset.url,
  dining: diningAsset.url,
  exteriorDay: exteriorDayAsset.url,
  courtyard: courtyardAsset.url,
  roomView: roomViewAsset.url,
  corridor: corridorAsset.url,
  entrance: entranceAsset.url,
  roomComfort: roomComfortAsset.url,
} as const;
