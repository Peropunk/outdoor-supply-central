import type { Metadata } from "next";
import { RefreshCw, Search } from "lucide-react";
import { Card, PreviewNotice, buttonClass, inputClass } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { formatUSD } from "@/lib/money";
import { isShippoTest } from "@/lib/shippo";
import { createAdminClient } from "@/lib/supabase/server";
import { adminRunSweep } from "./actions";
import { AdminNav } from "./AdminNav";
import { ORDER_COLUMNS, OrderCard, type AdminOrder } from "./OrderCard";

export const metadata: Metadata = { title: "Admin: orders", robots: { index: false } };

const monthFmt = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

/** For ilike: the user's text, with SQL wildcards taken literally. */
function likeText(q: string) {
  return `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

/** Account ids whose email contains the text. Fine for thousands of members; paged by Supabase. */
async function userIdsByEmail(q: string) {
  const admin = createAdminClient();
  const ids: string[] = [];
  for (let page = 1; page <= 20; page++) {
    const { data } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    const users = data?.users ?? [];
    ids.push(...users.filter((u) => u.email?.toLowerCase().includes(q.toLowerCase())).map((u) => u.id));
    if (users.length < 1000) break;
  }
  return ids;
}

async function findOrders(q: string): Promise<AdminOrder[]> {
  const admin = createAdminClient();
  let query = admin
    .from("orders")
    .select(ORDER_COLUMNS)
    .not("status", "in", "(pending_payment,cancelled)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (q.includes("@")) {
    const ids = await userIdsByEmail(q);
    if (!ids.length) return [];
    const list = ids.join(",");
    query = query.or(`buyer_id.in.(${list}),seller_id.in.(${list})`);
  } else if (/^(osc-?)?\d+$/i.test(q)) {
    query = query.ilike("number", likeText(q.replace(/\D/g, "")));
  } else if (q) {
    const { data: listings } = await admin.from("listings").select("id").ilike("title", likeText(q)).limit(200);
    const ids = (listings ?? []).map((l) => l.id as string);
    if (!ids.length) return [];
    query = query.in("listing_id", ids);
  }
  const { data } = await query;
  return (data ?? []) as unknown as AdminOrder[];
}

/** Commission per calendar month (UTC) from orders that weren't refunded. */
async function commissionByMonth() {
  const { data } = await createAdminClient()
    .from("orders")
    .select("paid_at, item_cents, commission_cents")
    .in("status", ["paid", "label_ready", "shipped", "delivered"])
    .not("paid_at", "is", null);
  const months = new Map<string, { orders: number; sales: number; commission: number }>();
  for (const o of data ?? []) {
    const key = (o.paid_at as string).slice(0, 7);
    const m = months.get(key) ?? { orders: 0, sales: 0, commission: 0 };
    m.orders++;
    m.sales += o.item_cents as number;
    m.commission += o.commission_cents as number;
    months.set(key, m);
  }
  return [...months.entries()].sort(([a], [b]) => b.localeCompare(a)).slice(0, 12);
}

export default async function AdminOrdersPage(props: PageProps<"/admin">) {
  await requireAdmin();
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  const [orders, months] = await Promise.all([findOrders(q), commissionByMonth()]);
  const backTo = q ? `/admin?q=${encodeURIComponent(q)}` : "/admin";

  return (
    <div className="mx-auto max-w-4xl px-4 pt-8">
      <AdminNav current="/admin" msg={sp.msg} />

      <Card className="mt-6">
        <h2 className="text-xl">Commission by month</h2>
        {months.length ? (
          <table className="mt-3 w-full text-left text-[15px]">
            <thead className="text-muted">
              <tr>
                <th className="py-1 font-normal">Month</th>
                <th className="py-1 text-right font-normal">Orders</th>
                <th className="py-1 text-right font-normal">Item sales</th>
                <th className="py-1 text-right font-normal">Commission</th>
              </tr>
            </thead>
            <tbody>
              {months.map(([key, m]) => (
                <tr key={key} className="border-t border-line">
                  <td className="py-1.5">{monthFmt.format(new Date(`${key}-01T00:00:00Z`))}</td>
                  <td className="py-1.5 text-right">{m.orders}</td>
                  <td className="py-1.5 text-right">{formatUSD(m.sales)}</td>
                  <td className="py-1.5 text-right font-semibold">{formatUSD(m.commission)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="mt-2 text-muted">No paid orders yet.</p>
        )}
        <p className="mt-3 text-[14px] text-muted">
          Refunded orders are left out. Card fees come out of the commission.
        </p>
      </Card>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <form action="/admin" className="flex flex-1 gap-2" role="search">
          <label htmlFor="q" className="sr-only">
            Find an order
          </label>
          <input id="q" name="q" defaultValue={q} placeholder="Order number, email or item" className={inputClass} />
          <button type="submit" className={buttonClass("primary", "shrink-0 px-4")} aria-label="Search orders">
            <Search className="size-5" aria-hidden="true" />
          </button>
        </form>
        <form action={adminRunSweep}>
          <button type="submit" className={buttonClass("outline", "min-h-12 w-full")}>
            <RefreshCw className="size-4" aria-hidden="true" />
            Run daily checks now
          </button>
        </form>
      </div>
      <p className="mt-2 text-[14px] text-muted">
        Daily checks also run each morning on their own: ship reminders, refunds for orders not shipped in time, and
        retries.
      </p>

      <div className="mt-6 space-y-4">
        {!orders.length && <p className="text-muted">{q ? `No orders match “${q}”.` : "No paid orders yet."}</p>}
        {orders.map((o) => (
          <OrderCard key={o.id} o={o} back={backTo} />
        ))}
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
