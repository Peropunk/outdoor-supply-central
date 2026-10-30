import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, Field, PageTitle, PreviewNotice, buttonClass, inputClass } from "@/components/ui";
import { getOrder } from "@/lib/orders";

export const metadata: Metadata = { title: "Report a problem" };

const REASONS = ["It hasn't arrived", "It's not as described", "It arrived damaged", "Something else"];

// Decision 2 default: one message thread per order shared by buyer, seller and
// admin, with an email alert to admin. Messages are stored in `order_messages`.
export default async function ProblemPage(props: PageProps<"/orders/[number]/problem">) {
  const { number } = await props.params;
  const found = await getOrder(number);
  if (!found) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 pt-8">
      <PageTitle sub={`Order ${number} · ${found.listing.title}`}>Report a problem</PageTitle>
      <Card className="space-y-5">
        <p className="text-muted">
          This starts one conversation between you, the other person on the order and Outdoor Supply Central. We reply
          within one business day.
        </p>
        <fieldset>
          <legend className="font-semibold">What&apos;s wrong?</legend>
          <div className="mt-2 space-y-1">
            {REASONS.map((r) => (
              <label key={r} className="flex min-h-11 items-center gap-3">
                <input type="radio" name="reason" value={r} className="size-5 accent-trail" />
                {r}
              </label>
            ))}
          </div>
        </fieldset>
        <Field label="Tell us what happened" htmlFor="message" hint="You can add photos once the thread opens.">
          <textarea id="message" rows={5} className={inputClass} />
        </Field>
        <button type="button" className={buttonClass("primary", "w-full")} disabled>
          Send
        </button>
        <PreviewNotice>sending turns on with the database in Chunk 6.</PreviewNotice>
      </Card>
    </div>
  );
}
