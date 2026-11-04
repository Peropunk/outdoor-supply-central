import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GearPhoto } from "@/components/GearPhoto";
import { ButtonLink, ConditionBadge } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getPackageSize } from "@/lib/catalog";
import { getListing } from "@/lib/listings";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { CheckoutForm } from "../CheckoutForm";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage(props: PageProps<"/checkout/[id]">) {
  const { id } = await props.params;
  const listing = await getListing(id);
  if (!listing || listing.status !== "active") notFound();

  const live = isSupabaseConfigured;
  const buyer = live ? await requireUser(`/checkout/${id}`) : null;

  if (buyer?.id === listing.seller.id) {
    return (
      <div className="mx-auto max-w-lg px-4 pt-16 text-center">
        <h1 className="text-3xl">This is your listing</h1>
        <p className="mt-2 text-muted">You can&apos;t buy your own gear, but you can change it from your dashboard.</p>
        <ButtonLink href="/dashboard?tab=listings" className="mt-6">
          Go to my listings
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pt-8">
      <h1 className="text-3xl">Checkout</h1>
      <CheckoutForm
        listingId={listing.id}
        priceCents={listing.priceCents}
        estimateCents={getPackageSize(listing.packageSize).estimateCents}
        live={live}
        defaultName={buyer?.displayName ?? ""}
        summary={
          <div className="flex gap-4">
            <GearPhoto photo={listing.photos[0]} size="sm" className="w-24 shrink-0 rounded-md" />
            <div className="min-w-0">
              <Link href={`/item/${listing.id}`} className="line-clamp-2 font-semibold text-ink">
                {listing.title}
              </Link>
              <div className="mt-1">
                <ConditionBadge condition={listing.condition} />
              </div>
            </div>
          </div>
        }
      />
      <div className="h-20 md:hidden" />
    </div>
  );
}
