import Link from "next/link";
import type { ReactNode } from "react";
import { BANNED_ITEMS, CONDITIONS, PACKAGE_SIZES, SHIP_BY_DAYS, SHIP_REMINDER_DAY, boxLabel } from "@/lib/catalog";
import { formatUSD, sellerEarnings } from "@/lib/money";
import { TEXAS_TAX_RATE } from "@/lib/tax";
import { getCommissionRate } from "@/lib/settings";
import { privacyBody, termsBody } from "./legal";

// Help and policy pages (Chunk 6). Terms and privacy are JD's final text, in
// legal.tsx. The commission comes from the admin setting, so the Fees page and
// the terms always match.

export type HelpPage = { slug: string; title: string; summary: string; body: ReactNode };

export const HELP_SLUGS = [
  "how-to-sell",
  "buying",
  "fees",
  "shipping",
  "conditions",
  "banned-items",
  "returns",
  "terms",
  "privacy",
] as const;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-xl">{title}</h2>
      {children}
    </section>
  );
}

function buildHelpPages(rate: number): HelpPage[] {
  const pct = `${Math.round(rate * 10_000) / 100}%`;
  return [
    {
      slug: "how-to-sell",
      title: "How to sell in 5 steps",
      summary: "From photo to payout, with no printer needed.",
      body: (
        <ol className="space-y-6">
          {[
            [
              "List it",
              "Take a few photos, pick the condition, note any wear and set your price. It takes about three minutes on a phone. The first time, you also set up payouts with Stripe and add the address you'll ship from.",
            ],
            [
              "It sells",
              "The buyer pays through Stripe. We email you right away with a prepaid USPS label and a QR code.",
            ],
            [
              "Ship it",
              `Pack the item and show the QR code at any Post Office counter within ${SHIP_BY_DAYS} days. No printer needed. You can also print the label and drop the package in a USPS box.`,
            ],
            [
              "Get paid",
              "As soon as USPS scans the package, your share goes to your Stripe account and on to your bank.",
            ],
            [
              "It arrives",
              "The buyer tracks it on their order page. If anything is wrong they tap “Report a problem” and we help sort it out.",
            ],
          ].map(([title, body], i) => (
            <li key={title} className="flex gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-pine font-semibold text-white">
                {i + 1}
              </span>
              <div>
                <h2 className="text-xl">{title}</h2>
                <p className="mt-1">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      ),
    },
    {
      slug: "buying",
      title: "How buying works",
      summary: "One payment, USPS tracking, and your money protected until it ships.",
      body: (
        <>
          <p>
            Find something you like, tap <strong>Buy now</strong> and enter your shipping address. You see the exact
            USPS cost before you pay, and you pay once for the item and shipping together, by card or Apple Pay or
            Google Pay, through Stripe. We ship within the United States only. Orders shipped to Texas include Texas
            sales tax ({Math.round(TEXAS_TAX_RATE * 10_000) / 100}%) on the item and shipping, shown before you pay.
          </p>
          <Section title="Your money is protected">
            <p>
              We hold your payment until USPS scans the package. If the seller doesn&apos;t ship within {SHIP_BY_DAYS}{" "}
              days, you&apos;re refunded in full automatically.
            </p>
          </Section>
          <Section title="Tracking">
            <p>
              We email you when it ships. Your order page shows the USPS tracking number and each step: Paid, Label
              ready, Shipped and Delivered. Find your orders under{" "}
              <Link href="/dashboard?tab=purchases">My purchases</Link>.
            </p>
          </Section>
          <Section title="If something's wrong">
            <p>
              Open the order and tap <strong>Report a problem</strong>. See{" "}
              <Link href="/help/returns">returns and problems</Link>.
            </p>
          </Section>
        </>
      ),
    },
    {
      slug: "fees",
      title: "Fees",
      summary: `Free to list. A ${pct} fee only when it sells.`,
      body: (
        <>
          <p>
            Listing is free. When your item sells we keep {pct} of the item price and you keep the rest. Card processing
            fees are on us.
          </p>
          <p>
            For example, on a {formatUSD(10000)} sale you earn <strong>{formatUSD(sellerEarnings(10000, rate))}</strong>
            . The buyer pays shipping on top of the price, so it doesn&apos;t come out of your share.
          </p>
          <p>
            Your share is paid when USPS first scans the package. Stripe then sends it to your bank on your payout
            schedule, usually within 2 business days. See your payouts in your{" "}
            <Link href="/dashboard?tab=payouts">dashboard</Link>.
          </p>
          <p>
            If an order is refunded in full, the buyer gets everything back and we don&apos;t keep our fee; you&apos;re
            not paid for that order. If USPS charges extra because a package was heavier or bigger than its label, you
            pay that charge.
          </p>
        </>
      ),
    },
    {
      slug: "shipping",
      title: "Shipping rules",
      summary: "USPS, a prepaid label, and a ship-by deadline.",
      body: (
        <>
          <p>
            Every order ships with USPS on a prepaid label we email you after the sale. It&apos;s also on the order page
            in your dashboard. Show the QR code at the Post Office counter, or print the PDF label and drop the package
            in any USPS box.
          </p>
          <Section title={`Ship within ${SHIP_BY_DAYS} days`}>
            <p>
              The deadline is {SHIP_BY_DAYS} calendar days from the moment of purchase, shown to the minute on the
              order. We remind you on day {SHIP_REMINDER_DAY}. If USPS hasn&apos;t scanned the package by then, the
              order is cancelled, the buyer is fully refunded, the label is cancelled and your listing is paused. Put it
              back on sale from your dashboard if you still have the item. Please don&apos;t ship it after that.
            </p>
            <p>
              Show the QR code at a Post Office counter so the clerk scans it on the spot. If you handed it to USPS in
              time but it wasn&apos;t scanned, reply to the cancellation email with your Post Office receipt.
            </p>
          </Section>
          <Section title="Package sizes">
            <p>
              Pick the size when you list. The label is bought for that size and weight, so pack the item in a box no
              bigger than it. If USPS charges extra because the package is bigger or heavier than its label, the seller
              pays that charge. Big gear can use the Oversized size; USPS prices boxes that big by their dimensions, so
              shipping costs more.
            </p>
            <ul className="list-disc space-y-1 pl-6">
              {PACKAGE_SIZES.map((p) => (
                <li key={p.id}>
                  <strong>{p.label}</strong>, up to {p.maxWeightLb} lb in a box up to {boxLabel(p)}: {p.examples}
                </li>
              ))}
            </ul>
          </Section>
          <Section title="Packing tips">
            <ul className="list-disc space-y-1 pl-6">
              <li>Clean the gear and make sure it&apos;s dry, especially tents and sleeping bags.</li>
              <li>Fill gaps with paper or bubble wrap so nothing rattles.</li>
              <li>Remove old labels and barcodes from a reused box.</li>
            </ul>
          </Section>
        </>
      ),
    },
    {
      slug: "conditions",
      title: "Condition grades",
      summary: "Four grades, plus the seller's own notes on wear.",
      body: (
        <>
          <dl className="space-y-4">
            {CONDITIONS.map((c) => (
              <div key={c.id}>
                <dt className="font-heading text-xl font-semibold text-pine">{c.label}</dt>
                <dd>{c.meaning}</dd>
              </div>
            ))}
          </dl>
          <p>
            Every listing also has the seller&apos;s notes on wear and flaws, shown right under the grade. Broken or
            parts-only gear isn&apos;t allowed.
          </p>
        </>
      ),
    },
    {
      slug: "banned-items",
      title: "Banned items",
      summary: "What can't be sold or shipped.",
      body: (
        <>
          <p>To keep everyone safe and follow USPS rules, these can&apos;t be listed:</p>
          <ul className="list-disc space-y-1 pl-6">
            {BANNED_ITEMS.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
          <p>
            Listings that break these rules are removed, and repeat breaks can get an account suspended. If you&apos;re
            not sure, ask us before you list. See a listing that breaks the rules? Tap <strong>Report</strong> on it.
          </p>
        </>
      ),
    },
    {
      slug: "returns",
      title: "Returns and problems",
      summary: "Sales are final, but we step in if something's wrong.",
      body: (
        <>
          <p>
            Sales are final, so read the condition and the seller&apos;s notes before you buy. If your item doesn&apos;t
            arrive, arrives damaged, or isn&apos;t as described, open the order and tap{" "}
            <strong>Report a problem</strong>.
          </p>
          <p>
            That starts one conversation between you, the seller and us. Add photos if something&apos;s damaged or
            different from the listing. We reply within one business day, and we can refund you in full when it&apos;s
            warranted.
          </p>
          <p>Refunds go back to the card you paid with. Banks usually show them within 5 to 10 business days.</p>
        </>
      ),
    },
    {
      slug: "terms",
      title: "Terms of use",
      summary: "The agreement for buying and selling on Outdoor Supply Central.",
      body: termsBody(rate),
    },
    {
      slug: "privacy",
      title: "Privacy policy",
      summary: "What we collect, who sees it, and your choices.",
      body: privacyBody(),
    },
  ];
}

/** Every help page, with the current commission. */
export async function getHelpPages() {
  return buildHelpPages(await getCommissionRate());
}

export async function getHelpPage(slug: string) {
  return (await getHelpPages()).find((p) => p.slug === slug);
}
