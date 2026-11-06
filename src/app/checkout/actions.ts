"use server";

import { updateTag } from "next/cache";
import { headers } from "next/headers";
import { requireUser, type CurrentUser } from "@/lib/auth";
import { normalizePhone, type PackageSizeId } from "@/lib/catalog";
import { LISTINGS_TAG } from "@/lib/listings-db";
import { commissionFor } from "@/lib/money";
import { cancelUnpaidOrder, commissionRate, holdListing, HOLD_MINUTES, releaseExpiredHold } from "@/lib/orders-server";
import { cheapestUspsRate, isDeliverable, isShippoConfigured, type ShippoAddress, type UspsRate } from "@/lib/shippo";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/server";

export type ShipTo = { name: string; line1: string; line2: string; city: string; state: string; zip: string };

export type QuoteResult =
  | { ok: true; shippingCents: number; service: string; estimatedDays: number | null }
  | { ok: false; error: string };

export type CheckoutResult = { ok: true; url: string } | { ok: false; error: string };

type Sale = {
  listing: { id: string; sellerId: string; title: string; priceCents: number; packageSize: PackageSizeId };
  to: ShippoAddress;
  rate: UspsRate;
};

function checkShipTo(a: ShipTo): string | null {
  if (!a.name.trim() || !a.line1.trim() || !a.city.trim()) return "Fill in your name, street and city.";
  if (!/^[A-Z]{2}$/.test(a.state)) return "Pick your state.";
  if (!/^\d{5}$/.test(a.zip.trim())) return "Enter a 5-digit ZIP code.";
  return null;
}

/**
 * Everything a sale needs, read fresh from the database rather than the page
 * cache: the item is still for sale, the seller can be paid and ship, and USPS
 * has a rate to this address. Not exported, so the browser can't call it.
 */
async function prepareSale(listingId: string, buyer: CurrentUser, shipTo: ShipTo): Promise<Sale | { error: string }> {
  const addressError = checkShipTo(shipTo);
  if (addressError) return { error: addressError };
  if (!isShippoConfigured) return { error: "Shipping rates aren't connected yet." };

  const admin = createAdminClient();
  await releaseExpiredHold(listingId);
  const { data: listing } = await admin
    .from("listings")
    .select("id, seller_id, title, price_cents, package_size, status")
    .eq("id", listingId)
    .maybeSingle();
  if (!listing) return { error: "This item isn't available any more." };
  if (listing.status === "reserved")
    return { error: "Someone else is checking out this item. Try again in half an hour." };
  if (listing.status !== "active") return { error: "This item isn't available any more." };
  if (listing.seller_id === buyer.id) return { error: "This is your own listing." };

  const [{ data: from }, { data: seller }] = await Promise.all([
    admin
      .from("seller_addresses")
      .select("name, line1, line2, city, state, zip, phone")
      .eq("user_id", listing.seller_id)
      .maybeSingle(),
    admin.from("profiles").select("payouts_enabled").eq("id", listing.seller_id).single(),
  ]);
  // USPS refuses labels without a real phone number, so the sale would only refund itself later.
  if (!from || !normalizePhone(from.phone ?? "") || (isStripeConfigured && !seller?.payouts_enabled)) {
    return { error: "This seller hasn't finished setting up shipping and payouts yet." };
  }

  const to = {
    name: shipTo.name.trim(),
    street1: shipTo.line1.trim(),
    street2: shipTo.line2.trim(),
    city: shipTo.city.trim(),
    state: shipTo.state,
    zip: shipTo.zip.trim(),
  };
  if (!(await isDeliverable(to))) return { error: "USPS can't find that address. Check the street and ZIP code." };
  const rate = await cheapestUspsRate(
    {
      name: from.name,
      street1: from.line1,
      street2: from.line2 ?? "",
      city: from.city,
      state: from.state,
      zip: from.zip,
    },
    to,
    listing.package_size,
  );
  if (!rate) return { error: "USPS doesn't offer a rate for this address." };

  return {
    listing: {
      id: listing.id,
      sellerId: listing.seller_id,
      title: listing.title,
      priceCents: listing.price_cents,
      packageSize: listing.package_size,
    },
    to,
    rate,
  };
}

/** The live USPS rate from the seller to this buyer. The seller's address never leaves the server. */
export async function quoteShipping(listingId: string, shipTo: ShipTo): Promise<QuoteResult> {
  const buyer = await requireUser(`/checkout/${listingId}`);
  try {
    const sale = await prepareSale(listingId, buyer, shipTo);
    if ("error" in sale) return { ok: false, error: sale.error };
    return {
      ok: true,
      shippingCents: sale.rate.amountCents,
      service: sale.rate.service,
      estimatedDays: sale.rate.estimatedDays,
    };
  } catch {
    return { ok: false, error: "We couldn't get a shipping rate just now. Please try again." };
  }
}

/**
 * Holds the item, records the order with its commission, and opens Stripe
 * Checkout. The webhook marks the order paid; an expired or cancelled checkout
 * releases the hold.
 */
export async function startCheckout(listingId: string, shipTo: ShipTo): Promise<CheckoutResult> {
  const buyer = await requireUser(`/checkout/${listingId}`);
  if (!isStripeConfigured) return { ok: false, error: "Payments aren't connected yet." };

  let sale: Sale | { error: string };
  try {
    sale = await prepareSale(listingId, buyer, shipTo);
  } catch {
    return { ok: false, error: "We couldn't get a shipping rate just now. Please try again." };
  }
  if ("error" in sale) return { ok: false, error: sale.error };

  // One buyer at a time: the hold, plus a database rule allowing only one live order per item.
  if (!(await holdListing(sale.listing.id))) {
    return { ok: false, error: "Someone else is checking out this item. Try again in half an hour." };
  }

  const admin = createAdminClient();
  const rate = await commissionRate();
  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      listing_id: sale.listing.id,
      buyer_id: buyer.id,
      seller_id: sale.listing.sellerId,
      status: "pending_payment",
      item_cents: sale.listing.priceCents,
      shipping_cents: sale.rate.amountCents,
      commission_rate: rate,
      commission_cents: commissionFor(sale.listing.priceCents, rate),
      ship_to: {
        name: sale.to.name,
        line1: sale.to.street1,
        line2: sale.to.street2 ?? "",
        city: sale.to.city,
        state: sale.to.state,
        zip: sale.to.zip,
        email: buyer.email,
        service: sale.rate.service,
      },
      shippo_rate_id: sale.rate.rateId,
    })
    .select("id, number")
    .single();
  if (orderError || !order) {
    await admin.from("listings").update({ status: "active", reserved_until: null }).eq("id", sale.listing.id);
    return { ok: false, error: "We couldn't start checkout. Please try again." };
  }

  const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  try {
    const session = await getStripe().checkout.sessions.create(
      {
        mode: "payment",
        // Cards and card wallets only: bank debits and pay-later can settle days later or reverse,
        // which doesn't fit a 5-day ship-by. Always in US dollars.
        excluded_payment_method_types: [
          "us_bank_account",
          "pay_by_bank",
          "klarna",
          "affirm",
          "afterpay_clearpay",
          "zip",
          "sunbit",
          "cashapp",
          "amazon_pay",
          "crypto",
          "customer_balance",
        ],
        adaptive_pricing: { enabled: false },
        customer_email: buyer.email || undefined,
        client_reference_id: order.id,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: sale.listing.priceCents,
              product_data: { name: sale.listing.title },
            },
          },
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: sale.rate.amountCents,
              product_data: { name: `USPS ${sale.rate.service} shipping` },
            },
          },
        ],
        // The seller's share is transferred from this payment after USPS's first scan (Chunk 5).
        payment_intent_data: { transfer_group: order.number, metadata: { order_id: order.id } },
        metadata: { order_id: order.id, listing_id: sale.listing.id },
        expires_at: Math.floor(Date.now() / 1000) + (HOLD_MINUTES - 1) * 60,
        success_url: `${origin}/orders/${order.number}?new=1`,
        cancel_url: `${origin}/checkout/cancel?order=${order.id}`,
      },
      { idempotencyKey: `checkout-${order.id}` },
    );
    await admin.from("orders").update({ stripe_checkout_session_id: session.id }).eq("id", order.id);
    updateTag(LISTINGS_TAG);
    if (!session.url) throw new Error("Stripe returned no checkout URL");
    return { ok: true, url: session.url };
  } catch {
    await cancelUnpaidOrder(order.id);
    updateTag(LISTINGS_TAG);
    return { ok: false, error: "We couldn't open the payment page. Please try again." };
  }
}
