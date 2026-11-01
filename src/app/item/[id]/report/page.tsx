import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CircleAlert, CircleCheck } from "lucide-react";
import { Card, Field, PageTitle, PreviewNotice, buttonClass, inputClass } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getListing } from "@/lib/listings";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { reportListing } from "../../../listings/actions";

export const metadata: Metadata = { title: "Report a listing" };

const REASONS = ["It's a banned item", "Looks like a scam", "Wrong category or condition", "Something else"];

// Reports land in the admin reports queue (Chunk 6). Signed-in users only.
export default async function ReportListingPage(props: PageProps<"/item/[id]/report">) {
  const [{ id }, sp] = await Promise.all([props.params, props.searchParams]);
  const listing = await getListing(id);
  if (!listing) notFound();
  if (isSupabaseConfigured) await requireUser();

  if (sp.sent === "1") {
    return (
      <div className="mx-auto max-w-lg px-4 pt-16 text-center">
        <CircleCheck className="mx-auto size-12 text-trail" aria-hidden="true" />
        <h1 className="mt-4 text-3xl">Thanks for letting us know</h1>
        <p className="mt-2 text-muted">We&apos;ll review this listing and take it down if it breaks the rules.</p>
        <Link href={`/item/${listing.id}`} className={buttonClass("outline", "mt-6")}>
          Back to the listing
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pt-8">
      <PageTitle sub={listing.title}>Report this listing</PageTitle>
      {sp.error === "1" && (
        <p
          role="alert"
          className="mb-6 flex items-center gap-2 rounded-md border border-alert/30 bg-alert/5 p-4 text-alert"
        >
          <CircleAlert className="size-5 shrink-0" aria-hidden="true" /> Pick a reason and try again.
        </p>
      )}
      <Card>
        <form action={reportListing.bind(null, listing.id)} className="space-y-5">
          <fieldset>
            <legend className="font-semibold">Why are you reporting it?</legend>
            <div className="mt-2 space-y-1">
              {REASONS.map((r) => (
                <label key={r} className="flex min-h-11 items-center gap-3">
                  <input type="radio" name="reason" value={r} required className="size-5 accent-trail" />
                  {r}
                </label>
              ))}
            </div>
          </fieldset>
          <Field label="Anything else we should know? (optional)" htmlFor="details">
            <textarea id="details" name="details" rows={4} maxLength={2000} className={inputClass} />
          </Field>
          <button type="submit" className={buttonClass("primary", "w-full")} disabled={!isSupabaseConfigured}>
            Send report
          </button>
          {!isSupabaseConfigured && (
            <PreviewNotice>reports go to the admin queue once Supabase is connected.</PreviewNotice>
          )}
        </form>
      </Card>
    </div>
  );
}
