import type { Metadata } from "next";
import Link from "next/link";
import { CircleCheck, ExternalLink, Pause, Pencil, Play, Trash } from "lucide-react";
import { GearPhoto } from "@/components/GearPhoto";
import { ButtonLink, Card, ConditionBadge, PreviewNotice, StatusBar, buttonClass } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { SAMPLE_SELLER_ID, getListingsBySeller, type ListingStatus } from "@/lib/listings";
import { formatUSD } from "@/lib/money";
import { currentStepIndex, getOrders } from "@/lib/orders";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { deleteListing, setListingPaused } from "../listings/actions";

export const metadata: Metadata = { title: "My dashboard" };

const TABS = [
  { id: "ship", label: "Sales to ship" },
  { id: "listings", label: "My listings" },
  { id: "payouts", label: "Payouts" },
  { id: "purchases", label: "My purchases" },
] as const;
type TabId = (typeof TABS)[number]["id"];

const dayFmt = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" });

const STATUS_LABEL: Record<ListingStatus, string> = {
  active: "For sale",
  reserved: "In checkout",
  sold: "Sold",
  paused: "Paused",
  removed: "Removed",
};

export default async function DashboardPage(props: PageProps<"/dashboard">) {
  const sp = await props.searchParams;
  const live = isSupabaseConfigured;
  const user = live ? await requireUser() : null;

  // Real listings come from Supabase. Sales, payouts and purchases stay on
  // sample data in preview mode and are empty until checkout lands (Chunk 4).
  const sellerId = user?.id ?? SAMPLE_SELLER_ID;
  const [listings, orders] = await Promise.all([getListingsBySeller(sellerId), live ? [] : getOrders()]);
  const sales = orders.filter(({ listing }) => listing.seller.id === sellerId);
  const toShip = sales.filter(({ order }) => order.status === "label_ready" || order.status === "paid");
  const purchases = orders.filter(({ listing }) => listing.seller.id !== sellerId);

  const defaultTab: TabId = live && !toShip.length ? "listings" : "ship";
  const tab: TabId = TABS.find((t) => t.id === sp.tab)?.id ?? defaultTab;

  return (
    <div className="mx-auto max-w-4xl px-4 pt-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-muted">Hi, {user ? user.displayName || "there" : "JD"}</p>
          <h1 className="text-3xl">My dashboard</h1>
        </div>
        <ButtonLink href="/sell">Sell an item</ButtonLink>
      </div>

      <nav
        aria-label="Dashboard sections"
        className="-mx-4 mt-6 overflow-x-auto border-b border-line px-4 no-scrollbar"
      >
        <ul className="flex gap-1">
          {TABS.map((t) => (
            <li key={t.id}>
              <Link
                href={`/dashboard?tab=${t.id}`}
                aria-current={tab === t.id ? "page" : undefined}
                className={`flex min-h-12 items-center gap-2 border-b-[3px] px-3 whitespace-nowrap no-underline ${
                  tab === t.id ? "border-pine font-semibold text-pine" : "border-transparent text-muted"
                }`}
              >
                {t.label}
                {t.id === "ship" && toShip.length > 0 && (
                  <span className="rounded-full bg-boot px-2 text-[13px] font-semibold text-white">
                    {toShip.length}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {sp.updated === "1" && (
        <p role="status" className="mt-6 flex items-center gap-2 rounded-md bg-pine px-4 py-3 text-white">
          <CircleCheck className="size-5" aria-hidden="true" /> Listing updated.
        </p>
      )}

      <div className="mt-6 space-y-4">
        {tab === "ship" &&
          (toShip.length ? (
            toShip.map(({ order, listing }) => (
              <Card key={order.number}>
                <div className="flex gap-4">
                  <GearPhoto photo={listing.photos[0]} size="sm" className="w-20 shrink-0 rounded-md" />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 font-semibold">{listing.title}</p>
                    <p className="text-[15px] text-boot">Ship by {dayFmt.format(new Date(order.shipBy))}</p>
                    <p className="text-[15px] text-muted">
                      To {order.buyer.name}, {order.buyer.city}, {order.buyer.state}
                    </p>
                  </div>
                </div>
                <Link href={`/orders/${order.number}?view=seller`} className={buttonClass("primary", "mt-4 w-full")}>
                  Ship it
                </Link>
              </Card>
            ))
          ) : (
            <Empty text="Nothing to ship right now. We'll email you as soon as something sells." />
          ))}

        {tab === "listings" &&
          (listings.length ? (
            listings.map((l) => (
              <Card key={l.id} className="flex items-center gap-4">
                <GearPhoto photo={l.photos[0]} size="sm" className="w-20 shrink-0 rounded-md" />
                <div className="min-w-0 flex-1">
                  <Link href={`/item/${l.id}`} className="line-clamp-1 font-semibold text-ink">
                    {l.title}
                  </Link>
                  <p className="flex flex-wrap items-center gap-2 text-[15px]">
                    <span className="font-bold">{formatUSD(l.priceCents)}</span>
                    <ConditionBadge condition={l.condition} />
                    <span className={l.status === "paused" ? "font-semibold text-boot" : "text-muted"}>
                      {STATUS_LABEL[l.status]}
                    </span>
                  </p>
                </div>
                {live && (l.status === "active" || l.status === "paused") && (
                  <ListingTools id={l.id} title={l.title} paused={l.status === "paused"} />
                )}
              </Card>
            ))
          ) : (
            <Empty text="You haven't listed anything yet. It takes about three minutes from your phone." />
          ))}

        {tab === "payouts" && live && !sales.length && <Empty text="Payouts show here once your first sale ships." />}

        {tab === "payouts" && (!live || sales.length > 0) && (
          <>
            <Card>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-muted">Paid to you</dt>
                  <dd className="text-2xl font-bold">
                    {formatUSD(
                      sales
                        .filter(({ order }) => order.sellerPaidAt)
                        .reduce((sum, { order }) => sum + order.itemCents - order.commissionCents, 0),
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">On the way</dt>
                  <dd className="text-2xl font-bold">
                    {formatUSD(
                      sales
                        .filter(({ order }) => !order.sellerPaidAt)
                        .reduce((sum, { order }) => sum + order.itemCents - order.commissionCents, 0),
                    )}
                  </dd>
                  <p className="text-[14px] text-muted">Released at USPS&apos;s first scan</p>
                </div>
              </dl>
              <a href="#" className={buttonClass("outline", "mt-5 w-full sm:w-auto")}>
                Open my Stripe payouts
                <ExternalLink className="size-4" aria-hidden="true" />
              </a>
            </Card>
            {sales.map(({ order, listing }) => (
              <Card key={order.number} className="flex justify-between gap-4">
                <div className="min-w-0">
                  <p className="line-clamp-1 font-semibold">{listing.title}</p>
                  <p className="text-[15px] text-muted">Order {order.number}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatUSD(order.itemCents - order.commissionCents)}</p>
                  <p className="text-[14px] text-muted">{order.sellerPaidAt ? "Paid" : "Waiting for scan"}</p>
                </div>
              </Card>
            ))}
          </>
        )}

        {tab === "purchases" &&
          (purchases.length ? (
            purchases.map(({ order, listing }) => (
              <Card key={order.number}>
                <Link href={`/orders/${order.number}`} className="line-clamp-1 font-semibold text-ink">
                  {listing.title}
                </Link>
                <p className="mb-4 text-[15px] text-muted">Order {order.number}</p>
                <StatusBar current={currentStepIndex(order.status)} />
              </Card>
            ))
          ) : (
            <Empty text="You haven't bought anything yet." />
          ))}
      </div>

      <div className="mt-8">
        {live ? (
          <PreviewNotice>sales, payouts and purchases appear here once checkout goes live in Chunk 4.</PreviewNotice>
        ) : (
          <PreviewNotice>
            sample seller data. Your own listings and sales show here once Supabase is connected.
          </PreviewNotice>
        )}
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p className="rounded-[var(--radius-card)] border border-dashed border-line bg-paper p-8 text-center text-muted">
      {text}
    </p>
  );
}

const iconButton = "flex size-11 items-center justify-center rounded-md text-ink no-underline hover:bg-sand";

function ListingTools({ id, title, paused }: { id: string; title: string; paused: boolean }) {
  return (
    <div className="flex shrink-0 items-center">
      <Link href={`/listings/${id}/edit`} className={iconButton} aria-label={`Edit ${title}`}>
        <Pencil className="size-5" aria-hidden="true" />
      </Link>
      <form action={setListingPaused.bind(null, id, !paused)}>
        <button type="submit" className={iconButton} aria-label={`${paused ? "Put back on sale" : "Pause"} ${title}`}>
          {paused ? <Play className="size-5" aria-hidden="true" /> : <Pause className="size-5" aria-hidden="true" />}
        </button>
      </form>
      <details className="relative">
        <summary className={`${iconButton} cursor-pointer list-none`} aria-label={`Delete ${title}`}>
          <Trash className="size-5" aria-hidden="true" />
        </summary>
        <form
          action={deleteListing.bind(null, id)}
          className="absolute right-0 z-10 mt-1 w-56 rounded-md border border-line bg-paper p-3 shadow-lg"
        >
          <p className="text-[15px]">Delete this listing and its photos for good?</p>
          <button
            type="submit"
            className="label-caps mt-2 inline-flex min-h-10 w-full items-center justify-center rounded-md bg-alert px-4 text-[14px] text-white hover:bg-alert/90"
          >
            Delete
          </button>
        </form>
      </details>
    </div>
  );
}
