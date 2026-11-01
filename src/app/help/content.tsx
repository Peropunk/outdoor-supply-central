import Link from "next/link";
import type { ReactNode } from "react";
import { BANNED_ITEMS, CONDITIONS, PACKAGE_SIZES, SHIP_BY_DAYS, SHIP_REMINDER_DAY } from "@/lib/catalog";
import { DEFAULT_COMMISSION_RATE, formatUSD, sellerEarnings } from "@/lib/money";

// Help and policy pages (Chunk 6). Wording follows the open-decision defaults
// and needs JD's review; terms and privacy need his lawyer's review too.

export type HelpPage = { slug: string; title: string; summary: string; body: ReactNode };

const pct = `${Math.round(DEFAULT_COMMISSION_RATE * 100)}%`;

export const HELP_PAGES: HelpPage[] = [
  {
    slug: "how-to-sell",
    title: "How to sell in 5 steps",
    summary: "From photo to payout, with no printer needed.",
    body: (
      <ol className="space-y-6">
        {[
          [
            "List it",
            "Take a few photos, pick the condition, note any wear and set your price. It takes about three minutes on a phone.",
          ],
          [
            "It sells",
            "The buyer pays through Stripe. We email you right away with a prepaid USPS label and a QR code.",
          ],
          [
            "Ship it",
            `Pack the item and show the QR code at any Post Office within ${SHIP_BY_DAYS} days. No printer needed.`,
          ],
          ["Get paid", "When USPS scans the package, your share is sent to your bank through Stripe."],
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
          For example, on a {formatUSD(10000)} sale you earn <strong>{formatUSD(sellerEarnings(10000))}</strong>. The
          buyer pays shipping on top of the price, so it doesn&apos;t come out of your share.
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
          Every order ships with USPS on a prepaid label we email you after the sale. Show the QR code at the Post
          Office counter, or print the PDF label if you prefer.
        </p>
        <h2 className="text-xl">Ship within {SHIP_BY_DAYS} days</h2>
        <p>
          We remind you on day {SHIP_REMINDER_DAY}. If the package hasn&apos;t been scanned by USPS after {SHIP_BY_DAYS}{" "}
          days, the order is cancelled, the buyer is fully refunded and your item goes back on sale.
        </p>
        <h2 className="text-xl">Package sizes</h2>
        <p>Pick the size when you list. Weigh the packed box if you can: USPS may charge extra if it&apos;s heavier.</p>
        <ul className="list-disc space-y-1 pl-6">
          {PACKAGE_SIZES.map((p) => (
            <li key={p.id}>
              <strong>{p.label}</strong>, up to {p.maxWeightLb} lb: {p.examples}
            </li>
          ))}
        </ul>
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
        <p>Listings that break these rules are removed. If you&apos;re not sure, ask us before you list.</p>
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
          arrive, arrives damaged, or isn&apos;t as described, open the order and tap <strong>Report a problem</strong>.
          That starts one conversation with you, the seller and us, and we can refund you when it&apos;s warranted.
        </p>
      </>
    ),
  },
  {
    slug: "terms",
    title: "Terms of use",
    summary: "Draft for JD and his lawyer to review.",
    body: (
      <p>
        Draft pending. Outdoor Central, LLC&apos;s terms of use go here once JD (and his lawyer, if he uses one) has
        reviewed them in Chunk 6. See <Link href="/help/fees">fees</Link>,{" "}
        <Link href="/help/shipping">shipping rules</Link> and <Link href="/help/banned-items">banned items</Link> for
        the rules they will reference.
      </p>
    ),
  },
  {
    slug: "privacy",
    title: "Privacy policy",
    summary: "Draft for JD and his lawyer to review.",
    body: (
      <p>
        Draft pending. In short: buyers see a seller&apos;s display name and city only; addresses are shared only with
        USPS for the label; payments and bank details are handled by Stripe and never stored by us.
      </p>
    ),
  },
];

export function getHelpPage(slug: string) {
  return HELP_PAGES.find((p) => p.slug === slug);
}
