import Link from "next/link";
import type { ReactNode } from "react";
import { BANNED_ITEMS, CONDITIONS, PACKAGE_SIZES, SHIP_BY_DAYS, SHIP_REMINDER_DAY, boxLabel } from "@/lib/catalog";
import { formatUSD, sellerEarnings } from "@/lib/money";
import { getCommissionRate } from "@/lib/settings";

// Help and policy pages (Chunk 6). Wording follows the open-decision defaults
// and needs JD's review; terms and privacy need his lawyer's review too. The
// commission comes from the admin setting, so the Fees page always matches.

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

function DraftNote() {
  return (
    <p className="rounded-md border border-dashed border-boot/50 bg-sand px-4 py-2.5 text-[14px]">
      <strong>Draft for legal review.</strong> This text follows how the site works today. Outdoor Central, LLC and its
      lawyer should review it before launch.
    </p>
  );
}

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
            Google Pay, through Stripe.
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
              We remind you on day {SHIP_REMINDER_DAY}. If USPS hasn&apos;t scanned the package after {SHIP_BY_DAYS}{" "}
              days, the order is cancelled, the buyer is fully refunded, the label is cancelled and your item goes back
              on sale. Please don&apos;t ship it after that.
            </p>
          </Section>
          <Section title="Package sizes">
            <p>
              Pick the size when you list. The label is bought for that size and weight, so pack the item in a box no
              bigger than it. USPS may charge extra for a package that&apos;s bigger or heavier than its label.
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
      summary: "The rules for buying and selling on Outdoor Supply Central.",
      body: (
        <>
          <DraftNote />
          <Section title="Who we are">
            <p>
              Outdoor Supply Central is run by Outdoor Central, LLC (“we”, “us”). It&apos;s a marketplace where people
              sell used outdoor gear to each other. We aren&apos;t the seller of items listed by members, and we
              don&apos;t own or inspect them.
            </p>
          </Section>
          <Section title="Your account">
            <p>
              You need an account to buy or sell, and you must be at least 18 and in the United States. Keep your email
              account secure: we sign you in with links sent to it. You&apos;re responsible for what happens on your
              account.
            </p>
          </Section>
          <Section title="Selling">
            <ul className="list-disc space-y-1 pl-6">
              <li>Only list gear you own and can ship from the US, described honestly, with real photos.</li>
              <li>
                No <Link href="/help/banned-items">banned items</Link>. Grade the condition fairly and note every flaw.
              </li>
              <li>
                Set up payouts with Stripe before your first listing. Stripe&apos;s own terms apply to your Stripe
                account.
              </li>
              <li>
                Ship with the label we provide within {SHIP_BY_DAYS} days of the sale, in a box no bigger than the
                package size you chose.
              </li>
            </ul>
          </Section>
          <Section title="Buying">
            <p>
              The price you see plus the USPS shipping shown at checkout is what you pay. Payment is taken by Stripe
              when you order. Sales are final except as described in{" "}
              <Link href="/help/returns">returns and problems</Link>.
            </p>
          </Section>
          <Section title="Payments and fees">
            <p>
              We collect the buyer&apos;s payment and hold it until USPS scans the package, then pay the seller their
              share minus our fee (see <Link href="/help/fees">fees</Link>). If an order isn&apos;t shipped in time, we
              refund the buyer in full and the seller isn&apos;t paid. If we refund an order after the seller was paid,
              we may take the seller&apos;s share back from their Stripe balance.
            </p>
          </Section>
          <Section title="Problems and our decisions">
            <p>
              If something goes wrong with an order, use <strong>Report a problem</strong>. We look at what both sides
              send and decide whether to refund. Our decision on refunds through the site is final, though it
              doesn&apos;t limit any rights you have by law.
            </p>
          </Section>
          <Section title="Things you mustn't do">
            <ul className="list-disc space-y-1 pl-6">
              <li>Arrange payment or delivery outside the site for an item found here.</li>
              <li>List counterfeit, stolen or misdescribed items, or post misleading photos.</li>
              <li>Harass other members, or use the site to collect their details.</li>
              <li>Interfere with the site or try to get around its rules.</li>
            </ul>
            <p>
              We may remove listings and suspend or close accounts that break these terms. Orders already paid are still
              shipped or refunded.
            </p>
          </Section>
          <Section title="Liability">
            <p>
              The site is provided as it is. To the extent the law allows, we aren&apos;t liable for the condition,
              safety or legality of items members list, or for indirect losses. Outdoor gear can be dangerous if
              it&apos;s worn or damaged: check used gear before you rely on it.
            </p>
          </Section>
          <Section title="Changes and contact">
            <p>
              We may update these terms and will note the date at the top when we do. Questions? Reply to any email from
              us.
            </p>
          </Section>
        </>
      ),
    },
    {
      slug: "privacy",
      title: "Privacy policy",
      summary: "What we collect, who sees it, and your choices.",
      body: (
        <>
          <DraftNote />
          <Section title="What we collect">
            <ul className="list-disc space-y-1 pl-6">
              <li>Your email address, display name, city and state, and the answers to our three welcome questions.</li>
              <li>For sellers: your ship-from address and phone number, which USPS needs for labels.</li>
              <li>For buyers: the shipping address you enter at checkout.</li>
              <li>Your listings and photos, orders, and messages in problem threads.</li>
            </ul>
          </Section>
          <Section title="What we never see">
            <p>
              Card numbers and bank details. Payments and payouts are handled by Stripe, which collects them directly.
            </p>
          </Section>
          <Section title="Who sees what">
            <ul className="list-disc space-y-1 pl-6">
              <li>Other members see your display name and city on your listings, never your address.</li>
              <li>
                A seller sees the buyer&apos;s name and shipping address on the label. The buyer sees the seller&apos;s
                display name and city only.
              </li>
              <li>Problem threads are seen by the buyer, the seller and us.</li>
            </ul>
          </Section>
          <Section title="Services we use">
            <p>We share only what each one needs to do its job:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>Stripe: payments, seller identity checks and payouts.</li>
              <li>Shippo and USPS: shipping rates, labels and tracking (names, addresses, phone and email).</li>
              <li>Supabase and Vercel: secure hosting of the site and its data in the US.</li>
              <li>Resend: sending order emails.</li>
              <li>Geoapify: suggesting addresses as you type them (it receives the text you type in that field).</li>
            </ul>
            <p>We don&apos;t sell your information or use it for advertising.</p>
          </Section>
          <Section title="Cookies">
            <p>We use cookies only to keep you signed in and to finish sign-in. There are no ad or tracking cookies.</p>
          </Section>
          <Section title="Your choices">
            <p>
              You can update your details or delete your account any time in{" "}
              <Link href="/account">account settings</Link>. We keep order records as long as the law requires for tax
              and accounting, even after an account is deleted.
            </p>
          </Section>
          <Section title="Contact">
            <p>Questions about your information? Reply to any email from us.</p>
          </Section>
        </>
      ),
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
