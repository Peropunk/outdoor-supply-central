// Fixed marketplace vocabulary from the Phase 1 work plan. Items marked
// "default" are open decisions for JD (see "Decisions to confirm with JD").

export type CategorySlug = "camping" | "hiking" | "fishing" | "survival" | "clothing-footwear" | "other";

export type Category = {
  slug: CategorySlug;
  name: string;
  blurb: string;
  subcategories: string[];
};

export const CATEGORIES: Category[] = [
  {
    slug: "camping",
    name: "Camping",
    blurb: "Tents, bags, stoves and everything for a night out",
    subcategories: ["Tents", "Sleeping bags and pads", "Stoves and cookware", "Lighting", "Furniture"],
  },
  {
    slug: "hiking",
    name: "Hiking",
    blurb: "Packs, poles and trail essentials",
    subcategories: ["Backpacks", "Daypacks", "Trekking poles", "Navigation", "Hydration"],
  },
  {
    slug: "fishing",
    name: "Fishing",
    blurb: "Rods, reels, tackle and waders",
    subcategories: ["Rods", "Reels", "Tackle and lures", "Fly fishing", "Waders"],
  },
  {
    slug: "survival",
    name: "Survival",
    blurb: "Knives, fire, water and first aid",
    subcategories: ["Knives and tools", "Fire starters", "Water filters", "First aid", "Shelter and bivvies"],
  },
  {
    slug: "clothing-footwear",
    name: "Clothing and footwear",
    blurb: "Jackets, layers and boots",
    subcategories: ["Jackets", "Base layers", "Pants", "Boots", "Hats and gloves"],
  },
  {
    slug: "other",
    name: "Other",
    blurb: "Paddling, climbing, optics and more",
    subcategories: ["Paddling", "Climbing", "Winter", "Optics", "Everything else"],
  },
];

export function getCategory(slug: string | undefined): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export type ConditionId = "new" | "like-new" | "good" | "fair";

export const CONDITIONS: { id: ConditionId; label: string; meaning: string }[] = [
  { id: "new", label: "New", meaning: "Never used; tags or box optional" },
  { id: "like-new", label: "Like new", meaning: "Used a few times, no visible wear" },
  { id: "good", label: "Good", meaning: "Visible wear, works fully" },
  {
    id: "fair",
    label: "Fair",
    meaning: "Heavy wear or cosmetic damage, works fully; flaws must be photographed",
  },
];

export function getCondition(id: ConditionId) {
  return CONDITIONS.find((c) => c.id === id)!;
}

export type PackageSizeId = "small" | "medium" | "large" | "xlarge";

// Decision 6 default: seller picks a package size when listing; the buyer sees
// the live USPS rate at checkout. These estimates stand in until Shippo is
// connected and are only used for previews.
export const PACKAGE_SIZES: {
  id: PackageSizeId;
  label: string;
  maxWeightLb: number;
  examples: string;
  estimateCents: number;
}[] = [
  {
    id: "small",
    label: "Small",
    maxWeightLb: 1,
    examples: "Headlamp, knife, gloves, lures",
    estimateCents: 625,
  },
  {
    id: "medium",
    label: "Medium",
    maxWeightLb: 3,
    examples: "Jacket, water filter, stove, reel",
    estimateCents: 995,
  },
  {
    id: "large",
    label: "Large",
    maxWeightLb: 10,
    examples: "Sleeping bag, daypack, boots",
    estimateCents: 1595,
  },
  {
    id: "xlarge",
    label: "Extra large",
    maxWeightLb: 20,
    examples: "Tent, backpacking pack, camp chair",
    estimateCents: 2450,
  },
];

export function getPackageSize(id: PackageSizeId) {
  return PACKAGE_SIZES.find((p) => p.id === id)!;
}

// Decision 9 default. JD to confirm the full list.
export const BANNED_ITEMS = [
  "Firearms, firearm parts and ammunition",
  "Fuel canisters, lighter fluid and other flammable liquids or gases",
  "Bear spray, pepper spray and other aerosols USPS restricts",
  "Fireworks, flares and explosives",
  "Broken or parts-only gear",
  "Live bait and anything perishable",
];

// Decision 7 default.
export const SHIP_BY_DAYS = 5;
export const SHIP_REMINDER_DAY = 3;

export const ACTIVITIES = [
  "Camping",
  "Hiking",
  "Fishing",
  "Survival",
  "Hunting",
  "Paddling",
  "Climbing",
  "Winter sports",
];
