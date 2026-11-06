import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, PageTitle, PreviewNotice } from "@/components/ui";
import { Thread } from "@/components/Thread";
import { requireUser } from "@/lib/auth";
import { PROBLEM_REASONS } from "@/lib/catalog";
import { getThread } from "@/lib/messages";
import { getOrder } from "@/lib/orders";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createAdminClient } from "@/lib/supabase/server";
import { ThreadForm } from "./ThreadForm";

export const metadata: Metadata = { title: "Report a problem" };

// Decision 2 default: one message thread per order shared by buyer, seller and
// admin, with an email alert to admin. Messages are stored in `order_messages`.
export default async function ProblemPage(props: PageProps<"/orders/[number]/problem">) {
  const { number } = await props.params;
  if (!isSupabaseConfigured) return <PreviewProblem number={number} />;

  const user = await requireUser(`/orders/${number}/problem`);
  const { data: order } = await createAdminClient()
    .from("orders")
    .select("id, number, status, buyer_id, seller_id, listings(title)")
    .eq("number", number)
    .maybeSingle();
  const isParty = order && (order.buyer_id === user.id || order.seller_id === user.id);
  if (!order || order.status === "pending_payment" || order.status === "cancelled") notFound();
  if (!isParty && user.role !== "admin") notFound();

  const messages = await getThread(order, user.id);
  const title = (order.listings as unknown as { title: string } | null)?.title ?? "your order";
  const first = messages.length === 0;

  return (
    <div className="mx-auto max-w-2xl px-4 pt-8">
      <Link href={`/orders/${number}`} className="text-[15px]">
        ← Order {number}
      </Link>
      <PageTitle sub={`Order ${number} · ${title}`}>{first ? "Report a problem" : "Problem with this order"}</PageTitle>

      {!first && (
        <div className="mb-6">
          <Thread messages={messages} />
        </div>
      )}

      <Card className="space-y-5">
        {first && (
          <p className="text-muted">
            This starts one conversation between you, the other person on the order and Outdoor Supply Central. We reply
            within one business day.
          </p>
        )}
        <ThreadForm number={number} orderId={order.id} userId={user.id} first={first} />
      </Card>
    </div>
  );
}

/** Preview mode (no database): the form as it will look, with sending switched off. */
async function PreviewProblem({ number }: { number: string }) {
  const found = await getOrder(number);
  if (!found) notFound();
  return (
    <div className="mx-auto max-w-2xl px-4 pt-8">
      <PageTitle sub={`Order ${number} · ${found.listing.title}`}>Report a problem</PageTitle>
      <Card className="space-y-5">
        <fieldset>
          <legend className="font-semibold">What&apos;s wrong?</legend>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            {PROBLEM_REASONS.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </fieldset>
        <PreviewNotice>sending works once Supabase is connected.</PreviewNotice>
      </Card>
    </div>
  );
}
