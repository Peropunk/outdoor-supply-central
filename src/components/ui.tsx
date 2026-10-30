import Link from "next/link";
import { Check } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { getCondition, type ConditionId } from "@/lib/catalog";
import type { Listing } from "@/lib/listings";
import { formatUSD } from "@/lib/money";
import { ORDER_STEPS } from "@/lib/orders";
import { GearPhoto } from "./GearPhoto";

type Variant = "primary" | "secondary" | "outline" | "ghost";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-pine text-white hover:bg-pine-dark",
  secondary: "bg-trail text-white hover:bg-trail-dark",
  outline: "border-2 border-pine text-pine bg-paper hover:bg-sand",
  ghost: "text-pine hover:bg-sand",
};

// Tap targets stay at least 48px tall (Chunk 7 accessibility check).
const BASE =
  "label-caps inline-flex min-h-12 items-center justify-center gap-2 rounded-md px-6 text-[15px] no-underline transition-colors disabled:cursor-not-allowed disabled:opacity-50";

export function buttonClass(variant: Variant = "primary", extra = "") {
  return `${BASE} ${VARIANTS[variant]} ${extra}`;
}

export function ButtonLink({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={buttonClass(variant, className)} {...props} />;
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={buttonClass(variant, className)} {...props} />;
}

export function ConditionBadge({ condition, withMeaning = false }: { condition: ConditionId; withMeaning?: boolean }) {
  const c = getCondition(condition);
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className="rounded-full border border-boot/30 bg-sand px-2.5 py-0.5 text-[13px] font-semibold text-boot">
        {c.label}
      </span>
      {withMeaning && <span className="text-[15px] text-muted">{c.meaning}</span>}
    </span>
  );
}

export function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link href={`/item/${listing.id}`} className="group block rounded-[var(--radius-card)] text-ink no-underline">
      <GearPhoto
        photo={listing.photos[0]}
        className="rounded-[var(--radius-card)] transition-transform group-hover:scale-[1.01]"
      />
      <div className="mt-2 px-0.5">
        <p className="price">{formatUSD(listing.priceCents)}</p>
        <p className="line-clamp-2 text-[15px] leading-snug">{listing.title}</p>
        <div className="mt-1.5">
          <ConditionBadge condition={listing.condition} />
        </div>
      </div>
    </Link>
  );
}

export function ListingGrid({ listings }: { listings: Listing[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-4">
      {listings.map((l) => (
        <li key={l.id}>
          <ListingCard listing={l} />
        </li>
      ))}
    </ul>
  );
}

/** Paid → Label ready → Shipped → Delivered, shown to buyer and seller. */
export function StatusBar({ current }: { current: number }) {
  return (
    <ol className="grid grid-cols-4 gap-1" aria-label="Order progress">
      {ORDER_STEPS.map((step, i) => {
        const done = i <= current;
        return (
          <li key={step} className="flex flex-col items-center text-center">
            <div className="flex w-full items-center">
              <span className={`h-1 flex-1 ${i === 0 ? "invisible" : done ? "bg-trail" : "bg-line"}`} />
              <span
                className={`flex size-8 shrink-0 items-center justify-center rounded-full border-2 ${
                  done ? "border-trail bg-trail text-white" : "border-line bg-paper text-muted"
                }`}
              >
                {done ? <Check className="size-4" aria-hidden="true" /> : <span className="text-sm">{i + 1}</span>}
              </span>
              <span
                className={`h-1 flex-1 ${i === ORDER_STEPS.length - 1 ? "invisible" : i < current ? "bg-trail" : "bg-line"}`}
              />
            </div>
            <span className={`mt-1.5 text-[13px] leading-tight ${done ? "font-semibold text-ink" : "text-muted"}`}>
              {step}
              {i === current && <span className="sr-only"> (current step)</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: ReactNode;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block font-semibold">
        {label}
      </label>
      {children}
      {hint && <p className="text-[14px] text-muted">{hint}</p>}
    </div>
  );
}

export const inputClass =
  "block w-full min-h-12 rounded-md border border-line bg-paper px-3 py-2 text-ink placeholder:text-muted/70 focus:border-trail focus:outline-none focus:ring-2 focus:ring-trail/30";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[var(--radius-card)] border border-line bg-paper p-5 ${className}`}>{children}</div>;
}

/** Marks screens running on sample data so JD's review is not confused with live data. */
export function PreviewNotice({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-md border border-dashed border-olive/50 bg-sand px-4 py-2.5 text-[14px] text-muted">
      <span className="font-semibold text-olive">Preview:</span> {children}
    </p>
  );
}

export function PageTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl sm:text-4xl">{children}</h1>
      {sub && <p className="mt-2 text-muted">{sub}</p>}
    </div>
  );
}
