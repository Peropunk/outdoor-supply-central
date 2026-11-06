import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { Card, buttonClass, inputClass } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { formatUSD } from "@/lib/money";
import { createAdminClient } from "@/lib/supabase/server";
import { adminRemoveListing, adminRestoreListing } from "../actions";
import { AdminNav } from "../AdminNav";

export const metadata: Metadata = { title: "Admin: listings", robots: { index: false } };

const STATUSES = ["all", "active", "paused", "reserved", "sold", "removed"] as const;
const LABEL: Record<string, string> = {
  active: "For sale",
  paused: "Paused",
  reserved: "In checkout",
  sold: "Sold",
  removed: "Removed",
};
const dayFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

type Row = {
  id: string;
  title: string;
  price_cents: number;
  status: string;
  created_at: string;
  seller: { display_name: string } | null;
  reports: { count: number }[] | null;
};

export default async function AdminListingsPage(props: PageProps<"/admin/listings">) {
  await requireAdmin();
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  const status = STATUSES.find((s) => s === sp.status) ?? "all";

  let query = createAdminClient()
    .from("listings")
    .select(
      "id, title, price_cents, status, created_at, seller:profiles!listings_seller_id_fkey(display_name), reports(count)",
    )
    .order("created_at", { ascending: false })
    .limit(100);
  if (q) query = query.ilike("title", `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`);
  if (status !== "all") query = query.eq("status", status);
  const { data } = await query;
  const listings = (data ?? []) as unknown as Row[];
  const backTo = `/admin/listings?${new URLSearchParams({ ...(q && { q }), ...(status !== "all" && { status }) })}`;

  return (
    <div className="mx-auto max-w-4xl px-4 pt-8">
      <AdminNav current="/admin/listings" msg={sp.msg} />

      <form action="/admin/listings" role="search" className="mt-6 flex flex-col gap-2 sm:flex-row">
        <label htmlFor="q" className="sr-only">
          Find a listing
        </label>
        <input id="q" name="q" defaultValue={q} placeholder="Listing title" className={inputClass} />
        <label htmlFor="status" className="sr-only">
          Status
        </label>
        <select id="status" name="status" defaultValue={status} className={`${inputClass} sm:w-44`}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "Any status" : LABEL[s]}
            </option>
          ))}
        </select>
        <button type="submit" className={buttonClass("primary", "shrink-0 px-4")} aria-label="Search listings">
          <Search className="size-5" aria-hidden="true" />
        </button>
      </form>

      <div className="mt-6 space-y-3">
        {!listings.length && <p className="text-muted">No listings match.</p>}
        {listings.map((l) => {
          const reports = l.reports?.[0]?.count ?? 0;
          return (
            <Card key={l.id} className="flex flex-wrap items-center gap-x-4 gap-y-3">
              <div className="min-w-0 flex-1 basis-56">
                <Link href={`/item/${l.id}`} className="line-clamp-1 font-semibold text-ink">
                  {l.title}
                </Link>
                <p className="text-[15px] text-muted">
                  {formatUSD(l.price_cents)} · {l.seller?.display_name || "Seller"} · listed{" "}
                  {dayFmt.format(new Date(l.created_at))}
                </p>
                <p className="flex flex-wrap gap-2 text-[14px]">
                  <span className={l.status === "removed" ? "font-semibold text-alert" : "font-semibold"}>
                    {LABEL[l.status] ?? l.status}
                  </span>
                  {reports > 0 && (
                    <span className="font-semibold text-boot">
                      {reports} report{reports > 1 ? "s" : ""}
                    </span>
                  )}
                </p>
              </div>
              {(l.status === "active" || l.status === "paused") && (
                <details className="relative">
                  <summary className="label-caps inline-flex min-h-10 cursor-pointer list-none items-center rounded-md border border-alert/40 px-4 text-[14px] text-alert hover:bg-alert/5">
                    Remove
                  </summary>
                  <form
                    action={adminRemoveListing.bind(null, l.id)}
                    className="absolute right-0 z-10 mt-1 w-72 space-y-2 rounded-md border border-line bg-paper p-3 shadow-lg"
                  >
                    <input type="hidden" name="back" value={backTo} />
                    <label htmlFor={`why-${l.id}`} className="block text-[15px]">
                      Reason (emailed to the seller)
                    </label>
                    <input
                      id={`why-${l.id}`}
                      name="why"
                      maxLength={500}
                      className={inputClass}
                      placeholder="e.g. Fuel canisters can't be shipped"
                    />
                    <button
                      type="submit"
                      className="label-caps inline-flex min-h-10 w-full items-center justify-center rounded-md bg-alert px-4 text-[14px] text-white hover:bg-alert/90"
                    >
                      Remove listing
                    </button>
                  </form>
                </details>
              )}
              {l.status === "removed" && (
                <form action={adminRestoreListing.bind(null, l.id)}>
                  <input type="hidden" name="back" value={backTo} />
                  <button type="submit" className={buttonClass("outline", "min-h-10")}>
                    Restore
                  </button>
                </form>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
