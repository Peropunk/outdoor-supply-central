import Image from "next/image";
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

const SIZES = {
  sm: "96px",
  md: "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw",
  lg: "(min-width: 768px) 50vw, 100vw",
};

const NO_PHOTO: Photo = { icon: "backpack", tone: "#efe8d8", alt: "No photo yet" };

/**
 * A listing photo in a square frame: the seller's upload, or an illustrated
 * placeholder for the sample data.
 */
export function GearPhoto({
  photo = NO_PHOTO,
  className = "",
  size = "md",
  priority = false,
}: {
  photo?: Photo;
  className?: string;
  size?: "sm" | "md" | "lg";
  priority?: boolean;
}) {
  if ("url" in photo) {
    return (
      <div className={`relative aspect-square overflow-hidden bg-sand ${className}`}>
        <Image src={photo.url} alt={photo.alt} fill sizes={SIZES[size]} priority={priority} className="object-cover" />
      </div>
    );
  }

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
