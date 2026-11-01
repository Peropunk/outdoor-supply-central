import {
  Backpack,
  Bed,
  Binoculars,
  Compass,
  CookingPot,
  Droplets,
  Fish,
  Flame,
  Flashlight,
  Footprints,
  Sailboat,
  Shirt,
  Snowflake,
  Tent,
  Axe,
  type LucideIcon,
} from "lucide-react";
import type { GearIcon, Photo } from "@/lib/listings";

const ICONS: Record<GearIcon, LucideIcon> = {
  tent: Tent,
  backpack: Backpack,
  boot: Footprints,
  fish: Fish,
  flame: Flame,
  jacket: Shirt,
  lamp: Flashlight,
  compass: Compass,
  axe: Axe,
  pot: CookingPot,
  droplets: Droplets,
  bed: Bed,
  binoculars: Binoculars,
  boat: Sailboat,
  snow: Snowflake,
};

/**
 * Placeholder for seller photos in the sample data. Real listings render the
 * uploaded photo with the seller's alt text in the same square frame.
 */
export function GearPhoto({
  photo,
  className = "",
  size = "md",
}: {
  photo: Photo;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const Icon = ICONS[photo.icon];
  const iconSize = { sm: "w-1/3", md: "w-2/5", lg: "w-1/3" }[size];
  return (
    <div
      role="img"
      aria-label={photo.alt}
      className={`relative flex aspect-square items-center justify-center overflow-hidden ${className}`}
      style={{ backgroundColor: photo.tone }}
    >
      <Icon className={`${iconSize} h-auto text-pine/70`} strokeWidth={1.25} aria-hidden="true" />
    </div>
  );
}
