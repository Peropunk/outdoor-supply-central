import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CircleCheck, MessageCircle, QrCode, Truck } from "lucide-react";
import { GearPhoto } from "@/components/GearPhoto";
import { Card, PreviewNotice, StatusBar, buttonClass } from "@/components/ui";
import { currentStepIndex, getOrder } from "@/lib/orders";
import { formatUSD } from "@/lib/money";

export const metadata: Metadata = { title: "Order" };

const dateFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});
const dayFmt = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" });

export default async function OrderPage(props: PageProps<"/orders/[number]">) {
  const { number } = await props.params;
  const sp = await props.searchParams;
  const found = await getOrder(number);
  if (!found) notFound();
  const { order, listing } = found;

  // Chunk 2 adds sign-in; the page then shows the buyer or seller view
  // depending on who is looking. `?view=seller` previews the seller side.
  const asSeller = sp.view === "seller";
  const step = currentStepIndex(order.status);
  const total = order.itemCents + order.shippingCents;

  return (
    <div className="mx-auto max-w-3xl px-4 pt-8">
      {sp.new === "1" && (
        <div className="mb-6 flex gap-3 rounded-[var(--radius-card)] bg-pine p-5 text-white">
          <CircleCheck className="size-7 shrink-0" aria-hidden="true" />
          <div>
            <p className="text-xl font-semibold">Thanks! Your order is confirmed.</p>
            <p className="text-white/85">
              A receipt is on its way to your email. We&apos;ll email again when it ships.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-3xl">Order {order.number}</h1>
        <div className="flex gap-1 text-[15px]">
          <Link
            href={`/orders/${order.number}`}
            className={`rounded-full px-3 py-1 no-underline ${!asSeller ? "bg-pine text-white" : "text-olive"}`}
          >
            Buyer view
          </Link>
          <Link
            href={`/orders/${order.number}?view=seller`}
            className={`rounded-full px-3 py-1 no-underline ${asSeller ? "bg-pine text-white" : "text-olive"}`}
          >
            Seller view
          </Link>
        </div>
      </div>
      <p className="mt-1 text-muted">Paid {dateFmt.format(new Date(order.paidAt))}</p>

      <Card className="mt-6">
        <StatusBar current={step} />
      </Card>

      {asSeller && step === 1 && (
        <Card className="mt-4 border-trail">
          <div className="flex flex-col gap-5 sm:flex-row">
            <div className="flex aspect-square w-40 shrink-0 items-center justify-center self-center rounded-md border border-line bg-canvas">
              <QrCode className="size-28 text-ink" strokeWidth={1} aria-label="USPS drop-off QR code" />
            </div>
            <div>
              <h2 className="text-xl">Ship it by {dayFmt.format(new Date(order.shipBy))}</h2>
              <ol className="mt-2 list-decimal space-y-1 pl-5">
                <li>Pack the item snugly in a box or padded mailer.</li>
                <li>Take it to any Post Office and show this QR code at the counter. No printer needed.</li>
                <li>You&apos;re paid as soon as USPS scans it.</li>
              </ol>
              <div className="mt-4 flex flex-wrap gap-2">
                <a href="#" className={buttonClass("outline", "min-h-11")}>
                  Print label (PDF)
                </a>
              </div>
            </div>
          </div>
        </Card>
      )}

      {order.tracking && (
        <Card className="mt-4">
          <p className="flex items-center gap-2 font-semibold">
            <Truck className="size-5 text-trail" aria-hidden="true" /> USPS tracking
          </p>
          <p className="mt-1 font-mono text-[15px] tracking-wide">{order.tracking}</p>
          <ul className="mt-3 space-y-1 text-[15px] text-muted">
            {[...order.events].reverse().map((e) => (
              <li key={e.step}>
                {e.step} · {dateFmt.format(new Date(e.at))}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="mt-4">
        <div className="flex gap-4">
          <GearPhoto photo={listing.photos[0]} size="sm" className="w-20 shrink-0 rounded-md" />
          <div className="min-w-0">
            <Link href={`/item/${listing.id}`} className="line-clamp-2 font-semibold text-ink">
              {listing.title}
            </Link>
            <p className="text-[15px] text-muted">
              {asSeller
                ? `Buyer: ${order.buyer.name}, ${order.buyer.city}, ${order.buyer.state}`
                : `Seller: ${[listing.seller.displayName, listing.seller.city, listing.seller.state].filter(Boolean).join(", ")}`}
            </p>
          </div>
        </div>
        <dl className="mt-4 space-y-1.5 border-t border-line pt-4">
          {asSeller ? (
            <>
              <Row label="Sale price" value={formatUSD(order.itemCents)} />
              <Row label="Fee" value={`− ${formatUSD(order.commissionCents)}`} />
              <Row label="You earn" value={formatUSD(order.itemCents - order.commissionCents)} strong />
              <p className="pt-1 text-[14px] text-muted">
                {order.sellerPaidAt
                  ? `Sent to your bank account ${dateFmt.format(new Date(order.sellerPaidAt))}.`
                  : "Released to you at USPS's first scan."}
              </p>
            </>
          ) : (
            <>
              <Row label="Item" value={formatUSD(order.itemCents)} />
              <Row label="USPS shipping" value={formatUSD(order.shippingCents)} />
              <Row label="Total paid" value={formatUSD(total)} strong />
            </>
          )}
        </dl>
      </Card>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted">Something wrong with this order?</p>
        <Link href={`/orders/${order.number}/problem`} className={buttonClass("outline")}>
          <MessageCircle className="size-5" aria-hidden="true" />
          Report a problem
        </Link>
      </div>

      <div className="mt-8">
        <PreviewNotice>sample order. Real orders appear here after Stripe and Shippo are connected.</PreviewNotice>
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? "text-lg font-bold" : ""}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
