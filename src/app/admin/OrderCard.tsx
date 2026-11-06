import Link from "next/link";
import { MessageCircle, Truck } from "lucide-react";
import { Card, buttonClass } from "@/components/ui";
import { formatUSD } from "@/lib/money";
import { isShippoTest } from "@/lib/shippo";
import { adminRefund, adminRetryLabel, adminSimulateTracking } from "./actions";

export const ORDER_COLUMNS =
  "id, number, status, item_cents, shipping_cents, commission_cents, seller_share_cents, ship_to, tracking_number, tracking_status, paid_at, ship_by, created_at, listing_id, buyer_id, seller_id, listings(title), seller:profiles!orders_seller_id_fkey(display_name), payouts(status), order_messages(count)";

export type AdminOrder = {
  id: string;
  number: string;
  status: string;
  item_cents: number;
  shipping_cents: number;
  commission_cents: number;
  seller_share_cents: number;
  ship_to: { name?: string; city?: string; state?: string; email?: string } | null;
  tracking_number: string | null;
  tracking_status: string | null;
  paid_at: string | null;
  ship_by: string | null;
  created_at: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  listings: { title: string } | null;
  seller: { display_name: string } | null;
  payouts: { status: string } | { status: string }[] | null;
  order_messages: { count: number }[] | null;
};

const STATUS: Record<string, { label: string; tone: string }> = {
  paid: { label: "Paid, label pending", tone: "bg-boot text-white" },
  label_ready: { label: "Label ready", tone: "bg-sand text-ink" },
  shipped: { label: "Shipped", tone: "bg-trail text-white" },
  delivered: { label: "Delivered", tone: "bg-pine text-white" },
  refunded: { label: "Refunded", tone: "bg-line text-ink" },
};

const dateFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

/** One order with its money, USPS and payout state, and the admin's actions. `back` is where actions return to. */
export function OrderCard({ o, back, link = true }: { o: AdminOrder; back: string; link?: boolean }) {
  const status = STATUS[o.status] ?? { label: o.status, tone: "bg-line text-ink" };
  const payout = Array.isArray(o.payouts) ? o.payouts[0]?.status : o.payouts?.status;
  const unshipped = o.status === "paid" || o.status === "label_ready";
  const messages = o.order_messages?.[0]?.count ?? 0;
  const payoutText =
    payout === "transferred"
      ? "paid"
      : payout === "reversed"
        ? "taken back"
        : o.status === "refunded"
          ? "not owed"
          : payout === "held"
            ? "waiting to retry"
            : "held until USPS scan";

  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          {link ? (
            <Link href={`/admin/orders/${o.number}`} className="font-semibold text-ink">
              {o.number}
            </Link>
          ) : (
            <p className="font-semibold">{o.number}</p>
          )}
          <p className="line-clamp-1">{o.listings?.title ?? "Item"}</p>
        </div>
        <div className="flex items-center gap-2">
          {messages > 0 && (
            <Link
              href={`/admin/orders/${o.number}#messages`}
              className="flex items-center gap-1 rounded-full bg-boot/10 px-3 py-1 text-[14px] font-semibold text-boot no-underline"
            >
              <MessageCircle className="size-4" aria-hidden="true" /> {messages}
            </Link>
          )}
          <span className={`rounded-full px-3 py-1 text-[14px] font-semibold ${status.tone}`}>{status.label}</span>
        </div>
      </div>

      <dl className="grid gap-x-6 gap-y-1 text-[15px] sm:grid-cols-2">
        <Pair label="Buyer" value={[o.ship_to?.name, o.ship_to?.city, o.ship_to?.state].filter(Boolean).join(", ")} />
        <Pair label="Seller" value={o.seller?.display_name || "Seller"} />
        <Pair
          label="Paid"
          value={`${formatUSD(o.item_cents + o.shipping_cents)}${o.paid_at ? ` · ${dateFmt.format(new Date(o.paid_at))}` : ""}`}
        />
        <Pair label="Ship by" value={o.ship_by ? dateFmt.format(new Date(o.ship_by)) : "—"} />
        <Pair label="Commission" value={formatUSD(o.commission_cents)} />
        <Pair label="Seller share" value={`${formatUSD(o.seller_share_cents)} · ${payoutText}`} />
        <Pair
          label="USPS"
          value={o.tracking_number ? `${o.tracking_number} (${o.tracking_status ?? "no scan"})` : "No label yet"}
        />
      </dl>

      {o.status !== "refunded" && (
        <div className="flex flex-wrap gap-2 border-t border-line pt-3">
          {o.status === "paid" && (
            <form action={adminRetryLabel.bind(null, o.id)}>
              <input type="hidden" name="back" value={back} />
              <button type="submit" className={buttonClass("outline", "min-h-10")}>
                Buy label again
              </button>
            </form>
          )}
          {isShippoTest && o.tracking_number && unshipped && (
            <form action={adminSimulateTracking.bind(null, o.id, "TRANSIT")}>
              <input type="hidden" name="back" value={back} />
              <button type="submit" className={buttonClass("outline", "min-h-10")}>
                <Truck className="size-4" aria-hidden="true" /> Test: USPS scan
              </button>
            </form>
          )}
          {isShippoTest && o.status === "shipped" && (
            <form action={adminSimulateTracking.bind(null, o.id, "DELIVERED")}>
              <input type="hidden" name="back" value={back} />
              <button type="submit" className={buttonClass("outline", "min-h-10")}>
                Test: delivered
              </button>
            </form>
          )}
          <details className="relative">
            <summary className="label-caps inline-flex min-h-10 cursor-pointer list-none items-center rounded-md border border-alert/40 px-4 text-[14px] text-alert hover:bg-alert/5">
              Refund in full
            </summary>
            <form
              action={adminRefund.bind(null, o.id)}
              className="absolute left-0 z-10 mt-1 w-72 rounded-md border border-line bg-paper p-3 shadow-lg"
            >
              <input type="hidden" name="back" value={back} />
              <p className="text-[15px]">
                Refund {formatUSD(o.item_cents + o.shipping_cents)} to the buyer?{" "}
                {unshipped
                  ? "The label is voided and the item goes back on sale."
                  : payout === "transferred"
                    ? "The seller's share is taken back from their Stripe balance."
                    : "The item stays sold."}
              </p>
              <button
                type="submit"
                className="label-caps mt-2 inline-flex min-h-10 w-full items-center justify-center rounded-md bg-alert px-4 text-[14px] text-white hover:bg-alert/90"
              >
                Refund
              </button>
            </form>
          </details>
        </div>
      )}
    </Card>
  );
}

export function Pair({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="text-muted">{label}:</dt>
      <dd className="min-w-0 break-words">{value}</dd>
    </div>
  );
}
