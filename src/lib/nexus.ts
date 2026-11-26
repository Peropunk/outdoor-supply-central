import "server-only";
import { adminEmails } from "./messages";
import { sendEmail } from "./email";
import { formatUSD } from "./money";
import { siteUrl } from "./site";
import { createAdminClient } from "./supabase/server";
import { SITE_TIME_ZONE } from "./time";

// Sales-tax thresholds ("economic nexus"). A marketplace must start collecting
// a state's sales tax once its sales into that state pass a threshold, most
// often $100,000 or 200 orders in a calendar year (some states set more, e.g.
// $500,000 in California, New York and Texas). This watches sales by delivery
// state and warns admins early. It's an early warning, not tax advice: the
// accountant decides when to register.

export const COMMON_SALES_THRESHOLD_CENTS = 100_000_00;
export const COMMON_ORDER_THRESHOLD = 200;
/** Warn at 80% of the common threshold, so there's time to register. */
export const WARN_AT = 0.8;
/** States where tax is already collected (lib/tax.ts). */
const COLLECTING = new Set(["TX"]);

export type StateSales = { state: string; orders: number; grossCents: number; near: boolean; collecting: boolean };

function currentYear() {
  return Number(new Intl.DateTimeFormat("en-US", { timeZone: SITE_TIME_ZONE, year: "numeric" }).format(new Date()));
}

/** Paid, unrefunded sales this calendar year by delivery state, largest first. Gross = item + shipping. */
export async function salesByState(year = currentYear()): Promise<StateSales[]> {
  const { data } = await createAdminClient()
    .from("orders")
    .select("ship_to, item_cents, shipping_cents, paid_at")
    .in("status", ["paid", "label_ready", "shipped", "delivered"])
    .gte("paid_at", `${year}-01-01T06:00:00Z`)
    .lt("paid_at", `${year + 1}-01-01T06:00:00Z`);
  const totals = new Map<string, { orders: number; grossCents: number }>();
  for (const o of data ?? []) {
    const state = String((o.ship_to as { state?: string } | null)?.state ?? "").toUpperCase();
    if (!state) continue;
    const t = totals.get(state) ?? { orders: 0, grossCents: 0 };
    t.orders++;
    t.grossCents += (o.item_cents as number) + (o.shipping_cents as number);
    totals.set(state, t);
  }
  return [...totals.entries()]
    .map(([state, t]) => ({
      state,
      ...t,
      collecting: COLLECTING.has(state),
      near:
        !COLLECTING.has(state) &&
        (t.grossCents >= COMMON_SALES_THRESHOLD_CENTS * WARN_AT || t.orders >= COMMON_ORDER_THRESHOLD * WARN_AT),
    }))
    .sort((a, b) => b.grossCents - a.grossCents);
}

/**
 * Daily job: emails admins the first time each state reaches 80% of the common
 * threshold this year. States already warned are remembered in settings.
 */
export async function warnNearThresholds() {
  const year = currentYear();
  const near = (await salesByState(year)).filter((s) => s.near);
  if (!near.length) return 0;

  const admin = createAdminClient();
  const key = `nexus_warned_${year}`;
  const { data } = await admin.from("settings").select("value").eq("key", key).maybeSingle();
  const warned = new Set<string>(Array.isArray(data?.value) ? (data.value as string[]) : []);
  const fresh = near.filter((s) => !warned.has(s.state));
  if (!fresh.length) return 0;

  const lines = fresh.map(
    (s) => `- ${s.state}: ${formatUSD(s.grossCents)} in sales from ${s.orders} orders so far in ${year}`,
  );
  for (const to of await adminEmails()) {
    await sendEmail({
      to,
      subject: `Sales tax: ${fresh.map((s) => s.state).join(", ")} getting close to a threshold`,
      text: [
        `Sales into these states have reached 80% of the most common sales-tax threshold ($100,000 or 200 orders a year):`,
        ``,
        ...lines,
        ``,
        `Some states set higher thresholds. Please check with your accountant whether you need to register to collect sales tax there.`,
        ``,
        `Sales by state: ${siteUrl()}/admin`,
      ].join("\n"),
    });
  }
  fresh.forEach((s) => warned.add(s.state));
  await admin.from("settings").upsert({ key, value: [...warned], updated_at: new Date().toISOString() });
  return fresh.length;
}
