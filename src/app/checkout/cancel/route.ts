import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { LISTINGS_TAG } from "@/lib/listings-db";
import { cancelUnpaidOrder } from "@/lib/orders-server";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/server";

// Stripe Checkout's "back" link. Ends the checkout and puts the item straight
// back on sale, instead of waiting 30 minutes for the session to expire.
export async function GET(request: NextRequest) {
  const { origin, searchParams } = request.nextUrl;
  const orderId = searchParams.get("order") ?? "";
  const user = await getCurrentUser();

  const { data: order } = await createAdminClient()
    .from("orders")
    .select("id, listing_id, buyer_id, status, stripe_checkout_session_id")
    .eq("id", orderId)
    .maybeSingle();
  if (!user || !order || order.buyer_id !== user.id) return NextResponse.redirect(`${origin}/browse`);

  if (order.status === "pending_payment") {
    let stillOpen = true;
    if (order.stripe_checkout_session_id) {
      try {
        await getStripe().checkout.sessions.expire(order.stripe_checkout_session_id);
      } catch {
        // Already completed or expired: let the webhook record what happened.
        const session = await getStripe().checkout.sessions.retrieve(order.stripe_checkout_session_id);
        stillOpen = session.status !== "complete";
      }
    }
    if (stillOpen) {
      await cancelUnpaidOrder(order.id);
      revalidateTag(LISTINGS_TAG, { expire: 0 });
    }
  }
  return NextResponse.redirect(`${origin}/checkout/${order.listing_id}?cancelled=1`);
}
