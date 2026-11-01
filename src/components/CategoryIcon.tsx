import { Backpack, Binoculars, Fish, Flame, Shirt, Tent, type LucideIcon } from "lucide-react";
import type { CategorySlug } from "@/lib/catalog";

const ICONS: Record<CategorySlug, LucideIcon> = {
  camping: Tent,
  hiking: Backpack,
  fishing: Fish,
  survival: Flame,
  "clothing-footwear": Shirt,
  other: Binoculars,
};

export function CategoryIcon({ slug, className }: { slug: CategorySlug; className?: string }) {
  const Icon = ICONS[slug];
  return <Icon className={className} strokeWidth={1.5} aria-hidden="true" />;
}
