import { revalidateTag } from "next/cache";
import { after, NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { SHIP_BY_DAYS } from "@/lib/catalog";
import { sendEmail } from "@/lib/email";
import { buyLabelForOrder } from "@/lib/fulfillment";
import { LISTINGS_TAG } from "@/lib/listings-db";
import { formatUSD } from "@/lib/money";
import { cancelUnpaidOrder } from "@/lib/orders-server";
import { siteUrl } from "@/lib/site";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/server";

// Stripe calls this after a checkout. Every event is checked against the
// webhook signing secret, and each update only applies once, so Stripe's
// retries can't mark an order paid twice.
// Gives the label purchase that runs after the reply time to finish.
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature) return new NextResponse("Not configured", { status: 400 });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return new NextResponse("Bad signature", { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const orderId = session.metadata?.order_id;
  if (!orderId) return NextResponse.json({ received: true });

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      // The USPS label takes a few seconds to buy, so it happens after Stripe gets its reply.
      if (session.payment_status === "paid" && (await markPaid(orderId, session))) {
        after(() => buyLabelForOrder(orderId, true));
      }
      break;
    case "checkout.session.expired":
    case "checkout.session.async_payment_failed":
      if (await cancelUnpaidOrder(orderId)) revalidateTag(LISTINGS_TAG, { expire: 0 });
      break;
  }
  return NextResponse.json({ received: true });
}

/** Records the payment, marks the item sold and emails the buyer. True the first time only. */
async function markPaid(orderId: string, session: Stripe.Checkout.Session) {
  const admin = createAdminClient();
  const paidAt = new Date();
  const shipBy = new Date(paidAt.getTime() + SHIP_BY_DAYS * 86_400_000);
  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;

  const { data } = await admin
    .from("orders")
    .update({
      status: "paid",
      paid_at: paidAt.toISOString(),
      ship_by: shipBy.toISOString(),
      stripe_payment_intent_id: paymentIntentId ?? null,
    })
    .eq("id", orderId)
    .eq("status", "pending_payment")
    .select("id, number, listing_id, buyer_id, seller_id, item_cents, shipping_cents, commission_cents, ship_to")
    .single();
  if (!data) return false; // already handled, or cancelled before payment

  // The seller's transfer is drawn from this charge.
  if (paymentIntentId) {
    const intent = await getStripe().paymentIntents.retrieve(paymentIntentId);
    const chargeId = typeof intent.latest_charge === "string" ? intent.latest_charge : intent.latest_charge?.id;
    if (chargeId) await admin.from("orders").update({ stripe_charge_id: chargeId }).eq("id", orderId);
  }

  const { data: listing } = await admin
    .from("listings")
    .update({ status: "sold", reserved_until: null })
    .eq("id", data.listing_id)
    .select("title")
    .single();
  revalidateTag(LISTINGS_TAG, { expire: 0 });

  const title = listing?.title ?? "your item";
  const shipByText = shipBy.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const buyerEmail = session.customer_details?.email ?? data.ship_to?.email;

  // The seller's "You sold it" email goes out with their USPS label (lib/fulfillment.ts).
  if (buyerEmail) {
    await sendEmail({
      to: buyerEmail,
      subject: `Order ${data.number}: thanks for your purchase`,
      text: [
        `Thanks for buying ${title} on Outdoor Supply Central.`,
        ``,
        `Item: ${formatUSD(data.item_cents)}`,
        `USPS shipping: ${formatUSD(data.shipping_cents)}`,
        `Total paid: ${formatUSD(data.item_cents + data.shipping_cents)}`,
        ``,
        `The seller has until ${shipByText} to ship it. We'll email you when it's on its way.`,
        `If it doesn't ship in time, you get a full refund automatically.`,
        ``,
        `Track your order: ${siteUrl()}/orders/${data.number}`,
      ].join("\n"),
    });
  }
  return true;
}
