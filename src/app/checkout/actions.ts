"use server";

import { requireUser } from "@/lib/auth";
import { getListing } from "@/lib/listings";
import { cheapestUspsRate, isDeliverable, isShippoConfigured } from "@/lib/shippo";
import { createAdminClient } from "@/lib/supabase/server";

export type ShipTo = { name: string; line1: string; line2: string; city: string; state: string; zip: string };

export type QuoteResult =
  | { ok: true; shippingCents: number; service: string; estimatedDays: number | null }
  | { ok: false; error: string };

function checkShipTo(a: ShipTo): string | null {
  if (!a.name.trim() || !a.line1.trim() || !a.city.trim()) return "Fill in your name, street and city.";
  if (!/^[A-Z]{2}$/.test(a.state)) return "Pick your state.";
  if (!/^\d{5}$/.test(a.zip.trim())) return "Enter a 5-digit ZIP code.";
  return null;
}

/** The live USPS rate from the seller to this buyer. The seller's address never leaves the server. */
export async function quoteShipping(listingId: string, shipTo: ShipTo): Promise<QuoteResult> {
  const buyer = await requireUser(`/checkout/${listingId}`);

  const addressError = checkShipTo(shipTo);
  if (addressError) return { ok: false, error: addressError };
  if (!isShippoConfigured) return { ok: false, error: "Shipping rates aren't connected yet." };

  const listing = await getListing(listingId);
  if (!listing || listing.status !== "active") return { ok: false, error: "This item isn't available any more." };
  if (listing.seller.id === buyer.id) return { ok: false, error: "This is your own listing." };

  const to = {
    name: shipTo.name.trim(),
    street1: shipTo.line1.trim(),
    street2: shipTo.line2.trim(),
    city: shipTo.city.trim(),
    state: shipTo.state,
    zip: shipTo.zip.trim(),
  };

  try {
    // Row level security keeps seller addresses private, so this read needs the admin client.
    const { data: from } = await createAdminClient()
      .from("seller_addresses")
      .select("name, line1, line2, city, state, zip, phone")
      .eq("user_id", listing.seller.id)
      .maybeSingle();
    if (!from?.phone) return { ok: false, error: "This seller hasn't finished setting up shipping yet." };

    if (!(await isDeliverable(to))) {
      return { ok: false, error: "USPS can't find that address. Check the street and ZIP code." };
    }
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
      listing.packageSize,
    );
    if (!rate) return { ok: false, error: "USPS doesn't offer a rate for this address." };
    return { ok: true, shippingCents: rate.amountCents, service: rate.service, estimatedDays: rate.estimatedDays };
  } catch {
    return { ok: false, error: "We couldn't get a shipping rate just now. Please try again." };
  }
}
