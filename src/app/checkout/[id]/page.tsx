import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock, ShieldCheck } from "lucide-react";
import { GearPhoto } from "@/components/GearPhoto";
import { ButtonLink, Card, ConditionBadge, Field, PreviewNotice, inputClass } from "@/components/ui";
import { getPackageSize } from "@/lib/catalog";
import { getListing } from "@/lib/listings";
import { formatUSD } from "@/lib/money";

export const metadata: Metadata = { title: "Checkout" };

const STATES =
  "AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split(
    " ",
  );

export default async function CheckoutPage(props: PageProps<"/checkout/[id]">) {
  const { id } = await props.params;
  const listing = await getListing(id);
  if (!listing || listing.status !== "active") notFound();

  // Chunk 4: the live USPS rate comes from Shippo for the buyer's address, and
  // the listing is reserved while Stripe Checkout is open.
  const shipping = getPackageSize(listing.packageSize).estimateCents;
  const total = listing.priceCents + shipping;

  return (
    <div className="mx-auto max-w-5xl px-4 pt-8">
      <h1 className="text-3xl">Checkout</h1>
      <div className="mt-6 grid gap-8 md:grid-cols-[1fr_380px]">
        {/* Preview: the pay button links to a sample order. Chunk 4 turns this into a
            form that posts to a server action and redirects to Stripe Checkout. */}
        <div className="space-y-6">
          <Card className="space-y-5">
            <h2 className="text-xl">Ship to</h2>
            <Field label="Full name" htmlFor="name">
              <input id="name" name="name" autoComplete="name" required className={inputClass} />
            </Field>
            <Field label="Street address" htmlFor="line1">
              <input id="line1" name="line1" autoComplete="address-line1" required className={inputClass} />
            </Field>
            <Field label="Apartment, suite (optional)" htmlFor="line2">
              <input id="line2" name="line2" autoComplete="address-line2" className={inputClass} />
            </Field>
            <div className="grid grid-cols-[1fr_96px] gap-3 sm:grid-cols-[1fr_96px_140px]">
              <Field label="City" htmlFor="city">
                <input id="city" name="city" autoComplete="address-level2" required className={inputClass} />
              </Field>
              <Field label="State" htmlFor="state">
                <select id="state" name="state" autoComplete="address-level1" required className={inputClass}>
                  <option value=""></option>
                  {STATES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
              <Field label="ZIP code" htmlFor="zip">
                <input
                  id="zip"
                  name="zip"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  pattern="[0-9]{5}"
                  required
                  className={inputClass}
                />
              </Field>
            </div>
          </Card>

          <PreviewNotice>
            the USPS rate below is an estimate for the item&apos;s package size. Once Shippo and Stripe are connected
            (Chunk 4) it updates for your ZIP code and the button opens Stripe&apos;s secure payment page.
          </PreviewNotice>

          <div className="hidden md:block">
            <ButtonLink href="/orders/OSC-10491?new=1" className="w-full">
              <Lock className="size-4" aria-hidden="true" />
              Pay {formatUSD(total)}
            </ButtonLink>
          </div>
          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur md:hidden">
            <ButtonLink href="/orders/OSC-10491?new=1" className="w-full">
              <Lock className="size-4" aria-hidden="true" />
              Pay {formatUSD(total)}
            </ButtonLink>
          </div>
        </div>

        <aside className="md:order-none -order-1">
          <Card>
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
            <dl className="mt-5 space-y-2 border-t border-line pt-4">
              <div className="flex justify-between">
                <dt>Item</dt>
                <dd>{formatUSD(listing.priceCents)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>USPS shipping</dt>
                <dd>{formatUSD(shipping)}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-2 text-lg font-bold">
                <dt>Total</dt>
                <dd>{formatUSD(total)}</dd>
              </div>
            </dl>
            <p className="mt-4 flex gap-2 text-[15px] text-muted">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-trail" aria-hidden="true" />
              Protected payment: the seller is paid only after USPS scans the package. If it doesn&apos;t ship in 5 days
              you get a full refund.
            </p>
          </Card>
          <ButtonLink href={`/item/${listing.id}`} variant="ghost" className="mt-2 w-full">
            Back to item
          </ButtonLink>
        </aside>
      </div>
      <div className="h-20 md:hidden" />
    </div>
  );
}
