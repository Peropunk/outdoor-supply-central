import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui";
import { Thread } from "@/components/Thread";
import { requireAdmin } from "@/lib/auth";
import { getThread } from "@/lib/messages";
import { createAdminClient } from "@/lib/supabase/server";
import { uspsTrackingUrl } from "@/lib/tracking";
import { ThreadForm } from "../../../orders/[number]/problem/ThreadForm";
import { AdminNav } from "../../AdminNav";
import { ORDER_COLUMNS, OrderCard, Pair, type AdminOrder } from "../../OrderCard";

export const metadata: Metadata = { title: "Admin: order", robots: { index: false } };

/** One order in full for an admin: people, address, label, payout and the problem thread. */
export default async function AdminOrderPage(props: PageProps<"/admin/orders/[number]">) {
  const admin = await requireAdmin();
  const { number } = await props.params;
  const sp = await props.searchParams;
  const db = createAdminClient();
  const { data } = await db.from("orders").select(`${ORDER_COLUMNS}, label_url`).eq("number", number).maybeSingle();
  if (!data) notFound();
  const o = data as unknown as AdminOrder & { label_url: string | null; ship_to: Record<string, string> | null };

  const [buyer, seller, messages] = await Promise.all([
    db.auth.admin.getUserById(o.buyer_id),
    db.auth.admin.getUserById(o.seller_id),
    getThread(o, admin.id),
  ]);
  const to = o.ship_to ?? {};

  return (
    <div className="mx-auto max-w-3xl px-4 pt-8">
      <AdminNav current="/admin" msg={sp.msg} />
      <Link href="/admin" className="mt-6 inline-block text-[15px]">
        ← All orders
      </Link>

      <div className="mt-3">
        <OrderCard o={o} back={`/admin/orders/${o.number}`} link={false} />
      </div>

      <Card className="mt-4 space-y-3">
        <h2 className="text-xl">People and shipping</h2>
        <dl className="grid gap-x-6 gap-y-1 text-[15px] sm:grid-cols-2">
          <Pair label="Buyer email" value={buyer.data?.user?.email ?? "—"} />
          <Pair label="Seller email" value={seller.data?.user?.email ?? "—"} />
          <Pair
            label="Ship to"
            value={[to.name, to.line1, to.line2, `${to.city ?? ""}, ${to.state ?? ""} ${to.zip ?? ""}`]
              .filter(Boolean)
              .join(", ")}
          />
          <Pair label="USPS service" value={to.service ?? "—"} />
        </dl>
        <div className="flex flex-wrap gap-4 text-[15px]">
          {o.tracking_number && (
            <a href={uspsTrackingUrl(o.tracking_number)} target="_blank" rel="noopener noreferrer">
              USPS tracking
            </a>
          )}
          {o.label_url && (
            <a href={o.label_url} target="_blank" rel="noopener noreferrer">
              Label (PDF)
            </a>
          )}
          <Link href={`/item/${o.listing_id}`}>Listing</Link>
        </div>
      </Card>

      <section id="messages" className="mt-8 scroll-mt-24">
        <h2 className="text-2xl">Problem thread</h2>
        <p className="text-muted">Buyer and seller see your replies as “Outdoor Supply Central” and get an email.</p>
        {messages.length > 0 ? (
          <div className="mt-4">
            <Thread messages={messages} />
          </div>
        ) : (
          <p className="mt-4 text-muted">No messages on this order.</p>
        )}
        <Card className="mt-4">
          <ThreadForm number={o.number} orderId={o.id} userId={admin.id} first={false} />
        </Card>
      </section>
    </div>
  );
}
