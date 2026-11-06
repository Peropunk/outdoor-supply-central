import type { Metadata } from "next";
import Link from "next/link";
import { CircleCheck, RefreshCw, Truck } from "lucide-react";
import { Card, PageTitle, PreviewNotice, buttonClass } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { formatUSD } from "@/lib/money";
import { isShippoTest } from "@/lib/shippo";
import { createAdminClient } from "@/lib/supabase/server";
import { adminRefund, adminRetryLabel, adminRunSweep, adminSimulateTracking } from "./actions";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

// Admin orders (Chunk 4 refund, Chunk 5 tools). The full admin area, with
// listings, reports and users, comes in Chunk 6.

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

type Row = {
  id: string;
  number: string;
  status: string;
  item_cents: number;
  shipping_cents: number;
  commission_cents: number;
  seller_share_cents: number;
  ship_to: { name?: string; city?: string; state?: string } | null;
  tracking_number: string | null;
  tracking_status: string | null;
  paid_at: string | null;
  ship_by: string | null;
  listings: { title: string } | null;
  seller: { display_name: string } | null;
  payouts: { status: string } | { status: string }[] | null;
};

export default async function AdminPage(props: PageProps<"/admin">) {
  await requireAdmin();
  const sp = await props.searchParams;
  const { data } = await createAdminClient()
    .from("orders")
    .select(
      "id, number, status, item_cents, shipping_cents, commission_cents, seller_share_cents, ship_to, tracking_number, tracking_status, paid_at, ship_by, listings(title), seller:profiles!orders_seller_id_fkey(display_name), payouts(status)",
    )
    .not("status", "in", "(pending_payment,cancelled)")
    .order("created_at", { ascending: false })
    .limit(100);
  const orders = (data ?? []) as unknown as Row[];
  const msg = typeof sp.msg === "string" ? sp.msg : null;

  return (
    <div className="mx-auto max-w-4xl px-4 pt-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageTitle>Orders</PageTitle>
        <form action={adminRunSweep}>
          <button type="submit" className={buttonClass("outline", "min-h-11")}>
            <RefreshCw className="size-4" aria-hidden="true" />
            Run daily checks now
          </button>
        </form>
      </div>
      <p className="-mt-2 text-muted">
        Daily checks run each morning on their own: ship reminders, refunds for orders not shipped in time, and retries.
      </p>

      {msg && (
        <p role="status" className="mt-6 flex items-center gap-2 rounded-md bg-pine px-4 py-3 text-white">
          <CircleCheck className="size-5 shrink-0" aria-hidden="true" /> {msg}
        </p>
      )}

      <div className="mt-6 space-y-4">
        {!orders.length && <p className="text-muted">No paid orders yet.</p>}
        {orders.map((o) => {
          const status = STATUS[o.status] ?? { label: o.status, tone: "bg-line text-ink" };
          const payout = Array.isArray(o.payouts) ? o.payouts[0]?.status : o.payouts?.status;
          const unshipped = o.status === "paid" || o.status === "label_ready";
          return (
            <Card key={o.id} className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link href={`/orders/${o.number}`} className="font-semibold text-ink">
                    {o.number}
                  </Link>
                  <p className="line-clamp-1">{o.listings?.title ?? "Item"}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-[14px] font-semibold ${status.tone}`}>
                  {status.label}
                </span>
              </div>

              <dl className="grid gap-x-6 gap-y-1 text-[15px] sm:grid-cols-2">
                <Pair
                  label="Buyer"
                  value={[o.ship_to?.name, o.ship_to?.city, o.ship_to?.state].filter(Boolean).join(", ")}
                />
                <Pair label="Seller" value={o.seller?.display_name || "Seller"} />
                <Pair
                  label="Paid"
                  value={`${formatUSD(o.item_cents + o.shipping_cents)}${o.paid_at ? ` · ${dateFmt.format(new Date(o.paid_at))}` : ""}`}
                />
                <Pair label="Ship by" value={o.ship_by ? dateFmt.format(new Date(o.ship_by)) : "—"} />
                <Pair label="Commission" value={formatUSD(o.commission_cents)} />
                <Pair
                  label="Seller share"
                  value={`${formatUSD(o.seller_share_cents)} · ${
                    payout === "transferred"
                      ? "paid"
                      : payout === "reversed"
                        ? "taken back"
                        : o.status === "refunded"
                          ? "not owed"
                          : payout === "held"
                            ? "waiting to retry"
                            : "held until USPS scan"
                  }`}
                />
                <Pair
                  label="USPS"
                  value={
                    o.tracking_number ? `${o.tracking_number} (${o.tracking_status ?? "no scan"})` : "No label yet"
                  }
                />
              </dl>

              {o.status !== "refunded" && (
                <div className="flex flex-wrap gap-2 border-t border-line pt-3">
                  {o.status === "paid" && (
                    <form action={adminRetryLabel.bind(null, o.id)}>
                      <button type="submit" className={buttonClass("outline", "min-h-10")}>
                        Buy label again
                      </button>
                    </form>
                  )}
                  {isShippoTest && o.tracking_number && unshipped && (
                    <form action={adminSimulateTracking.bind(null, o.id, "TRANSIT")}>
                      <button type="submit" className={buttonClass("outline", "min-h-10")}>
                        <Truck className="size-4" aria-hidden="true" /> Test: USPS scan
                      </button>
                    </form>
                  )}
                  {isShippoTest && o.status === "shipped" && (
                    <form action={adminSimulateTracking.bind(null, o.id, "DELIVERED")}>
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
        })}
      </div>

      {isShippoTest && (
        <div className="mt-8">
          <PreviewNotice>
            Shippo is in test mode: labels are free and never ship, so use the Test buttons to play USPS scans.
          </PreviewNotice>
        </div>
      )}
    </div>
  );
}

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="text-muted">{label}:</dt>
      <dd className="min-w-0 break-words">{value}</dd>
    </div>
  );
}
