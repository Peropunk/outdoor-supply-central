import type { CategorySlug, ConditionId, PackageSizeId } from "./catalog";
import * as db from "./listings-db";
import { isSupabaseConfigured } from "./supabase/config";

// Pages read listings only through the functions at the bottom of this file.
// With Supabase connected they query the `listings` table (listings-db.ts);
// in preview mode they use the sample data below.

export type GearIcon =
  | "tent"
  | "backpack"
  | "boot"
  | "fish"
  | "flame"
  | "jacket"
  | "lamp"
  | "compass"
  | "axe"
  | "pot"
  | "droplets"
  | "bed"
  | "binoculars"
  | "boat"
  | "snow";

/** A seller's uploaded photo, or an illustrated placeholder in the sample data. */
export type Photo = { alt: string } & ({ url: string } | { icon: GearIcon; tone: string });

export type ListingStatus = "active" | "reserved" | "sold" | "paused" | "removed";

export type Listing = {
  id: string;
  title: string;
  brand?: string;
  category: CategorySlug;
  subcategory: string;
  condition: ConditionId;
  flaws: string;
  description: string;
  priceCents: number;
  packageSize: PackageSizeId;
  photos: Photo[];
  seller: { id: string; displayName: string; city: string | null; state: string | null };
  createdAt: string;
  status: ListingStatus;
};

const sellers = {
  jd: { id: "u_jd", displayName: "JD's Gear Closet", city: "Bend", state: "OR" },
  maya: { id: "u_maya", displayName: "Maya R.", city: "Boulder", state: "CO" },
  tom: { id: "u_tom", displayName: "Tom on the Trail", city: "Asheville", state: "NC" },
  lee: { id: "u_lee", displayName: "Lee K.", city: "Missoula", state: "MT" },
};

const photos = (icon: GearIcon, tone: string, alt: string, extra = 2): Photo[] => [
  { icon, tone, alt },
  ...Array.from({ length: extra }, (_, i) => ({
    icon,
    tone,
    alt: `${alt}, photo ${i + 2}`,
  })),
];

const LISTINGS: Listing[] = [
  {
    id: "l_1001",
    title: "Big Agnes Copper Spur HV UL2 two-person tent",
    brand: "Big Agnes",
    category: "camping",
    subcategory: "Tents",
    condition: "like-new",
    flaws: "Used on three trips. Small pine-sap spot on the rain fly, no holes or tears.",
    description:
      "Light two-door tent with the footprint and all original stakes. Packs down to the size of a loaf of bread. Selling because I upgraded to a three-person.",
    priceCents: 28500,
    packageSize: "large",
    photos: photos("tent", "#dfe7d2", "Green two-person backpacking tent pitched on grass"),
    seller: sellers.maya,
    createdAt: "2026-10-29T15:20:00Z",
    status: "active",
  },
  {
    id: "l_1002",
    title: "Osprey Atmos AG 65 backpacking pack, size M",
    brand: "Osprey",
    category: "hiking",
    subcategory: "Backpacks",
    condition: "good",
    flaws: "Light scuffing on the bottom panel and one hip-belt pocket zipper is stiff but works.",
    description:
      "The anti-gravity mesh back is great on hot days. Fits torsos 18 to 20 inches. Rain cover not included.",
    priceCents: 14000,
    packageSize: "xlarge",
    photos: photos("backpack", "#e6dfcf", "Grey 65 liter backpacking pack, front view"),
    seller: sellers.tom,
    createdAt: "2026-10-29T11:05:00Z",
    status: "active",
  },
  {
    id: "l_1003",
    title: "Salomon Quest 4 GTX hiking boots, men's 10.5",
    brand: "Salomon",
    category: "clothing-footwear",
    subcategory: "Boots",
    condition: "good",
    flaws: "Lugs about 70% left. Creasing at the toe flex point. Waterproofing still holds.",
    description: "Supportive boots for heavy loads. Cleaned and re-treated before listing.",
    priceCents: 9500,
    packageSize: "large",
    photos: photos("boot", "#ead9cc", "Brown leather hiking boots side by side"),
    seller: sellers.lee,
    createdAt: "2026-10-28T19:40:00Z",
    status: "active",
  },
  {
    id: "l_1004",
    title: "St. Croix Triumph 7' medium spinning rod",
    brand: "St. Croix",
    category: "fishing",
    subcategory: "Rods",
    condition: "like-new",
    flaws: "Faint scratch on the reel seat. Cork handle is clean.",
    description: "Two-piece, medium power, fast action. Great all-round bass and trout rod.",
    priceCents: 7500,
    packageSize: "large",
    photos: photos("fish", "#d9e6ea", "Spinning rod laid on a wooden dock"),
    seller: sellers.jd,
    createdAt: "2026-10-28T13:10:00Z",
    status: "sold",
  },
  {
    id: "l_1005",
    title: "Jetboil Flash cooking system",
    brand: "Jetboil",
    category: "camping",
    subcategory: "Stoves and cookware",
    condition: "good",
    flaws: "Cozy is faded and the igniter needs two or three clicks. Boils fast. Fuel not included.",
    description: "Boils half a litre in about two minutes. Includes the pot support and stabiliser legs.",
    priceCents: 6000,
    packageSize: "medium",
    photos: photos("flame", "#f0e0cf", "Compact camp stove with orange cozy"),
    seller: sellers.maya,
    createdAt: "2026-10-27T17:00:00Z",
    status: "active",
  },
  {
    id: "l_1006",
    title: "Patagonia Nano Puff jacket, women's S",
    brand: "Patagonia",
    category: "clothing-footwear",
    subcategory: "Jackets",
    condition: "like-new",
    flaws: "No visible wear. Washed once per the care label.",
    description: "Warm, packable synthetic layer in forest green. Stuffs into its own pocket.",
    priceCents: 8500,
    packageSize: "medium",
    photos: photos("jacket", "#dce6d6", "Forest green puffy jacket laid flat"),
    seller: sellers.maya,
    createdAt: "2026-10-27T09:30:00Z",
    status: "active",
  },
  {
    id: "l_1007",
    title: "Black Diamond Spot 400 headlamp",
    brand: "Black Diamond",
    category: "camping",
    subcategory: "Lighting",
    condition: "new",
    flaws: "None. Still in the box.",
    description: "400 lumens, waterproof, red night-vision mode. Takes three AAA batteries.",
    priceCents: 3000,
    packageSize: "small",
    photos: photos("lamp", "#ece6d2", "Black headlamp in its retail box", 1),
    seller: sellers.tom,
    createdAt: "2026-10-26T20:15:00Z",
    status: "active",
  },
  {
    id: "l_1008",
    title: "Sawyer Squeeze water filter kit",
    brand: "Sawyer",
    category: "survival",
    subcategory: "Water filters",
    condition: "like-new",
    flaws: "Backflushed and dried. Pouches have light creasing.",
    description: "Filter, two pouches, syringe and inline adapters. Good for thru-hikes or a bug-out bag.",
    priceCents: 2800,
    packageSize: "small",
    photos: photos("droplets", "#d8e7ec", "Blue water filter with two squeeze pouches", 1),
    seller: sellers.lee,
    createdAt: "2026-10-26T12:00:00Z",
    status: "active",
  },
  {
    id: "l_1009",
    title: "Western Rivers fixed-blade bushcraft knife",
    category: "survival",
    subcategory: "Knives and tools",
    condition: "fair",
    flaws: "Handle scales are scratched and the sheath stitching is fraying at the tip. Blade is sharp, no chips.",
    description: "Full-tang carbon steel with a leather sheath. Strong batoning knife.",
    priceCents: 3500,
    packageSize: "small",
    photos: photos("axe", "#e5dccb", "Fixed-blade knife beside its leather sheath"),
    seller: sellers.jd,
    createdAt: "2026-10-25T16:45:00Z",
    status: "active",
  },
  {
    id: "l_1010",
    title: "Therm-a-Rest NeoAir XLite sleeping pad, regular",
    brand: "Therm-a-Rest",
    category: "camping",
    subcategory: "Sleeping bags and pads",
    condition: "good",
    flaws: "Holds air overnight. One factory patch on the bottom, shown in photo 2.",
    description: "R-value 4.5, 12 ounces. Stuff sack and pump sack included.",
    priceCents: 11000,
    packageSize: "medium",
    photos: photos("bed", "#efe2c9", "Yellow inflatable sleeping pad unrolled"),
    seller: sellers.tom,
    createdAt: "2026-10-24T10:20:00Z",
    status: "active",
  },
  {
    id: "l_1011",
    title: "Vortex Diamondback HD 10x42 binoculars",
    brand: "Vortex",
    category: "other",
    subcategory: "Optics",
    condition: "like-new",
    flaws: "Clear glass, no scratches. Neck strap shows a little wear.",
    description: "Harness, case and lens caps included. Transferable lifetime warranty.",
    priceCents: 16500,
    packageSize: "medium",
    photos: photos("binoculars", "#dde3d4", "Green binoculars with harness and case"),
    seller: sellers.lee,
    createdAt: "2026-10-23T14:00:00Z",
    status: "active",
  },
  {
    id: "l_1012",
    title: "Black Diamond Trail trekking poles, pair",
    brand: "Black Diamond",
    category: "hiking",
    subcategory: "Trekking poles",
    condition: "good",
    flaws: "Tips are worn down a little. Locks hold firm.",
    description: "Adjustable 100 to 140 cm with flick locks. Snow baskets included.",
    priceCents: 5500,
    packageSize: "large",
    photos: photos("compass", "#e3e7dc", "Pair of trekking poles leaning on a rock"),
    seller: sellers.maya,
    createdAt: "2026-10-22T18:30:00Z",
    status: "active",
  },
  {
    id: "l_1013",
    title: "Orvis Clearwater fly reel, size III",
    brand: "Orvis",
    category: "fishing",
    subcategory: "Fly fishing",
    condition: "good",
    flaws: "Scuff on the frame from a dropped day.",
    description: "Loaded with 5-weight line and backing.",
    priceCents: 6500,
    packageSize: "small",
    photos: photos("fish", "#dbe5e0", "Fly reel with green line"),
    seller: sellers.jd,
    createdAt: "2026-10-20T12:00:00Z",
    status: "sold",
  },
  {
    id: "l_1014",
    title: "MSR Lightning Ascent snowshoes, 25 inch",
    brand: "MSR",
    category: "other",
    subcategory: "Winter",
    condition: "good",
    flaws: "Scratches on the frames from rocky trails.",
    description: "Heel lifts and televators work. Paused while I decide on a trip.",
    priceCents: 17500,
    packageSize: "xlarge",
    photos: photos("snow", "#e1e9ee", "Pair of red snowshoes"),
    seller: sellers.lee,
    createdAt: "2026-10-19T12:00:00Z",
    status: "paused",
  },
  {
    id: "l_1015",
    title: "Plano 3700 tackle box with lures",
    brand: "Plano",
    category: "fishing",
    subcategory: "Tackle and lures",
    condition: "good",
    flaws: "Latches work; a couple of dividers are cracked. Some lures have light rust on the hooks.",
    description: "Two 3700 trays loaded with about 40 crankbaits, spinners and soft plastics. Good starter kit.",
    priceCents: 4500,
    packageSize: "medium",
    photos: photos("fish", "#d7e4dc", "Open tackle box full of colourful lures"),
    seller: sellers.tom,
    createdAt: "2026-10-28T08:15:00Z",
    status: "active",
  },
];

export type ListingQuery = {
  q?: string;
  category?: string;
  condition?: string;
  minPrice?: number; // cents
  maxPrice?: number; // cents
  sort?: "newest" | "price-asc" | "price-desc";
};

/** Browse and search: only active items, matching words in title, brand or description. */
function sampleSearch(query: ListingQuery): Listing[] {
  const words = (query.q ?? "").toLowerCase().split(/\s+/).filter(Boolean);

  const results = LISTINGS.filter((l) => {
    if (l.status !== "active") return false;
    if (query.category && l.category !== query.category) return false;
    if (query.condition && l.condition !== query.condition) return false;
    if (query.minPrice != null && l.priceCents < query.minPrice) return false;
    if (query.maxPrice != null && l.priceCents > query.maxPrice) return false;
    if (words.length) {
      const haystack = `${l.title} ${l.brand ?? ""} ${l.description} ${l.subcategory}`.toLowerCase();
      if (!words.every((w) => haystack.includes(w))) return false;
    }
    return true;
  });

  switch (query.sort) {
    case "price-asc":
      return results.sort((a, b) => a.priceCents - b.priceCents);
    case "price-desc":
      return results.sort((a, b) => b.priceCents - a.priceCents);
    default:
      return results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

/** Sample listing by id. Sample orders keep using these until Chunk 4. */
export function getSampleListing(id: string): Listing | undefined {
  return LISTINGS.find((l) => l.id === id);
}

export const SAMPLE_SELLER_ID = sellers.jd.id;

// Public API ------------------------------------------------------------------

export async function searchListings(query: ListingQuery = {}): Promise<Listing[]> {
  return isSupabaseConfigured ? db.searchListings(query) : sampleSearch(query);
}

export async function getRecentListings(limit = 8): Promise<Listing[]> {
  return (await searchListings({ sort: "newest" })).slice(0, limit);
}

/** Any listing that is for sale, reserved or sold. Paused listings only show to their seller. */
export async function getListing(id: string): Promise<Listing | undefined> {
  return isSupabaseConfigured ? db.getListing(id) : getSampleListing(id);
}

/** Every listing of one seller, including paused and sold ones. */
export async function getListingsBySeller(sellerId: string): Promise<Listing[]> {
  return isSupabaseConfigured ? db.getListingsBySeller(sellerId) : LISTINGS.filter((l) => l.seller.id === sellerId);
}

export async function countByCategory(): Promise<Record<string, number>> {
  if (isSupabaseConfigured) return db.countByCategory();
  const counts: Record<string, number> = {};
  for (const l of LISTINGS) {
    if (l.status === "active") counts[l.category] = (counts[l.category] ?? 0) + 1;
  }
  return counts;
}
