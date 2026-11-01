import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, Field, PageTitle, PreviewNotice, buttonClass, inputClass } from "@/components/ui";
import { getListing } from "@/lib/listings";

export const metadata: Metadata = { title: "Report a listing" };

const REASONS = ["It's a banned item", "Looks like a scam", "Wrong category or condition", "Something else"];

// Reports land in the admin reports queue (Chunk 6). Signed-in users only.
export default async function ReportListingPage(props: PageProps<"/item/[id]/report">) {
  const listing = await getListing((await props.params).id);
  if (!listing) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 pt-8">
      <PageTitle sub={listing.title}>Report this listing</PageTitle>
      <Card className="space-y-5">
        <fieldset>
          <legend className="font-semibold">Why are you reporting it?</legend>
          <div className="mt-2 space-y-1">
            {REASONS.map((r) => (
              <label key={r} className="flex min-h-11 items-center gap-3">
                <input type="radio" name="reason" value={r} className="size-5 accent-trail" />
                {r}
              </label>
            ))}
          </div>
        </fieldset>
        <Field label="Anything else we should know? (optional)" htmlFor="details">
          <textarea id="details" rows={4} className={inputClass} />
        </Field>
        <button type="button" className={buttonClass("primary", "w-full")} disabled>
          Send report
        </button>
        <PreviewNotice>reports go to the admin queue once the database is connected.</PreviewNotice>
      </Card>
    </div>
  );
}
