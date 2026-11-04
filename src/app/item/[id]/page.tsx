import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Flag, MapPin, Package, ShieldCheck, Truck } from "lucide-react";
import { ButtonLink, ConditionBadge, ListingGrid } from "@/components/ui";
import { getCategory, getPackageSize } from "@/lib/catalog";
import { getListing, searchListings } from "@/lib/listings";
import { formatUSD } from "@/lib/money";
import { Gallery } from "./Gallery";

export async function generateMetadata(props: PageProps<"/item/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const listing = await getListing(id);
  return listing ? { title: listing.title, description: listing.description } : {};
}

export default async function ItemPage(props: PageProps<"/item/[id]">) {
  const { id } = await props.params;
  const listing = await getListing(id);
  if (!listing) notFound();

  const category = getCategory(listing.category)!;
  const pkg = getPackageSize(listing.packageSize);
  const available = listing.status === "active";
  const more = (await searchListings({ category: listing.category })).filter((l) => l.id !== listing.id).slice(0, 4);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-4 pb-28 md:pt-8 md:pb-0">
      <nav aria-label="Breadcrumb" className="text-[15px] text-muted">
        <Link href="/browse">Shop</Link> <span aria-hidden="true">/</span>{" "}
        <Link href={`/browse?category=${category.slug}`}>{category.name}</Link> <span aria-hidden="true">/</span>{" "}
        {listing.subcategory}
      </nav>

      {/* Photos stay pinned while the details scroll: beside them on desktop, sliding
          up over them on phones. Block layout on phones, because a grid would limit
          the pinned photo to its own row. */}
      <div className="mt-4 md:grid md:grid-cols-[1.1fr_1fr] md:gap-8">
        <section aria-label="Photos" className="sticky top-16 self-start sm:top-20 md:top-24">
          <Gallery photos={listing.photos} />
        </section>

        <section
          aria-labelledby="item-title"
          className="relative z-10 -mx-4 rounded-t-2xl bg-canvas px-4 pt-5 md:static md:mx-0 md:rounded-none md:bg-transparent md:px-0 md:pt-0"
        >
          <h1 id="item-title" className="text-2xl leading-snug sm:text-3xl">
            {listing.title}
          </h1>
          {listing.brand && <p className="mt-1 text-muted">{listing.brand}</p>}
          <p className="mt-3 text-[28px] font-bold">{formatUSD(listing.priceCents)}</p>

          {!available && (
            <p className="mt-3 rounded-md bg-sand px-4 py-3 font-semibold text-boot">
              {listing.status === "sold" ? "This item has sold." : "This item isn't available right now."}
            </p>
          )}

          <div className="mt-5 space-y-4 rounded-[var(--radius-card)] border border-line bg-paper p-5">
            <div>
              <h2 className="label-caps text-[13px] text-muted">Condition</h2>
              <div className="mt-1.5">
                <ConditionBadge condition={listing.condition} withMeaning />
              </div>
            </div>
            <div>
              <h2 className="label-caps text-[13px] text-muted">Seller&apos;s notes on wear</h2>
              <p className="mt-1">{listing.flaws}</p>
            </div>
          </div>

          <ul className="mt-5 space-y-3">
            <li className="flex gap-3">
              <Truck className="mt-0.5 size-5 shrink-0 text-trail" aria-hidden="true" />
              <span>
                USPS shipping about <strong>{formatUSD(pkg.estimateCents)}</strong>. You&apos;ll see the exact rate for
                your address at checkout.
              </span>
            </li>
            <li className="flex gap-3">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-trail" aria-hidden="true" />
              <span>
                <strong>Protected payment.</strong> You pay through Stripe, and the seller is paid only once USPS scans
                the package.
              </span>
            </li>
            <li className="flex gap-3">
              <Package className="mt-0.5 size-5 shrink-0 text-trail" aria-hidden="true" />
              <span>Ships within 5 days, or your order is cancelled and fully refunded.</span>
            </li>
          </ul>

          <div className="mt-6 hidden md:block">
            {available && (
              <ButtonLink href={`/checkout/${listing.id}`} className="w-full">
                Buy now
              </ButtonLink>
            )}
          </div>

          <div className="mt-8">
            <h2 className="text-xl">About this item</h2>
            <p className="mt-2 whitespace-pre-line">{listing.description}</p>
          </div>

          <div className="mt-8 flex items-center justify-between gap-4 border-t border-line pt-5">
            <div>
              <p className="font-semibold">{listing.seller.displayName}</p>
              {listing.seller.city && (
                <p className="flex items-center gap-1 text-[15px] text-muted">
                  <MapPin className="size-4" aria-hidden="true" />
                  Ships from {listing.seller.city}
                  {listing.seller.state && `, ${listing.seller.state}`}
                </p>
              )}
            </div>
            <Link href={`/item/${listing.id}/report`} className="flex items-center gap-1 text-[15px] text-muted">
              <Flag className="size-4" aria-hidden="true" />
              Report
            </Link>
          </div>
        </section>
      </div>

      {more.length > 0 && (
        <section className="mt-14" aria-labelledby="more-heading">
          <h2 id="more-heading" className="mb-5 text-2xl">
            More {category.name.toLowerCase()} gear
          </h2>
          <ListingGrid listings={more} />
        </section>
      )}

      {available && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur md:hidden">
          <div className="mx-auto flex max-w-6xl items-center gap-4">
            <div className="min-w-0">
              <p className="price leading-tight">{formatUSD(listing.priceCents)}</p>
              <p className="truncate text-[13px] text-muted">+ USPS shipping</p>
            </div>
            <ButtonLink href={`/checkout/${listing.id}`} className="ml-auto flex-1">
              Buy now
            </ButtonLink>
          </div>
        </div>
      )}
    </div>
  );
}
