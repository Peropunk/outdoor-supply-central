import Link from "next/link";
import { Camera, QrCode, ShieldCheck, Wallet } from "lucide-react";
import { CategoryIcon } from "@/components/CategoryIcon";
import { MountainArt } from "@/components/MountainArt";
import { SearchBox } from "@/components/SearchBox";
import { ButtonLink, ListingGrid } from "@/components/ui";
import { CATEGORIES } from "@/lib/catalog";
import { countByCategory, getRecentListings } from "@/lib/listings";

const STEPS = [
  { icon: Camera, title: "List it from your phone", body: "Photos, condition and price in four short steps." },
  { icon: QrCode, title: "Ship it with a QR code", body: "We email a prepaid USPS label. No printer needed." },
  { icon: Wallet, title: "Get paid when it ships", body: "Your money moves at USPS's first scan." },
];

export default async function Home() {
  const [recent, counts] = await Promise.all([getRecentListings(8), countByCategory()]);

  return (
    <>
      <section className="relative isolate overflow-hidden">
        <MountainArt className="absolute inset-0 -z-10 h-full w-full" />
        <div className="mx-auto max-w-4xl px-4 pt-14 pb-48 text-center sm:pt-20 sm:pb-64">
          <h1 className="font-heading text-[40px] leading-[1.05] font-semibold tracking-[0.08em] text-pine uppercase sm:text-7xl">
            Outdoor Supply Central
          </h1>
          <p className="label-caps mt-4 text-[15px] text-ink sm:text-xl">
            Camping, hiking, fishing &amp; survival gear
          </p>
          <p className="mx-auto mt-4 max-w-lg text-lg text-ink/80">
            Used gear from fellow outdoor people, with protected payment and tracked USPS shipping.
          </p>
          <div className="mx-auto mt-8 grid max-w-sm gap-3 sm:max-w-md sm:grid-cols-2">
            <ButtonLink href="/browse">Buy gear</ButtonLink>
            <ButtonLink href="/sell" variant="secondary">
              Sell gear
            </ButtonLink>
          </div>
          <div className="mx-auto mt-6 max-w-md">
            <SearchBox />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-12" aria-labelledby="cat-heading">
        <h2 id="cat-heading" className="text-2xl sm:text-3xl">
          Shop by activity
        </h2>
        <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/browse?category=${c.slug}`}
                className="flex h-full flex-col items-start gap-2 rounded-[var(--radius-card)] border border-line bg-paper p-4 text-ink no-underline hover:border-trail"
              >
                <CategoryIcon slug={c.slug} className="size-8 text-trail" />
                <span className="font-heading text-lg leading-tight font-semibold text-pine">{c.name}</span>
                <span className="text-[14px] text-muted">
                  {counts[c.slug] ?? 0} {counts[c.slug] === 1 ? "item" : "items"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-14" aria-labelledby="recent-heading">
        <div className="mb-5 flex items-end justify-between gap-4">
          <h2 id="recent-heading" className="text-2xl sm:text-3xl">
            Recently added gear
          </h2>
          <Link href="/browse" className="shrink-0 font-semibold">
            See all
          </Link>
        </div>
        {recent.length ? (
          <ListingGrid listings={recent} />
        ) : (
          <div className="rounded-[var(--radius-card)] border border-dashed border-line bg-paper p-10 text-center">
            <p className="text-lg font-semibold">Fresh gear is on its way.</p>
            <p className="mt-1 text-muted">
              Be one of the first to list. It takes about three minutes from your phone.
            </p>
            <ButtonLink href="/sell" className="mt-5">
              Sell your gear
            </ButtonLink>
          </div>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-16" aria-labelledby="how-heading">
        <div className="rounded-[var(--radius-card)] bg-sand px-5 py-10 sm:px-10">
          <h2 id="how-heading" className="text-2xl sm:text-3xl">
            Selling is simple
          </h2>
          <ol className="mt-6 grid gap-6 sm:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, body }, i) => (
              <li key={title} className="flex gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-pine text-white">
                  <Icon className="size-6" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-semibold">
                    {i + 1}. {title}
                  </p>
                  <p className="text-muted">{body}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex flex-col items-start gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-muted">
              <ShieldCheck className="size-5 shrink-0 text-trail" aria-hidden="true" />
              Buyers pay through Stripe. Sellers are paid only once the package is on its way.
            </p>
            <ButtonLink href="/help/how-to-sell" variant="outline">
              How it works
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
