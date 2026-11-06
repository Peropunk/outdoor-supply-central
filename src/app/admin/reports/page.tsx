import type { Metadata } from "next";
import Link from "next/link";
import { Card, buttonClass, inputClass } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { adminDismissReport, adminRemoveListing } from "../actions";
import { AdminNav } from "../AdminNav";

export const metadata: Metadata = { title: "Admin: reports", robots: { index: false } };

const dateFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

type Row = {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  listing_id: string | null;
  listings: { title: string; status: string } | null;
  reporter: { display_name: string } | null;
};

/** Listings members have reported. Removing the listing resolves every open report on it. */
export default async function AdminReportsPage(props: PageProps<"/admin/reports">) {
  await requireAdmin();
  const sp = await props.searchParams;
  const showAll = sp.show === "all";
  let query = createAdminClient()
    .from("reports")
    .select(
      "id, reason, details, status, created_at, listing_id, listings(title, status), reporter:profiles!reports_reporter_id_fkey(display_name)",
    )
    .order("created_at", { ascending: false })
    .limit(100);
  if (!showAll) query = query.eq("status", "open");
  const { data } = await query;
  const reports = (data ?? []) as unknown as Row[];
  const backTo = showAll ? "/admin/reports?show=all" : "/admin/reports";

  return (
    <div className="mx-auto max-w-4xl px-4 pt-8">
      <AdminNav current="/admin/reports" msg={sp.msg} />
      <p className="mt-6 text-[15px]">
        {showAll ? (
          <Link href="/admin/reports">Show open reports only</Link>
        ) : (
          <Link href="/admin/reports?show=all">Show resolved and dismissed too</Link>
        )}
      </p>

      <div className="mt-4 space-y-3">
        {!reports.length && <p className="text-muted">{showAll ? "No reports yet." : "No open reports. Nice."}</p>}
        {reports.map((r) => (
          <Card key={r.id} className="space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                {r.listing_id ? (
                  <Link href={`/item/${r.listing_id}`} className="line-clamp-1 font-semibold text-ink">
                    {r.listings?.title ?? "Listing"}
                  </Link>
                ) : (
                  <p className="font-semibold">Listing deleted</p>
                )}
                <p className="text-[14px] text-muted">
                  Reported by {r.reporter?.display_name || "a member"} · {dateFmt.format(new Date(r.created_at))}
                  {r.listings && ` · listing ${r.listings.status}`}
                </p>
              </div>
              {r.status !== "open" && (
                <span className="rounded-full bg-line px-3 py-1 text-[14px] font-semibold">{r.status}</span>
              )}
            </div>
            <p className="font-semibold text-boot">{r.reason}</p>
            {r.details && <p className="whitespace-pre-line">{r.details}</p>}

            {r.status === "open" && (
              <div className="flex flex-wrap gap-2 border-t border-line pt-3">
                {r.listing_id && (r.listings?.status === "active" || r.listings?.status === "paused") && (
                  <details className="relative">
                    <summary className="label-caps inline-flex min-h-10 cursor-pointer list-none items-center rounded-md border border-alert/40 px-4 text-[14px] text-alert hover:bg-alert/5">
                      Remove listing
                    </summary>
                    <form
                      action={adminRemoveListing.bind(null, r.listing_id)}
                      className="absolute left-0 z-10 mt-1 w-72 space-y-2 rounded-md border border-line bg-paper p-3 shadow-lg"
                    >
                      <input type="hidden" name="back" value={backTo} />
                      <label htmlFor={`why-${r.id}`} className="block text-[15px]">
                        Reason (emailed to the seller)
                      </label>
                      <input
                        id={`why-${r.id}`}
                        name="why"
                        maxLength={500}
                        defaultValue={r.reason}
                        className={inputClass}
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
                <form action={adminDismissReport.bind(null, r.id)}>
                  <input type="hidden" name="back" value={backTo} />
                  <button type="submit" className={buttonClass("outline", "min-h-10")}>
                    Dismiss
                  </button>
                </form>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
