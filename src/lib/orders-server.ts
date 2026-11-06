import "server-only";
import { DEFAULT_COMMISSION_RATE } from "./money";
import { createAdminClient } from "./supabase/server";

// Order bookkeeping that runs with the admin client: holding an item during
// checkout, releasing the hold, and marking it sold. Buyers and sellers can
// only read orders (row level security); every write happens here.

/** How long an item stays held while the buyer is on Stripe's checkout page. */
export const HOLD_MINUTES = 31;

export async function commissionRate() {
  const { data } = await createAdminClient().from("settings").select("value").eq("key", "commission_rate").single();
  const rate = Number(data?.value);
  return Number.isFinite(rate) && rate >= 0 && rate < 1 ? rate : DEFAULT_COMMISSION_RATE;
}

/** Puts a listing on hold for one buyer. Returns false if someone else got there first. */
export async function holdListing(listingId: string) {
  const until = new Date(Date.now() + HOLD_MINUTES * 60_000).toISOString();
  const { data } = await createAdminClient()
    .from("listings")
    .update({ status: "reserved", reserved_until: until })
    .eq("id", listingId)
    .eq("status", "active")
    .select("id");
  return Boolean(data?.length);
}

/** Cancels an unpaid order and puts its item back on sale. Safe to call twice. */
export async function cancelUnpaidOrder(orderId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("orders")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", orderId)
    .eq("status", "pending_payment")
    .select("listing_id");
  const listingId = data?.[0]?.listing_id;
  if (listingId) {
    await admin
      .from("listings")
      .update({ status: "active", reserved_until: null })
      .eq("id", listingId)
      .eq("status", "reserved");
  }
  return Boolean(listingId);
}

/**
 * Releases a hold whose time ran out, in case Stripe's "checkout expired"
 * message never arrived. Returns true if the listing is free again.
 */
export async function releaseExpiredHold(listingId: string) {
  const admin = createAdminClient();
  const { data: listing } = await admin
    .from("listings")
    .select("status, reserved_until")
    .eq("id", listingId)
    .maybeSingle();
  if (listing?.status !== "reserved" || !listing.reserved_until) return false;
  if (new Date(listing.reserved_until).getTime() > Date.now()) return false;

  const { data: pending } = await admin
    .from("orders")
    .select("id")
    .eq("listing_id", listingId)
    .eq("status", "pending_payment");
  for (const order of pending ?? []) await cancelUnpaidOrder(order.id);
  if (!pending?.length) {
    await admin.from("listings").update({ status: "active", reserved_until: null }).eq("id", listingId);
  }
  return true;
}
