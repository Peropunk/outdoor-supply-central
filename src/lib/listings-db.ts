import "server-only";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { cacheLife, cacheTag } from "next/cache";
import type { CategorySlug, ConditionId, PackageSizeId } from "./catalog";
import type { Listing, ListingQuery, ListingStatus } from "./listings";
import { photoUrl, supabaseAnonKey, supabaseUrl } from "./supabase/config";
import { createClient } from "./supabase/server";

// Listings from Supabase. Public reads run without a session (so they can be
// cached and shared by every visitor) and see only what row level security
// allows anyone to see. Seller actions call updateTag(LISTINGS_TAG) to refresh.

export const LISTINGS_TAG = "listings";
const PAGE_SIZE = 60;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const SELECT =
  "id, seller_id, title, brand, category, subcategory, condition, flaws, description, price_cents, package_size, status, created_at, listing_photos(storage_path, alt, position)";

type Row = {
  id: string;
  seller_id: string;
  title: string;
  brand: string | null;
  category: CategorySlug;
  subcategory: string | null;
  condition: ConditionId;
  flaws: string;
  description: string;
  price_cents: number;
  package_size: PackageSizeId;
  status: ListingStatus;
  created_at: string;
  listing_photos: { storage_path: string; alt: string; position: number }[];
};

type PublicProfile = { id: string; display_name: string; city: string | null; state: string | null };

function anonClient() {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function toListings(client: SupabaseClient, rows: Row[]): Promise<Listing[]> {
  const sellerIds = [...new Set(rows.map((r) => r.seller_id))];
  const profiles = new Map<string, PublicProfile>();
  if (sellerIds.length) {
    const { data } = await client.from("public_profiles").select("id, display_name, city, state").in("id", sellerIds);
    for (const p of (data ?? []) as PublicProfile[]) profiles.set(p.id, p);
  }

  return rows.map((r) => {
    const seller = profiles.get(r.seller_id);
    return {
      id: r.id,
      title: r.title,
      brand: r.brand ?? undefined,
      category: r.category,
      subcategory: r.subcategory ?? "",
      condition: r.condition,
      flaws: r.flaws,
      description: r.description,
      priceCents: r.price_cents,
      packageSize: r.package_size,
      photos: [...r.listing_photos]
        .sort((a, b) => a.position - b.position)
        .map((p) => ({ url: photoUrl(p.storage_path), alt: p.alt || r.title })),
      seller: {
        id: r.seller_id,
        displayName: seller?.display_name || "Outdoor Supply Central seller",
        city: seller?.city ?? null,
        state: seller?.state ?? null,
      },
      createdAt: r.created_at,
      status: r.status,
    };
  });
}

/** Active listings matching words in the title, brand or description, plus filters. */
export async function searchListings(query: ListingQuery): Promise<Listing[]> {
  "use cache";
  cacheTag(LISTINGS_TAG);
  cacheLife("minutes");

  const client = anonClient();
  let request = client.from("listings").select(SELECT).eq("status", "active");
  if (query.q) request = request.textSearch("search", query.q, { type: "websearch", config: "english" });
  if (query.category) request = request.eq("category", query.category);
  if (query.condition) request = request.eq("condition", query.condition);
  if (query.minPrice != null) request = request.gte("price_cents", query.minPrice);
  if (query.maxPrice != null) request = request.lte("price_cents", query.maxPrice);

  const ordered =
    query.sort === "price-asc"
      ? request.order("price_cents", { ascending: true })
      : query.sort === "price-desc"
        ? request.order("price_cents", { ascending: false })
        : request.order("created_at", { ascending: false });

  const { data, error } = await ordered.limit(PAGE_SIZE);
  if (error) throw new Error(`Listing search failed: ${error.message}`);
  return toListings(client, data as Row[]);
}

export async function getListing(id: string): Promise<Listing | undefined> {
  "use cache";
  cacheTag(LISTINGS_TAG);
  cacheLife("minutes");

  if (!UUID.test(id)) return undefined;
  const client = anonClient();
  const { data, error } = await client.from("listings").select(SELECT).eq("id", id).maybeSingle();
  if (error) throw new Error(`Listing lookup failed: ${error.message}`);
  if (!data) return undefined;
  return (await toListings(client, [data as Row]))[0];
}

export async function countByCategory(): Promise<Record<string, number>> {
  "use cache";
  cacheTag(LISTINGS_TAG);
  cacheLife("minutes");

  const { data, error } = await anonClient().from("listings").select("category").eq("status", "active");
  if (error) throw new Error(`Category count failed: ${error.message}`);
  const counts: Record<string, number> = {};
  for (const { category } of data) counts[category] = (counts[category] ?? 0) + 1;
  return counts;
}

/** A seller's own listings, including paused ones. Runs as the signed-in user. */
export async function getListingsBySeller(sellerId: string): Promise<Listing[]> {
  const client = await createClient();
  const { data, error } = await client
    .from("listings")
    .select(SELECT)
    .eq("seller_id", sellerId)
    .neq("status", "removed")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Seller listings failed: ${error.message}`);
  return toListings(client, data as Row[]);
}
