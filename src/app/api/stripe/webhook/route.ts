import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { SHIP_BY_DAYS } from "@/lib/catalog";
import { sendEmail } from "@/lib/email";
import { LISTINGS_TAG } from "@/lib/listings-db";
import { formatUSD } from "@/lib/money";
import { cancelUnpaidOrder } from "@/lib/orders-server";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/server";

// Stripe calls this after a checkout. Every event is checked against the
// webhook signing secret, and each update only applies once, so Stripe's
// retries can't mark an order paid twice.
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
      if (session.payment_status === "paid") await markPaid(orderId, session);
      break;
    case "checkout.session.expired":
    case "checkout.session.async_payment_failed":
      if (await cancelUnpaidOrder(orderId)) revalidateTag(LISTINGS_TAG, { expire: 0 });
      break;
  }
  return NextResponse.json({ received: true });
}

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
  if (!data) return; // already handled, or cancelled before payment

  // The charge ID is what the seller's transfer is linked to in Chunk 5.
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

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const title = listing?.title ?? "your item";
  const shipByText = shipBy.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const { data: seller } = await admin.auth.admin.getUserById(data.seller_id);
  const buyerEmail = session.customer_details?.email ?? data.ship_to?.email;

  await Promise.all([
    buyerEmail &&
      sendEmail({
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
          `Track your order: ${site}/orders/${data.number}`,
        ].join("\n"),
      }),
    seller?.user?.email &&
      sendEmail({
        to: seller.user.email,
        subject: `You sold it: ${title}`,
        text: [
          `Good news: ${title} sold for ${formatUSD(data.item_cents)}.`,
          `You earn ${formatUSD(data.item_cents - data.commission_cents)} after fees, paid when USPS scans the package.`,
          ``,
          `Please ship it by ${shipByText}. Your prepaid USPS label and QR code will be on the order page.`,
          ``,
          `Order ${data.number}: ${site}/orders/${data.number}?view=seller`,
        ].join("\n"),
      }),
  ]);
}
