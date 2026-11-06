"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { CircleAlert, Lock, ShieldCheck, Truck } from "lucide-react";
import { Card, Field, PreviewNotice, buttonClass, inputClass } from "@/components/ui";
import { formatUSD } from "@/lib/money";
import { quoteShipping, startCheckout, type QuoteResult, type ShipTo } from "./actions";

const STATES =
  "AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split(
    " ",
  );

type Quote = Extract<QuoteResult, { ok: true }>;

export function CheckoutForm({
  listingId,
  priceCents,
  estimateCents,
  live,
  paymentsReady,
  cancelled,
  defaultName,
  summary,
}: {
  listingId: string;
  priceCents: number;
  estimateCents: number;
  /** Supabase is connected. In preview mode the rate is an estimate and Pay opens a sample order. */
  live: boolean;
  /** Stripe is connected, so Pay opens Stripe Checkout. */
  paymentsReady: boolean;
  /** The buyer came back from Stripe without paying. */
  cancelled: boolean;
  defaultName: string;
  summary: ReactNode;
}) {
  const [address, setAddress] = useState<ShipTo>({
    name: defaultName,
    line1: "",
    line2: "",
    city: "",
    state: "",
    zip: "",
  });
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [paying, setPaying] = useState(false);

  // A rate only holds for the address it was quoted for.
  function update(patch: Partial<ShipTo>) {
    setAddress((a) => ({ ...a, ...patch }));
    setQuote(null);
    setError("");
  }

  async function getRate(e: React.FormEvent) {
    e.preventDefault();
    if (!live || quote) return;
    setBusy(true);
    setError("");
    try {
      const result = await quoteShipping(listingId, address);
      if (result.ok) setQuote(result);
      else setError(result.error);
    } catch {
      setError("We couldn't get a shipping rate just now. Please try again.");
    }
    setBusy(false);
  }

  async function pay() {
    setPaying(true);
    setError("");
    try {
      const result = await startCheckout(listingId, address);
      if (result.ok) {
        window.location.assign(result.url);
        return;
      }
      setError(result.error);
      setQuote(null);
    } catch {
      setError("We couldn't open the payment page. Please try again.");
    }
    setPaying(false);
  }

  const shippingCents = live ? quote?.shippingCents : estimateCents;
  const totalCents = shippingCents == null ? null : priceCents + shippingCents;

  const action = !live ? (
    <Link href="/orders/OSC-10491?new=1" className={buttonClass("primary", "w-full")}>
      <Lock className="size-4" aria-hidden="true" />
      Pay {formatUSD(totalCents ?? priceCents)}
    </Link>
  ) : quote ? (
    <button
      type="button"
      onClick={pay}
      disabled={!paymentsReady || paying}
      className={buttonClass("primary", "w-full")}
    >
      <Lock className="size-4" aria-hidden="true" />
      {paying ? "Opening secure checkout…" : `Pay ${formatUSD(totalCents ?? priceCents)}`}
    </button>
  ) : (
    <button type="submit" disabled={busy} className={buttonClass("primary", "w-full")}>
      <Truck className="size-4" aria-hidden="true" />
      {busy ? "Checking USPS…" : "See shipping cost"}
    </button>
  );

  return (
    <form onSubmit={getRate} className="mt-6 grid gap-8 md:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <Card className="space-y-5">
          <h2 className="text-xl">Ship to</h2>
          <Field label="Full name" htmlFor="name">
            <input
              id="name"
              name="name"
              autoComplete="shipping name"
              required
              value={address.name}
              onChange={(e) => update({ name: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Street address" htmlFor="line1">
            <input
              id="line1"
              name="address-line1"
              autoComplete="shipping address-line1"
              required
              value={address.line1}
              onChange={(e) => update({ line1: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Apartment, suite (optional)" htmlFor="line2">
            <input
              id="line2"
              name="address-line2"
              autoComplete="shipping address-line2"
              value={address.line2}
              onChange={(e) => update({ line2: e.target.value })}
              className={inputClass}
            />
          </Field>
          <div className="grid grid-cols-[1fr_96px] gap-3 sm:grid-cols-[1fr_96px_140px]">
            <Field label="City" htmlFor="city">
              <input
                id="city"
                name="city"
                autoComplete="shipping address-level2"
                required
                value={address.city}
                onChange={(e) => update({ city: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="State" htmlFor="state">
              <select
                id="state"
                name="state"
                autoComplete="shipping address-level1"
                required
                value={address.state}
                onChange={(e) => update({ state: e.target.value })}
                className={inputClass}
              >
                <option value=""></option>
                {STATES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="ZIP code" htmlFor="zip">
              <input
                id="zip"
                name="postal-code"
                inputMode="numeric"
                autoComplete="shipping postal-code"
                required
                maxLength={5}
                value={address.zip}
                onChange={(e) => update({ zip: e.target.value.replace(/\D/g, "") })}
                className={inputClass}
              />
            </Field>
          </div>
        </Card>

        {error && (
          <p role="alert" className="flex gap-2 rounded-md border border-alert/30 bg-alert/5 p-4 text-alert">
            <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" /> {error}
          </p>
        )}

        {!live && (
          <PreviewNotice>
            the USPS rate is an estimate for the item&apos;s package size, and Pay opens a sample order.
          </PreviewNotice>
        )}
        {live && quote && !paymentsReady && (
          <PreviewNotice>the Pay button turns on once Stripe is connected.</PreviewNotice>
        )}
        {cancelled && !error && (
          <p role="status" className="rounded-md bg-sand p-4">
            Checkout cancelled. You weren&apos;t charged, and the item is back on sale.
          </p>
        )}

        <div className="hidden md:block">{action}</div>
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur md:hidden">
          {action}
        </div>
      </div>

      <aside className="-order-1 md:order-none">
        <Card>
          {summary}
          <dl className="mt-5 space-y-2 border-t border-line pt-4" aria-live="polite">
            <div className="flex justify-between">
              <dt>Item</dt>
              <dd>{formatUSD(priceCents)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>
                USPS shipping
                {quote && <span className="block text-[14px] text-muted">{quote.service}</span>}
              </dt>
              <dd className={shippingCents == null ? "text-right text-muted" : ""}>
                {shippingCents == null ? "Add your address" : formatUSD(shippingCents)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-line pt-2 text-lg font-bold">
              <dt>Total</dt>
              <dd>{totalCents == null ? "—" : formatUSD(totalCents)}</dd>
            </div>
          </dl>
          <p className="mt-4 flex gap-2 text-[15px] text-muted">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-trail" aria-hidden="true" />
            Protected payment: the seller is paid only after USPS scans the package. If it doesn&apos;t ship in 5 days
            you get a full refund.
          </p>
        </Card>
        <Link href={`/item/${listingId}`} className={buttonClass("ghost", "mt-2 w-full")}>
          Back to item
        </Link>
      </aside>
    </form>
  );
}
