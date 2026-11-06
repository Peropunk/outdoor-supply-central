import "server-only";
import { revalidateTag } from "next/cache";
import { normalizePhone, SHIP_REMINDER_DAY } from "./catalog";
import { sendEmail } from "./email";
import { LISTINGS_TAG } from "./listings-db";
import { formatUSD } from "./money";
import { releaseExpiredHold } from "./orders-server";
import { buyLabel, isShippoConfigured, voidLabel } from "./shippo";
import { siteUrl } from "./site";
import { getStripe, isStripeConfigured } from "./stripe";
import { uspsTrackingUrl } from "./tracking";
import { createAdminClient } from "./supabase/server";

// Everything that happens to an order after payment (Chunk 5), run with the
// admin client: buy the USPS label, follow USPS tracking, pay the seller once
// at the first scan, refund, and the daily ship-by checks. Each step claims
// the order with a conditional update first, so Stripe or Shippo retries, the
// daily job and an admin click can't do the same thing twice.

const FIELDS =
  "id, number, status, listing_id, buyer_id, seller_id, item_cents, shipping_cents, commission_cents, seller_share_cents, ship_to, stripe_payment_intent_id, stripe_charge_id, shippo_transaction_id, tracking_number, paid_at, ship_by";

type OrderRow = {
  id: string;
  number: string;
  status: "pending_payment" | "paid" | "label_ready" | "shipped" | "delivered" | "cancelled" | "refunded";
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  item_cents: number;
  shipping_cents: number;
  commission_cents: number;
  seller_share_cents: number;
  ship_to: { name: string; line1: string; line2?: string; city: string; state: string; zip: string; email?: string };
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;
  shippo_transaction_id: string | null;
  tracking_number: string | null;
  paid_at: string | null;
  ship_by: string | null;
};

/** Not yet handed to USPS: the label can still be voided and the item relisted. */
const UNSHIPPED = ["paid", "label_ready"] as const;
/** A label purchase in progress, so a second caller doesn't buy another. Older than this, it's treated as stuck. */
const CLAIM_PREFIX = "pending:";
const CLAIM_STALE_MS = 15 * 60_000;

const dayFmt = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" });

async function emailOf(userId: string) {
  const { data } = await createAdminClient().auth.admin.getUserById(userId);
  return data?.user?.email ?? null;
}

async function titleOf(listingId: string) {
  const { data } = await createAdminClient().from("listings").select("title").eq("id", listingId).maybeSingle();
  return (data?.title as string | undefined) ?? "your item";
}

function orderLink(number: string) {
  return `${siteUrl()}/orders/${number}`;
}

// Labels ----------------------------------------------------------------------

/**
 * Buys the USPS label for a paid order and emails the seller. `firstTry` is the
 * call straight after payment; the daily job retries any that failed.
 */
export async function buyLabelForOrder(orderId: string, firstTry: boolean) {
  if (!isShippoConfigured) return false;
  const admin = createAdminClient();
  const claim = `${CLAIM_PREFIX}${orderId}:${Date.now()}`;
  const { data } = await admin
    .from("orders")
    .update({ shippo_transaction_id: claim })
    .eq("id", orderId)
    .eq("status", "paid")
    .is("shippo_transaction_id", null)
    .select(FIELDS)
    .maybeSingle();
  const order = data as OrderRow | null;
  if (!order) return false;

  const [{ data: from }, { data: listing }, sellerEmail] = await Promise.all([
    admin
      .from("seller_addresses")
      .select("name, line1, line2, city, state, zip, phone")
      .eq("user_id", order.seller_id)
      .maybeSingle(),
    admin.from("listings").select("title, package_size").eq("id", order.listing_id).single(),
    emailOf(order.seller_id),
  ]);
  const title = listing?.title ?? "your item";

  let label: Awaited<ReturnType<typeof buyLabel>> | null = null;
  try {
    if (!from || !normalizePhone(from.phone ?? "") || !sellerEmail || !listing) {
      throw new Error("Seller address, phone or email missing or invalid");
    }
    label = await buyLabel(
      {
        name: from.name,
        street1: from.line1,
        street2: from.line2 ?? "",
        city: from.city,
        state: from.state,
        zip: from.zip,
        phone: from.phone,
        email: sellerEmail,
      },
      {
        name: order.ship_to.name,
        street1: order.ship_to.line1,
        street2: order.ship_to.line2 ?? "",
        city: order.ship_to.city,
        state: order.ship_to.state,
        zip: order.ship_to.zip,
        email: order.ship_to.email,
      },
      listing.package_size,
      order.number,
    );
  } catch (error) {
    console.error(`[label failed] ${order.number}: ${error instanceof Error ? error.message : error}`);
    await admin
      .from("orders")
      .update({ shippo_transaction_id: null })
      .eq("id", orderId)
      .eq("shippo_transaction_id", claim);
  }

  if (label) {
    const { data: saved } = await admin
      .from("orders")
      .update({
        status: "label_ready",
        label_ready_at: new Date().toISOString(),
        shippo_transaction_id: label.transactionId,
        label_url: label.labelUrl,
        qr_code_url: label.qrCodeUrl,
        tracking_number: label.trackingNumber,
        tracking_status: "PRE_TRANSIT",
      })
      .eq("id", orderId)
      .eq("shippo_transaction_id", claim)
      .eq("status", "paid")
      .select("id");
    if (!saved?.length) {
      // Refunded while the label was being bought: don't leave postage paid for nothing.
      await voidLabel(label.transactionId).catch(() => {});
      return false;
    }
    if (label.costCents > order.shipping_cents) {
      console.warn(`[label cost] ${order.number}: USPS now ${label.costCents}c, buyer paid ${order.shipping_cents}c`);
    }
  }

  if (sellerEmail && (label || firstTry)) {
    await sendEmail({
      to: sellerEmail,
      subject: label && !firstTry ? `Your USPS label is ready: ${title}` : `You sold it: ${title}`,
      text: [
        firstTry
          ? `Good news: ${title} sold for ${formatUSD(order.item_cents)}.`
          : `Your prepaid USPS label for ${title} is ready.`,
        `You earn ${formatUSD(order.seller_share_cents)} after fees, paid as soon as USPS scans the package.`,
        ``,
        `Please ship it by ${order.ship_by ? dayFmt.format(new Date(order.ship_by)) : "the date on your order page"}.`,
        ``,
        ...(label
          ? [
              `How to ship:`,
              `1. Pack it snugly in a box no bigger than its package size. Padding stops rattles.`,
              `2. Take it to any Post Office and show the QR code at the counter. No printer needed.`,
              `   QR code and label: ${orderLink(order.number)}`,
              `3. Or print the label and drop the package in any USPS box: ${label.labelUrl}`,
            ]
          : [
              `We couldn't make your prepaid USPS label yet; we'll email it as soon as it's ready.`,
              `USPS needs your full ship-from address and a real phone number. Please check both in Account settings: ${siteUrl()}/account`,
            ]),
        ``,
        `Order ${order.number}: ${orderLink(order.number)}`,
      ].join("\n"),
    });
  }
  return Boolean(label);
}

// Tracking --------------------------------------------------------------------

export type TrackingStatus = "UNKNOWN" | "PRE_TRANSIT" | "TRANSIT" | "DELIVERED" | "RETURNED" | "FAILURE";

/**
 * Applies a USPS tracking update. The first acceptance or in-transit scan marks
 * the order shipped and pays the seller; delivery closes it.
 */
export async function applyTracking(trackingNumber: string, status: TrackingStatus, at = new Date()) {
  const admin = createAdminClient();
  const { data } = await admin.from("orders").select(FIELDS).eq("tracking_number", trackingNumber).maybeSingle();
  const order = data as OrderRow | null;
  if (!order) return false;
  await admin.from("orders").update({ tracking_status: status }).eq("id", order.id);

  if (status === "TRANSIT" || status === "DELIVERED") {
    const { data: shipped } = await admin
      .from("orders")
      .update({ status: "shipped", shipped_at: at.toISOString() })
      .eq("id", order.id)
      .in("status", UNSHIPPED)
      .select("id");
    if (shipped?.length) {
      const buyerEmail = order.ship_to.email ?? (await emailOf(order.buyer_id));
      const title = await titleOf(order.listing_id);
      if (buyerEmail) {
        await sendEmail({
          to: buyerEmail,
          subject: `It's on the way: ${title}`,
          text: [
            `USPS has your package. ${title} is on its way to you.`,
            ``,
            `USPS tracking: ${trackingNumber}`,
            uspsTrackingUrl(trackingNumber),
            ``,
            `Order ${order.number}: ${orderLink(order.number)}`,
          ].join("\n"),
        });
      }
      await paySeller(order.id);
    }
  }

  if (status === "DELIVERED") {
    await admin
      .from("orders")
      .update({ status: "delivered", delivered_at: at.toISOString() })
      .eq("id", order.id)
      .eq("status", "shipped");
  }
  return true;
}

// Seller payouts --------------------------------------------------------------

/**
 * Transfers the seller's share once, after USPS has the package. The payouts
 * table allows one row per order, and the Stripe call is keyed to the order, so
 * a repeat (a retried webhook, the daily job) can never pay twice.
 */
export async function paySeller(orderId: string, retry = false) {
  if (!isStripeConfigured) return false;
  const admin = createAdminClient();
  const { data } = await admin.from("orders").select(FIELDS).eq("id", orderId).maybeSingle();
  const order = data as OrderRow | null;
  if (!order || (order.status !== "shipped" && order.status !== "delivered") || !order.stripe_charge_id) return false;

  const { data: created } = await admin
    .from("payouts")
    .insert({ order_id: order.id, seller_id: order.seller_id, amount_cents: order.seller_share_cents, status: "held" })
    .select("id")
    .maybeSingle();
  if (!created) {
    // Already claimed. Only the daily job picks up one that's still waiting.
    if (!retry) return false;
    const { data: waiting } = await admin
      .from("payouts")
      .select("id")
      .eq("order_id", order.id)
      .eq("status", "held")
      .is("stripe_transfer_id", null)
      .maybeSingle();
    if (!waiting) return false;
  }

  const { data: seller } = await admin.from("profiles").select("stripe_account_id").eq("id", order.seller_id).single();
  if (!seller?.stripe_account_id) {
    console.error(`[payout waiting] ${order.number}: seller has no Stripe account`);
    return false;
  }

  try {
    const stripe = getStripe();
    // A transfer from an earlier attempt that we didn't get to record.
    const earlier = await stripe.transfers.list({ transfer_group: order.number, limit: 1 });
    const transfer =
      earlier.data[0] ??
      (await stripe.transfers.create(
        {
          amount: order.seller_share_cents,
          currency: "usd",
          destination: seller.stripe_account_id,
          source_transaction: order.stripe_charge_id,
          transfer_group: order.number,
          metadata: { order_id: order.id, order_number: order.number },
        },
        { idempotencyKey: `payout-${order.id}` },
      ));
    await admin
      .from("payouts")
      .update({ status: "transferred", stripe_transfer_id: transfer.id, transferred_at: new Date().toISOString() })
      .eq("order_id", order.id);
  } catch (error) {
    console.error(`[payout failed] ${order.number}: ${error instanceof Error ? error.message : error}`);
    return false;
  }

  const sellerEmail = await emailOf(order.seller_id);
  if (sellerEmail) {
    await sendEmail({
      to: sellerEmail,
      subject: `You've been paid ${formatUSD(order.seller_share_cents)}`,
      text: [
        `USPS scanned your package for order ${order.number}, so your share is on its way.`,
        ``,
        `${formatUSD(order.seller_share_cents)} is now in your Stripe account. Stripe sends it to your bank on your payout schedule, usually within 2 business days.`,
        ``,
        `See your payouts: ${siteUrl()}/dashboard?tab=payouts`,
      ].join("\n"),
    });
  }
  return true;
}

// Refunds ---------------------------------------------------------------------

export type RefundReason = "not_shipped" | "admin";
export type RefundResult = { ok: true } | { ok: false; error: string };

/**
 * Full refund of item and shipping. "not_shipped" is the 5-day ship-by rule:
 * only orders USPS never scanned. An admin can refund at any stage; if the
 * seller was already paid, their transfer is reversed. Unshipped items go back
 * on sale and their label is voided.
 */
export async function refundOrder(orderId: string, reason: RefundReason): Promise<RefundResult> {
  const admin = createAdminClient();
  const { data } = await admin.from("orders").select(FIELDS).eq("id", orderId).maybeSingle();
  const order = data as OrderRow | null;
  if (!order) return { ok: false, error: "Order not found." };

  const allowed: OrderRow["status"][] =
    reason === "not_shipped" ? [...UNSHIPPED] : [...UNSHIPPED, "shipped", "delivered"];
  if (!allowed.includes(order.status))
    return { ok: false, error: `This order is ${order.status} and can't be refunded.` };
  const wasShipped = order.status === "shipped" || order.status === "delivered";

  const { data: claimed } = await admin
    .from("orders")
    .update({ status: "refunded", refunded_at: new Date().toISOString() })
    .eq("id", order.id)
    .eq("status", order.status)
    .select("id");
  if (!claimed?.length) return { ok: false, error: "This order just changed. Reload and try again." };

  if (isStripeConfigured && order.stripe_payment_intent_id) {
    try {
      await getStripe().refunds.create(
        {
          payment_intent: order.stripe_payment_intent_id,
          reason: "requested_by_customer",
          metadata: { order_id: order.id, order_number: order.number, why: reason },
        },
        { idempotencyKey: `refund-${order.id}` },
      );
    } catch (error) {
      await admin.from("orders").update({ status: order.status, refunded_at: null }).eq("id", order.id);
      console.error(`[refund failed] ${order.number}: ${error instanceof Error ? error.message : error}`);
      return { ok: false, error: "Stripe couldn't refund this payment. Nothing was changed." };
    }
  }

  // The seller was paid already: take their share back. Stripe covers any shortfall, and the platform carries it.
  const { data: payout } = await admin
    .from("payouts")
    .select("stripe_transfer_id")
    .eq("order_id", order.id)
    .eq("status", "transferred")
    .maybeSingle();
  if (payout?.stripe_transfer_id) {
    try {
      await getStripe().transfers.createReversal(
        payout.stripe_transfer_id,
        { metadata: { order_number: order.number } },
        { idempotencyKey: `reversal-${order.id}` },
      );
      await admin.from("payouts").update({ status: "reversed" }).eq("order_id", order.id);
    } catch (error) {
      console.error(`[reversal failed] ${order.number}: ${error instanceof Error ? error.message : error}`);
    }
  }

  if (!wasShipped) {
    const tx = order.shippo_transaction_id;
    if (tx && !tx.startsWith(CLAIM_PREFIX)) {
      await voidLabel(tx).catch((error) => console.error(`[void failed] ${order.number}: ${error}`));
    }
    await admin.from("listings").update({ status: "active", reserved_until: null }).eq("id", order.listing_id);
    revalidateTag(LISTINGS_TAG, { expire: 0 });
  }

  const [title, buyerEmail, sellerEmail] = await Promise.all([
    titleOf(order.listing_id),
    order.ship_to.email ? Promise.resolve(order.ship_to.email) : emailOf(order.buyer_id),
    emailOf(order.seller_id),
  ]);
  const total = formatUSD(order.item_cents + order.shipping_cents);
  await Promise.all([
    buyerEmail &&
      sendEmail({
        to: buyerEmail,
        subject: `Refund for order ${order.number}`,
        text: [
          reason === "not_shipped"
            ? `The seller didn't ship ${title} in time, so we've cancelled the order.`
            : `We've refunded your order for ${title}.`,
          ``,
          `${total} is on its way back to your card. Banks usually show it within 5 to 10 business days.`,
          ``,
          `Order ${order.number}: ${orderLink(order.number)}`,
        ].join("\n"),
      }),
    sellerEmail &&
      sendEmail({
        to: sellerEmail,
        subject: `Order ${order.number} was cancelled`,
        text: [
          reason === "not_shipped"
            ? `${title} wasn't shipped by the deadline, so the buyer has been refunded and the order cancelled.`
            : `Outdoor Supply Central refunded the buyer for ${title}.`,
          ...(!wasShipped
            ? [`Your listing is back on sale, and the USPS label has been cancelled. Please don't use it.`]
            : payout?.stripe_transfer_id
              ? [`Your share of ${formatUSD(order.seller_share_cents)} has been taken back from your Stripe balance.`]
              : []),
          ``,
          `Questions? Reply to this email.`,
        ].join("\n"),
      }),
  ]);
  return { ok: true };
}

// Daily checks ----------------------------------------------------------------

export type SweepReport = {
  holdsReleased: number;
  reminders: number;
  cancelled: number;
  labelsRetried: number;
  payoutsRetried: number;
};

/**
 * The daily job (Vercel Cron): day-3 ship reminders, cancel and refund orders
 * past their ship-by date, and retry labels or payouts that failed earlier.
 */
export async function runOrderSweep(now = new Date()): Promise<SweepReport> {
  const admin = createAdminClient();
  const report: SweepReport = { holdsReleased: 0, reminders: 0, cancelled: 0, labelsRetried: 0, payoutsRetried: 0 };

  const { data: holds } = await admin
    .from("listings")
    .select("id")
    .eq("status", "reserved")
    .lt("reserved_until", now.toISOString());
  for (const l of holds ?? []) if (await releaseExpiredHold(l.id)) report.holdsReleased++;

  // Day-3 reminder.
  const remindBefore = new Date(now.getTime() - SHIP_REMINDER_DAY * 86_400_000).toISOString();
  const { data: due } = await admin
    .from("orders")
    .select("id")
    .in("status", UNSHIPPED)
    .is("reminder_sent_at", null)
    .lte("paid_at", remindBefore)
    .gt("ship_by", now.toISOString());
  for (const { id } of due ?? []) {
    const { data } = await admin
      .from("orders")
      .update({ reminder_sent_at: now.toISOString() })
      .eq("id", id)
      .is("reminder_sent_at", null)
      .select(FIELDS)
      .maybeSingle();
    const order = data as OrderRow | null;
    const sellerEmail = order && (await emailOf(order.seller_id));
    if (!order || !sellerEmail) continue;
    await sendEmail({
      to: sellerEmail,
      subject: `Reminder: please ship ${await titleOf(order.listing_id)}`,
      text: [
        `Your sale ${order.number} hasn't been scanned by USPS yet.`,
        `Please ship it by ${order.ship_by ? dayFmt.format(new Date(order.ship_by)) : "the date on your order page"}. If it isn't shipped in time, the buyer is refunded automatically and you won't be paid.`,
        ``,
        `QR code and label: ${orderLink(order.number)}`,
      ].join("\n"),
    });
    report.reminders++;
  }

  // Past the ship-by date: cancel, refund, void the label, relist.
  const { data: overdue } = await admin
    .from("orders")
    .select("id")
    .in("status", UNSHIPPED)
    .lt("ship_by", now.toISOString());
  for (const { id } of overdue ?? []) if ((await refundOrder(id, "not_shipped")).ok) report.cancelled++;

  // Labels that failed or got stuck mid-purchase.
  const [{ data: never }, { data: stuck }] = await Promise.all([
    admin.from("orders").select("id, shippo_transaction_id").eq("status", "paid").is("shippo_transaction_id", null),
    admin
      .from("orders")
      .select("id, shippo_transaction_id")
      .eq("status", "paid")
      .like("shippo_transaction_id", `${CLAIM_PREFIX}%`),
  ]);
  for (const o of [...(never ?? []), ...(stuck ?? [])]) {
    const claimedAt = Number(
      String(o.shippo_transaction_id ?? "")
        .split(":")
        .pop(),
    );
    if (o.shippo_transaction_id && now.getTime() - claimedAt < CLAIM_STALE_MS) continue;
    if (o.shippo_transaction_id) {
      await admin
        .from("orders")
        .update({ shippo_transaction_id: null })
        .eq("id", o.id)
        .eq("shippo_transaction_id", o.shippo_transaction_id);
    }
    if (await buyLabelForOrder(o.id, false)) report.labelsRetried++;
  }

  // Shipped orders whose payout didn't go through.
  const { data: shipped } = await admin
    .from("orders")
    .select("id, payouts(status)")
    .in("status", ["shipped", "delivered"]);
  for (const o of shipped ?? []) {
    const payouts = (o.payouts ?? []) as { status: string }[] | { status: string };
    const status = Array.isArray(payouts) ? payouts[0]?.status : payouts?.status;
    if (status === "transferred" || status === "reversed") continue;
    if (await paySeller(o.id, true)) report.payoutsRetried++;
  }

  return report;
}
