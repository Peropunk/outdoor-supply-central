import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { PageTitle } from "@/components/ui";
import { BANNED_ITEMS, SHIP_BY_DAYS, SHIP_REMINDER_DAY } from "@/lib/catalog";
import { formatUSD, sellerEarnings } from "@/lib/money";
import { getCommissionRate } from "@/lib/settings";
import { TEXAS_TAX_RATE } from "@/lib/tax";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers about buying, selling, shipping, payments and refunds on Outdoor Supply Central.",
};

type QA = { q: string; a: ReactNode };

function sections(rate: number): { title: string; items: QA[] }[] {
  const pct = `${Math.round(rate * 10_000) / 100}%`;
  const tax = `${Math.round(TEXAS_TAX_RATE * 10_000) / 100}%`;
  return [
    {
      title: "Buying",
      items: [
        {
          q: "How do I buy something?",
          a: (
            <>
              Open the item, tap <strong>Buy now</strong> and enter your US shipping address. You see the exact USPS
              shipping cost before you pay, then pay once for the item and shipping through Stripe.
            </>
          ),
        },
        {
          q: "How do I pay?",
          a: "By card, Apple Pay or Google Pay on Stripe's secure checkout page. We never see or store your card number.",
        },
        {
          q: "Is my money protected?",
          a: `Yes. We hold your payment until USPS scans the package. If the seller doesn't ship within ${SHIP_BY_DAYS} days, you're refunded in full automatically.`,
        },
        {
          q: "Do you charge sales tax?",
          a: `Orders shipped to Texas include Texas sales tax (${tax}) on the item and shipping, shown before you pay. Orders to other states don't include sales tax at the moment.`,
        },
        {
          q: "Where do you ship?",
          a: "Within the United States only (all 50 states and DC), by USPS.",
        },
        {
          q: "How do I track my order?",
          a: (
            <>
              We email you when it ships, and your order page shows the USPS tracking number and each step. Find your
              orders under <Link href="/dashboard?tab=purchases">My purchases</Link>.
            </>
          ),
        },
      ],
    },
    {
      title: "Selling",
      items: [
        {
          q: "How do I sell an item?",
          a: (
            <>
              Tap <strong>Sell gear</strong>: add photos, pick the condition, note any wear, set your price and choose a
              package size. It takes about three minutes. See{" "}
              <Link href="/help/how-to-sell">how to sell in 5 steps</Link>.
            </>
          ),
        },
        {
          q: "What does it cost to sell?",
          a: `Listing is free. When it sells we keep ${pct} of the item price; for example, on a ${formatUSD(10000)} sale you earn ${formatUSD(sellerEarnings(10000, rate))}. The buyer pays shipping.`,
        },
        {
          q: "When do I get paid?",
          a: "As soon as USPS scans your package, your share goes to your Stripe account, and Stripe sends it to your bank on your payout schedule, usually within 2 business days.",
        },
        {
          q: "Why do I need to set up Stripe?",
          a: "Stripe verifies sellers and pays you securely. It collects your ID and bank details on its own pages; we never see them.",
        },
        {
          q: "What can't I sell?",
          a: `Items USPS can't carry or that aren't safe to resell, including: ${BANNED_ITEMS.map((b) => b.split(",")[0].toLowerCase()).join("; ")}.`,
        },
      ],
    },
    {
      title: "Shipping",
      items: [
        {
          q: "Do I need a printer?",
          a: "No. We email you a prepaid USPS label with a QR code. Show the code at any Post Office counter and they print the label for you. You can also print the PDF label yourself.",
        },
        {
          q: "How long do I have to ship?",
          a: `${SHIP_BY_DAYS} calendar days from the moment of purchase; the exact deadline is on the order. We remind you on day ${SHIP_REMINDER_DAY}. If USPS hasn't scanned it by then, the buyer is refunded and your listing is paused.`,
        },
        {
          q: "My item is big. Can I still sell it?",
          a: (
            <>
              Yes. Choose the <strong>Oversized</strong> package size for large gear. See the sizes and weight limits in
              our <Link href="/help/shipping">shipping rules</Link>.
            </>
          ),
        },
        {
          q: "What if my package weighs more than its label?",
          a: "Pick the size that fits your packed item. If USPS charges extra because a package was heavier or bigger than its label, the seller pays that charge.",
        },
      ],
    },
    {
      title: "Problems and refunds",
      items: [
        {
          q: "Can I return an item?",
          a: (
            <>
              Sales are final. But if your item doesn&apos;t arrive, arrives damaged or isn&apos;t as described, open
              the order and tap <strong>Report a problem</strong>. We&apos;ll work it out with you and the seller, and
              can refund you when it&apos;s warranted. See <Link href="/help/returns">returns and problems</Link>.
            </>
          ),
        },
        {
          q: "How long does a refund take?",
          a: "We refund straight away; banks usually show it within 5 to 10 business days.",
        },
        {
          q: "I see a listing that breaks the rules.",
          a: "Tap Report on the listing and we'll review it.",
        },
      ],
    },
    {
      title: "Your account",
      items: [
        {
          q: "How do I sign in?",
          a: "Enter your email and we send you a sign-in link. There's no password to remember.",
        },
        {
          q: "Who can see my address?",
          a: "Other members only see your display name and city. Your full address is shared only on the USPS label for an order.",
        },
        {
          q: "How do I delete my account?",
          a: (
            <>
              In <Link href="/account">Account settings</Link>, at the bottom of the page.
            </>
          ),
        },
        {
          q: "How do I contact you?",
          a: (
            <>
              Email <a href="mailto:help@outdoorsupplycentral.com">help@outdoorsupplycentral.com</a>, or reply to any
              email from us.
            </>
          ),
        },
      ],
    },
  ];
}

export default async function FaqPage() {
  const groups = sections(await getCommissionRate());
  return (
    <div className="mx-auto max-w-2xl px-4 pt-8">
      <PageTitle sub="Quick answers about buying, selling, shipping and getting paid.">
        Frequently asked questions
      </PageTitle>
      <div className="space-y-8">
        {groups.map((g) => (
          <section key={g.title} aria-labelledby={`faq-${g.title}`}>
            <h2 id={`faq-${g.title}`} className="mb-3 text-2xl">
              {g.title}
            </h2>
            <div className="divide-y divide-line rounded-[var(--radius-card)] border border-line bg-paper">
              {g.items.map((item) => (
                <details key={item.q} className="group px-5">
                  <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 font-semibold">
                    {item.q}
                    <ChevronDown
                      className="size-5 shrink-0 text-muted transition-transform group-open:rotate-180"
                      aria-hidden="true"
                    />
                  </summary>
                  <div className="pb-4 text-ink/90">{item.a}</div>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
      <p className="mt-8 text-muted">
        More detail in our <Link href="/help">help pages</Link>.
      </p>
    </div>
  );
}
