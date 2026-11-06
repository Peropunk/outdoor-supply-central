import "server-only";
import { getListing, type Listing } from "./listings";
import type { Order, OrderStatus } from "./orders";
import { createClient } from "./supabase/server";

// Real orders from Supabase. Row level security only returns orders where the
// signed-in user is the buyer or seller (or an admin).

type Row = {
  number: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  status: OrderStatus | "pending_payment";
  item_cents: number;
  shipping_cents: number;
  commission_cents: number;
  ship_to: { name?: string; city?: string; state?: string } | null;
  tracking_number: string | null;
  paid_at: string | null;
  ship_by: string | null;
  label_ready_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
};

const COLUMNS =
  "number, listing_id, buyer_id, seller_id, status, item_cents, shipping_cents, commission_cents, ship_to, tracking_number, paid_at, ship_by, label_ready_at, shipped_at, delivered_at, created_at";

export type OrderView = { order: Order; listing: Listing; role: "buyer" | "seller" };

function toOrder(r: Row): Order {
  const events: Order["events"] = [];
  if (r.paid_at) events.push({ step: "Paid", at: r.paid_at });
  if (r.label_ready_at) events.push({ step: "Label ready", at: r.label_ready_at });
  if (r.shipped_at) events.push({ step: "Shipped", at: r.shipped_at });
  if (r.delivered_at) events.push({ step: "Delivered", at: r.delivered_at });
  return {
    number: r.number,
    listingId: r.listing_id,
    buyer: { name: r.ship_to?.name ?? "Buyer", city: r.ship_to?.city ?? "", state: r.ship_to?.state ?? "" },
    status: r.status === "pending_payment" ? "paid" : r.status,
    itemCents: r.item_cents,
    shippingCents: r.shipping_cents,
    commissionCents: r.commission_cents,
    paidAt: r.paid_at ?? r.created_at,
    shipBy: r.ship_by ?? r.created_at,
    events,
    tracking: r.tracking_number ?? undefined,
  };
}

async function withListings(rows: Row[], userId: string): Promise<OrderView[]> {
  const views = await Promise.all(
    rows.map(async (r) => {
      const listing = await getListing(r.listing_id);
      return listing ? { order: toOrder(r), listing, role: r.seller_id === userId ? "seller" : "buyer" } : null;
    }),
  );
  return views.filter((v): v is OrderView => v !== null);
}

/** One paid order, if the user is its buyer or seller. */
export async function getOrderForUser(number: string, userId: string): Promise<OrderView | undefined> {
  const supabase = await createClient();
  const { data } = await supabase.from("orders").select(COLUMNS).eq("number", number).maybeSingle();
  if (!data || data.status === "pending_payment") return undefined;
  return (await withListings([data as Row], userId))[0];
}

/** The user's sales and purchases, newest first. Unpaid and cancelled checkouts are left out. */
export async function getOrdersForUser(userId: string): Promise<OrderView[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select(COLUMNS)
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .not("status", "in", "(pending_payment,cancelled)")
    .order("created_at", { ascending: false });
  return withListings((data ?? []) as Row[], userId);
}
